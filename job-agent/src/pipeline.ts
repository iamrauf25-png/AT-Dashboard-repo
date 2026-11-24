import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Config } from "./config.js";
import { OUTPUT_DIR } from "./config.js";
import {
  classifyEmail,
  draftFollowUp,
  type EmailClass,
  draftMaterials,
  extractJobsFromAlert,
  pool,
  scoreJob,
  type Materials,
} from "./claude.js";
import type { ApplyResult, SavedMaterials } from "./apply.js";
import { whatsapp } from "./notify.js";
import { writeCvDocx } from "./cv-docx.js";
import { writeCvPdf } from "./cv-pdf.js";
import { hardFilter } from "./filter.js";
import { fetchNewMail, loadGmailState, saveGmailState, sendDigest } from "./gmail.js";
import { actOnEmail, realDeps, type Deps } from "./replies.js";
import { fetchAll, readManualFile } from "./sources/index.js";
import type { Store } from "./store.js";
import type { InboxEvent, Job, JobStatus, RawJob } from "./types.js";

const today = () => new Date().toISOString().slice(0, 10);
const CONCURRENCY = 4;
const ACTIVE: JobStatus[] = ["shortlisted", "applied", "assessment", "interview", "offer"];

function reportFailures<T>(results: PromiseSettledResult<unknown>[], items: T[], label: (t: T) => string) {
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`  ! ${label(items[i])}: ${(r.reason as Error).message}`);
  });
}

// ---------- Fetch / filter / score ----------

export async function fetchStep(store: Store, cfg: Config, importFiles: string[] = []) {
  console.log("Fetching jobs...");
  const raw = await fetchAll(cfg);
  for (const f of importFiles) {
    const rows = readManualFile(f);
    console.log(`  import ${path.basename(f)}: ${rows.length} jobs`);
    raw.push(...rows);
  }
  const added = store.addRaw(raw);
  store.save();
  console.log(`  ${added.length} new (${raw.length - added.length} already seen or duplicates)`);
  return added;
}

export function filterStep(store: Store, cfg: Config) {
  const fresh = store.byStatus("new");
  let passed = 0;
  const reasons: Record<string, number> = {};
  for (const job of fresh) {
    const reason = hardFilter(job, cfg);
    if (reason) {
      job.status = "filtered_out";
      job.filterReason = reason;
      const bucket = reason.replace(/".*"/, "...");
      reasons[bucket] = (reasons[bucket] ?? 0) + 1;
    } else {
      passed++;
    }
  }
  store.save();
  console.log(`Filtering: ${passed} passed, ${fresh.length - passed} dropped`);
  for (const [r, n] of Object.entries(reasons)) console.log(`  - ${r}: ${n}`);
}

export async function scoreStep(store: Store, cfg: Config) {
  // "new" here means it passed the filter and is not yet scored.
  const queue = store
    .byStatus("new")
    .sort((a, b) => (b.postedAt ?? b.firstSeen).localeCompare(a.postedAt ?? a.firstSeen))
    .slice(0, cfg.scoring.max_jobs_per_run);
  if (!queue.length) return console.log("Scoring: nothing to score");
  console.log(`Scoring ${queue.length} jobs with Claude...`);
  let done = 0;
  const results = await pool(queue, CONCURRENCY, async (job) => {
    job.score = await scoreJob(job, cfg);
    job.status = "scored";
    process.stdout.write(`\r  ${++done}/${queue.length}`);
    store.save();
  });
  process.stdout.write("\n");
  reportFailures(results, queue, (j) => `${j.company} - ${j.title}`);
}

// ---------- Shortlist + materials ----------

export async function shortlistStep(store: Store, cfg: Config): Promise<Job[]> {
  const picks = store
    .byStatus("scored")
    .filter((j) => (j.score?.overall ?? 0) >= cfg.scoring.min_score && j.score?.verdict !== "weak")
    .sort((a, b) => b.score!.overall - a.score!.overall)
    .slice(0, cfg.scoring.top_n);
  if (!picks.length) {
    console.log(`Shortlist: no scored job reached ${cfg.scoring.min_score}`);
    return [];
  }
  console.log(`Tailoring CVs and drafting materials for the top ${picks.length}...`);
  const results = await pool(picks, CONCURRENCY, async (job) => {
    await draftFor(job, cfg);
    job.status = "shortlisted";
    store.save();
  });
  reportFailures(results, picks, (j) => `${j.company} - ${j.title}`);
  return picks.filter((_, i) => results[i].status === "fulfilled");
}

/** Writes output/<date>/<company-role>/materials.md and a tailored CV (.docx). Returns the folder. */
export async function draftFor(job: Job, cfg: Config) {
  const { materials: m, track, warnings } = await draftMaterials(job, cfg);
  const dir = path.join(OUTPUT_DIR, today(), slug(`${job.company}-${job.title}`));
  fs.mkdirSync(dir, { recursive: true });
  const base = `${m.tailored_cv.name.trim().replace(/\s+/g, "_")}_CV_${slug(job.company, 30)}`;
  const cvFile = `${base}.docx`;
  await writeCvDocx(m.tailored_cv, path.join(dir, cvFile));
  await writeCvPdf(m.tailored_cv, path.join(dir, `${base}.pdf`));
  const saved: SavedMaterials = { subject: m.application_email.subject, body: m.application_email.body, pdf: `${base}.pdf`, warnings };
  fs.writeFileSync(path.join(dir, "materials.json"), JSON.stringify(saved, null, 2));
  fs.writeFileSync(path.join(dir, "materials.md"), materialsMarkdown(job, m, track.name, path.basename(track.cv_path), cvFile, warnings));
  job.materialsDir = path.relative(process.cwd(), dir);
  return dir;
}

// ---------- Gmail ----------

const STATUS_FOR: Record<string, JobStatus | undefined> = {
  application_received: "applied",
  assessment: "assessment",
  interview_invite: "interview",
  offer: "offer",
  rejection: "rejected",
};
const RANK: Partial<Record<JobStatus, number>> = { shortlisted: 0, applied: 1, assessment: 2, interview: 3, offer: 4, rejected: 5 };

/** Reads new job alerts and recruiter replies from Gmail. Returns the inbox events found this run. */
export async function gmailStep(store: Store, cfg: Config, fetchMail = fetchNewMail, deps: Deps = realDeps): Promise<InboxEvent[]> {
  const g = cfg.gmail;
  if (!g?.enabled) return [];
  console.log("Checking Gmail...");
  const state = loadGmailState();
  const startedAt = new Date().toISOString();
  const active = store.byStatus(...ACTIVE);
  const { alerts, replies } = await fetchMail(g, state, [...new Set(active.map((j) => j.company))]);
  console.log(`  ${alerts.length} job-alert email(s), ${replies.length} possible recruiter email(s)`);

  // Job alerts → jobs
  const raw: RawJob[] = [];
  const alertResults = await pool(alerts, CONCURRENCY, async (mail) => {
    for (const j of await extractJobsFromAlert(mail, cfg)) {
      raw.push({
        source: "gmail",
        sourceId: createHash("sha1").update(j.url || `${j.company}|${j.title}`).digest("hex").slice(0, 10),
        company: j.company,
        title: j.title,
        location: j.location,
        remote: /remote|work from home/i.test(j.location),
        url: j.url,
        description: `${j.summary}\n(From a job-alert email: ${mail.subject})`,
        snippetOnly: true,
        postedAt: mail.date,
      });
    }
  });
  reportFailures(alertResults, alerts, (m) => `alert "${m.subject}"`);
  const added = store.addRaw(raw);
  if (alerts.length) console.log(`  ${added.length} new job(s) from alerts`);

  // Replies → classify (in parallel), then act on each one in order: status, calendar, reply, WhatsApp.
  const events: InboxEvent[] = [];
  const activeList = active.map((j) => ({ id: j.id, company: j.company, title: j.title, status: j.status }));
  const classified: (EmailClass | null)[] = new Array(replies.length).fill(null);
  const replyResults = await pool(replies, CONCURRENCY, async (mail, i) => {
    classified[i] = await classifyEmail(mail, activeList, cfg);
  });
  reportFailures(replyResults, replies, (m) => `email "${m.subject}"`);

  const budget = { replies: cfg.replies.max_per_run };
  for (const [i, mail] of replies.entries()) {
    const c = classified[i];
    if (!c || c.kind === "not_job_related") continue;
    const event: InboxEvent = { at: mail.date, from: mail.from, subject: mail.subject, kind: c.kind, summary: c.summary, action: c.action || undefined };
    events.push(event);
    const job = c.application_id !== "none" ? store.jobs[c.application_id] : undefined;
    if (job) {
      event.jobId = job.id;
      (job.inbox ??= []).push(event);
      const next = STATUS_FOR[c.kind];
      if (next && (RANK[next] ?? 0) > (RANK[job.status] ?? -1)) {
        job.status = next;
        if (next === "applied" && !job.appliedAt) job.appliedAt = mail.date;
        console.log(`  ${job.company} — ${job.title}: now ${next}`);
      }
    } else {
      state.unmatched.push({ ...event, summary: `${c.company ? `${c.company}: ` : ""}${c.role ? `${c.role} — ` : ""}${c.summary}` });
    }
    try {
      await actOnEmail(mail, c, job, event, store, cfg, budget, deps);
      if (event.handled) console.log(`  ${c.kind.replace(/_/g, " ")} (${c.company || mail.fromAddress}): ${event.handled}`);
    } catch (e) {
      console.warn(`  ! could not act on "${mail.subject}": ${(e as Error).message}`);
      await deps.notify(cfg, `⚠️ Job agent could not handle an email: "${mail.subject}" from ${mail.from}. Please check it.`);
    }
    store.save();
  }

  state.lastCheck = startedAt;
  saveGmailState(state);
  store.save();
  return events;
}

export async function digestStep(store: Store, cfg: Config, fresh: Job[], events: InboxEvent[], send = sendDigest) {
  const g = cfg.gmail;
  if (!g?.enabled || !g.send_digest) return;
  const due = followUpsDue(store, cfg);
  if (!fresh.length && !events.length && !due.length) return console.log("Digest: nothing new, not sent");

  const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const attachments: { filename: string; path: string }[] = [];
  const jobs = fresh.map((j) => {
    const dir = j.materialsDir ? path.resolve(j.materialsDir) : "";
    const files = dir && fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    for (const f of files.filter((f) => f.endsWith(".docx"))) attachments.push({ filename: f, path: path.join(dir, f) });
    const recruiter = dir ? (fs.readFileSync(path.join(dir, "materials.md"), "utf8").match(/## Recruiter message\n\n([\s\S]*?)\n\n##/)?.[1] ?? "") : "";
    return `<li><b>${j.score?.overall}</b> · <a href="${e(j.url)}">${e(j.title)}</a> — ${e(j.company)}, ${e(j.location)}<br>
      <small>CV: ${e(j.score?.best_track ?? "")} · ${e(j.score?.reasons[0] ?? "")}${j.snippetOnly ? " · <i>alert summary only: open the link and run <code>jd</code> for a full tailoring</i>" : ""}</small>
      ${recruiter ? `<br><small>Recruiter note: ${e(recruiter)}</small>` : ""}<br><small><code>${e(j.id)}</code></small></li>`;
  });
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px">
    <h2>Job hunt — ${today()}</h2>
    ${fresh.length ? `<h3>New matches (${fresh.length})</h3><ol>${jobs.join("")}</ol><p>Tailored CVs are attached. Full cover notes and interview prep are in each job's <code>materials.md</code>.</p>` : ""}
    ${events.length ? `<h3>Inbox updates</h3><ul>${events.map((ev) => `<li><b>${e(ev.kind.replace(/_/g, " "))}</b>: ${e(ev.summary)}${ev.action ? `<br><small>Next: ${e(ev.action)}</small>` : ""}</li>`).join("")}</ul>` : ""}
    ${due.length ? `<h3>Follow-ups due</h3><ul>${due.map((j) => `<li>${e(j.company)} — ${e(j.title)} (applied ${j.appliedAt?.slice(0, 10)})</li>`).join("")}</ul><p>Run <code>npm run job -- followups</code> to draft them.</p>` : ""}
  </div>`;
  const text = html.replace(/<br>/g, "\n").replace(/<\/(li|h2|h3|p)>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const subject = `Job hunt ${today()}: ${fresh.length} new match${fresh.length === 1 ? "" : "es"}${events.length ? `, ${events.length} inbox update(s)` : ""}`;
  await send(g, { subject, html, text, attachments: attachments.slice(0, 15) });
  console.log(`Digest emailed to ${g.address}`);
}

/** One short WhatsApp message summing up the run. Interview and test alerts are sent separately as they happen. */
export async function whatsappSummary(store: Store, cfg: Config, fresh: Job[], applied: ApplyResult, notify = whatsapp) {
  if (!cfg.whatsapp?.enabled || !cfg.whatsapp.daily_summary) return;
  const portal = applied.portal.filter((j) => fresh.includes(j));
  const due = followUpsDue(store, cfg);
  if (!fresh.length && !applied.sent.length && !applied.held.length && !due.length) return;
  const lines = [
    `🤖 Job agent — ${today()}`,
    `${fresh.length} new match${fresh.length === 1 ? "" : "es"} with tailored CVs.`,
    ...(applied.sent.length ? [`✅ Applied by email: ${applied.sent.map((j) => `${j.company} (${j.title})`).join(", ")}`] : []),
    ...(applied.drafted.length ? [`✉️ In Gmail Drafts: ${applied.drafted.map((j) => j.company).join(", ")}`] : []),
    ...(applied.held.some((h) => !h.reason.startsWith("⚠️"))
      ? [`✋ Drafted, need your check first: ${applied.held.filter((h) => !h.reason.startsWith("⚠️")).map((h) => `${h.job.company} (${h.reason})`).join("; ")}`]
      : []),
    ...applied.held.filter((h) => h.reason.startsWith("⚠️")).map((h) => `⚠️ Skipped ${h.job.company} — ${h.job.title}: ${h.reason.replace(/^⚠️ red flags, not applying: /, "")}`),
    ...(portal.length ? ["", "Apply on the website (CV ready in your email digest):", ...portal.slice(0, 8).map((j) => `• ${j.company} — ${j.title}${j.url ? `\n  ${j.url}` : ""}`)] : []),
    ...(due.length ? [`⏰ ${due.length} follow-up(s) due.`] : []),
  ];
  await notify(cfg, lines.join("\n"));
}

// ---------- Report / follow-ups / export ----------

export function writeReport(store: Store, cfg: Config, events: InboxEvent[] = [], applied?: ApplyResult): string {
  const dir = path.join(OUTPUT_DIR, today());
  fs.mkdirSync(dir, { recursive: true });
  const short = store.byStatus("shortlisted").sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0));
  const due = followUpsDue(store, cfg);
  const unmatched = cfg.gmail?.enabled ? loadGmailState().unmatched.slice(-10).reverse() : [];
  const counts = Object.values(store.jobs).reduce<Record<string, number>>((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {});

  const lines = [
    `# Job hunt — ${today()}`,
    "",
    `Pipeline: ${["shortlisted", "applied", "assessment", "interview", "offer", "rejected", "scored", "filtered_out"]
      .map((s) => `${s} ${counts[s] ?? 0}`)
      .join(" · ")}`,
    "",
    `## Shortlist (not yet applied)`,
    "",
    short.length ? "| Score | Company | Role | Location | Use CV | Why | Materials | ID |" : "_Nothing shortlisted._",
    short.length ? "|---|---|---|---|---|---|---|---|" : "",
    ...short.map((j) => {
      const why = esc(j.score?.reasons[0] ?? "") + (j.snippetOnly ? " _(alert summary only)_" : "");
      const mat = j.materialsDir ? `[open](${path.relative(dir, path.join(process.cwd(), j.materialsDir, "materials.md"))})` : "";
      return `| ${j.score?.overall} | ${esc(j.company)} | [${esc(j.title)}](${j.url}) | ${esc(j.location)} | ${esc(j.score?.best_track ?? "")} | ${why} | ${mat} | \`${j.id}\` |`;
    }),
    "",
    ...(applied && (applied.sent.length || applied.drafted.length || applied.held.length)
      ? [
          "## Applications by email (this run)",
          "",
          ...applied.sent.map((j) => `- ✅ Sent: ${j.company} — ${j.title} → ${j.score?.apply_email}`),
          ...applied.drafted.map((j) => `- ✉️ In Gmail Drafts: ${j.company} — ${j.title} → ${j.score?.apply_email}`),
          ...applied.held.map((h) => `- ✋ Drafted, needs your check: ${h.job.company} — ${h.job.title} (${h.reason})`),
          "",
        ]
      : []),
    ...(events.some((ev) => ev.jobId)
      ? ["## Inbox updates on your applications (this run)", "", ...events.filter((ev) => ev.jobId).map((ev) => `- **${ev.kind.replace(/_/g, " ")}** — ${ev.jobId ? `${store.jobs[ev.jobId]?.company}: ` : ""}${ev.summary}${ev.action ? ` → _${ev.action}_` : ""}`), ""]
      : []),
    ...(unmatched.length
      ? ["## Recruiter emails not tied to a tracked job", "", ...unmatched.map((ev) => `- ${ev.at.slice(0, 10)} · ${ev.summary}${ev.action ? ` → _${ev.action}_` : ""}`), ""]
      : []),
    `## Follow-ups due (applied ${cfg.follow_up_days}+ days ago, no update)`,
    "",
    ...(due.length ? due.map((j) => `- ${j.company} — ${j.title} (applied ${j.appliedAt?.slice(0, 10)}) \`${j.id}\``) : ["_None._"]),
    "",
    "## Next steps",
    "",
    "1. Open each materials file and the tailored CV next to it; edit anything that doesn't sound like you, then apply.",
    "2. Jobs marked _alert summary only_: open the link, copy the full job description into a .txt file, and run `npm run job -- jd <id> <file>` to re-score and re-tailor.",
    "3. Record it: `npm run job -- mark <id> applied` (replies from the company are picked up from Gmail automatically).",
    "4. Not interested: `npm run job -- mark <id> skipped`",
    "",
  ];
  const file = path.join(dir, "report.md");
  fs.writeFileSync(file, lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n"));
  return file;
}

export function followUpsDue(store: Store, cfg: Config): Job[] {
  const cutoff = Date.now() - cfg.follow_up_days * 86_400_000;
  return store
    .byStatus("applied")
    .filter((j) => j.appliedAt && new Date(j.appliedAt).getTime() < cutoff && !j.followUpDraftedAt);
}

export async function followUpStep(store: Store, cfg: Config) {
  const due = followUpsDue(store, cfg);
  if (!due.length) return console.log("No follow-ups due.");
  console.log(`Drafting ${due.length} follow-up(s)...`);
  const dir = path.join(OUTPUT_DIR, today());
  fs.mkdirSync(dir, { recursive: true });
  const parts: string[] = [`# Follow-ups — ${today()}`, ""];
  const results = await pool(due, CONCURRENCY, async (job) => {
    const f = await draftFollowUp(job, cfg);
    job.followUpDraftedAt = new Date().toISOString();
    parts.push(`## ${job.company} — ${job.title}`, "", `Applied ${job.appliedAt?.slice(0, 10)} · ${job.url}`, "", "**Email**", "", f.email, "", "**LinkedIn**", "", f.linkedin, "");
  });
  reportFailures(results, due, (j) => j.company);
  store.save();
  const file = path.join(dir, "follow-ups.md");
  fs.writeFileSync(file, parts.join("\n"));
  console.log(`Written: ${path.relative(process.cwd(), file)}`);
}

export function exportCsv(store: Store): string {
  const cols = ["id", "status", "score", "cv_track", "company", "title", "location", "url", "appliedAt", "lastEmail", "firstSeen"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = Object.values(store.jobs)
    .filter((j) => j.status !== "filtered_out")
    .map((j) => {
      const last = j.inbox?.at(-1);
      return [j.id, j.status, j.score?.overall, j.score?.best_track, j.company, j.title, j.location, j.url, j.appliedAt, last ? `${last.kind}: ${last.summary}` : "", j.firstSeen]
        .map(q)
        .join(",");
    });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, "tracker.csv");
  fs.writeFileSync(file, [cols.join(","), ...rows].join("\n"));
  return file;
}

function materialsMarkdown(job: Job, m: Materials, trackName: string, baseCv: string, cvFile: string, warnings: string[]): string {
  const s = job.score;
  return [
    `# ${job.title} — ${job.company}`,
    "",
    `- Link: ${job.url || "(none)"}`,
    `- Location: ${job.location || "not stated"}${job.remote ? " (remote possible)" : ""}`,
    job.salary ? `- Salary: ${job.salary}` : null,
    s ? `- Score: **${s.overall}** (skills ${s.skills_match}, seniority ${s.seniority_fit}, domain ${s.domain_fit}, logistics ${s.logistics_fit}) — ${s.verdict}` : null,
    `- Built from your **${trackName}** CV (${baseCv}) → tailored CV: **${cvFile}**`,
    `- Tracker ID: \`${job.id}\``,
    "",
    job.snippetOnly
      ? "> ⚠ Only a short summary of this job was available, so the tailoring is light. Paste the full job description into a file and run `npm run job -- jd " + job.id + " <file>` to redo it.\n"
      : null,
    warnings.length ? `> ⚠ Check the tailored CV:\n${warnings.map((w) => `> - ${w}`).join("\n")}\n` : null,
    s ? `**Why it fits:** ${s.reasons.join("; ")}.` : null,
    s?.gaps.length ? `**Gaps:** ${s.gaps.join("; ")}.` : null,
    s?.red_flags.length ? `**Red flags:** ${s.red_flags.join("; ")}.` : null,
    "",
    "## What changed in the CV for this job",
    "",
    ...m.changes_made.map((c) => `- ${c}`),
    "",
    "## Cover note",
    "",
    m.cover_note,
    "",
    "## Recruiter message",
    "",
    m.recruiter_message,
    "",
    "## Application email",
    "",
    `**Subject:** ${m.application_email.subject}`,
    "",
    m.application_email.body,
    "",
    "## Keywords from the job description your CV covers",
    "",
    m.keywords.join(", "),
    "",
    "## Interview prep",
    "",
    ...m.interview_prep.map((b) => `- ${b}`),
    "",
    "## Be careful about",
    "",
    m.honesty_notes,
    "",
  ]
    .filter((l): l is string => l !== null)
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
}

const esc = (s: string) => s.replace(/\|/g, "/").replace(/\n/g, " ");
const slug = (s: string, max = 60) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max);
