import fs from "node:fs";
import path from "node:path";
import type { Config } from "./config.js";
import { OUTPUT_DIR } from "./config.js";
import { draftFollowUp, draftMaterials, pool, scoreJob, type Materials } from "./claude.js";
import { hardFilter } from "./filter.js";
import { fetchAll, readManualFile } from "./sources/index.js";
import type { Store } from "./store.js";
import type { Job } from "./types.js";

const today = () => new Date().toISOString().slice(0, 10);
const CONCURRENCY = 4;

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
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`  ! ${queue[i].company} - ${queue[i].title}: ${(r.reason as Error).message}`);
  });
}

export async function shortlistStep(store: Store, cfg: Config) {
  const picks = store
    .byStatus("scored")
    .filter((j) => (j.score?.overall ?? 0) >= cfg.scoring.min_score && j.score?.verdict !== "weak")
    .sort((a, b) => b.score!.overall - a.score!.overall)
    .slice(0, cfg.scoring.top_n);
  if (!picks.length) {
    console.log(`Shortlist: no scored job reached ${cfg.scoring.min_score}`);
    return [];
  }
  console.log(`Drafting materials for the top ${picks.length}...`);
  const results = await pool(picks, CONCURRENCY, async (job) => {
    await draftFor(job, cfg);
    job.status = "shortlisted";
    store.save();
  });
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`  ! ${picks[i].company} - ${picks[i].title}: ${(r.reason as Error).message}`);
  });
  return picks.filter((_, i) => results[i].status === "fulfilled");
}

export async function draftFor(job: Job, cfg: Config) {
  const m = await draftMaterials(job, cfg);
  const dir = path.join(OUTPUT_DIR, today(), slug(`${job.company}-${job.title}`));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "materials.md"), materialsMarkdown(job, m));
  job.materialsDir = path.relative(process.cwd(), dir);
  return dir;
}

export function writeReport(store: Store, cfg: Config): string {
  const dir = path.join(OUTPUT_DIR, today());
  fs.mkdirSync(dir, { recursive: true });
  const short = store
    .byStatus("shortlisted")
    .sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0));
  const due = followUpsDue(store, cfg);
  const counts = Object.values(store.jobs).reduce<Record<string, number>>((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {});

  const lines = [
    `# Job hunt — ${today()}`,
    "",
    `Pipeline: ${["shortlisted", "applied", "interview", "offer", "rejected", "scored", "filtered_out"]
      .map((s) => `${s} ${counts[s] ?? 0}`)
      .join(" · ")}`,
    "",
    `## Shortlist (not yet applied)`,
    "",
    short.length ? "| Score | Company | Role | Location | Why | Materials | ID |" : "_Nothing shortlisted._",
    short.length ? "|---|---|---|---|---|---|---|" : "",
    ...short.map((j) => {
      const why = (j.score?.reasons[0] ?? "").replace(/\|/g, "/");
      const mat = j.materialsDir ? `[open](${path.relative(dir, path.join(process.cwd(), j.materialsDir, "materials.md"))})` : "";
      return `| ${j.score?.overall} | ${esc(j.company)} | [${esc(j.title)}](${j.url}) | ${esc(j.location)} | ${esc(why)} | ${mat} | \`${j.id}\` |`;
    }),
    "",
    `## Follow-ups due (applied ${cfg.follow_up_days}+ days ago, no update)`,
    "",
    ...(due.length ? due.map((j) => `- ${j.company} — ${j.title} (applied ${j.appliedAt?.slice(0, 10)}) \`${j.id}\``) : ["_None._"]),
    "",
    "## Next steps",
    "",
    "1. Open each materials file, edit anything that doesn't sound like you, and apply on the company's site.",
    "2. Record it: `npm run job -- mark <id> applied`",
    "3. Not interested: `npm run job -- mark <id> skipped`",
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
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`  ! ${due[i].company}: ${(r.reason as Error).message}`);
  });
  store.save();
  const file = path.join(dir, "follow-ups.md");
  fs.writeFileSync(file, parts.join("\n"));
  console.log(`Written: ${path.relative(process.cwd(), file)}`);
}

export function exportCsv(store: Store): string {
  const cols = ["id", "status", "score", "company", "title", "location", "url", "appliedAt", "firstSeen", "filterReason"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = Object.values(store.jobs)
    .filter((j) => j.status !== "filtered_out")
    .map((j) => [j.id, j.status, j.score?.overall, j.company, j.title, j.location, j.url, j.appliedAt, j.firstSeen, j.filterReason].map(q).join(","));
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, "tracker.csv");
  fs.writeFileSync(file, [cols.join(","), ...rows].join("\n"));
  return file;
}

function materialsMarkdown(job: Job, m: Materials): string {
  const s = job.score;
  return [
    `# ${job.title} — ${job.company}`,
    "",
    `- Link: ${job.url}`,
    `- Location: ${job.location || "not stated"}${job.remote ? " (remote possible)" : ""}`,
    job.salary ? `- Salary: ${job.salary}` : null,
    s ? `- Score: **${s.overall}** (skills ${s.skills_match}, seniority ${s.seniority_fit}, domain ${s.domain_fit}, logistics ${s.logistics_fit}) — ${s.verdict}` : null,
    `- Tracker ID: \`${job.id}\``,
    "",
    s ? `**Why it fits:** ${s.reasons.join("; ")}.` : null,
    s?.gaps.length ? `**Gaps:** ${s.gaps.join("; ")}.` : null,
    s?.red_flags.length ? `**Red flags:** ${s.red_flags.join("; ")}.` : null,
    "",
    "## Cover note",
    "",
    m.cover_note,
    "",
    "## Recruiter message",
    "",
    m.recruiter_message,
    "",
    "## CV bullets to use",
    "",
    ...m.cv_bullets.map((b) => `- ${b}`),
    "",
    "## Keywords to include",
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
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
