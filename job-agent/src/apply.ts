import fs from "node:fs";
import path from "node:path";
import type { Config } from "./config.js";
import { sendOrDraft } from "./gmail.js";
import type { Store } from "./store.js";
import type { Job } from "./types.js";

export interface SavedMaterials {
  subject: string;
  body: string;
  pdf: string; // file name of the tailored CV PDF in the job's folder
  warnings: string[];
}

export interface ApplyResult {
  sent: Job[];
  drafted: Job[];
  held: { job: Job; reason: string }[];
  portal: Job[]; // no email address to apply to: apply on the website yourself
}

const DAY = 86_400_000;
const isEmail = (s: string) => /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(s.trim());

/** Why this job must not be emailed automatically, or null if it is safe to send. */
export function holdReason(job: Job, saved: SavedMaterials | null, store: Store, cfg: Config): string | null {
  const s = job.score;
  if (!s) return "not scored";
  if (!saved) return "materials not drafted";
  if (s.overall < cfg.apply.min_score) return `score ${s.overall} is below apply.min_score (${cfg.apply.min_score})`;
  if (s.verdict === "weak") return "weak fit";
  if (s.red_flags.length) return `red flags: ${s.red_flags.join("; ")}`;
  if (job.snippetOnly) return "only an alert summary; add the full description with `jd` first";
  if (saved.warnings.length) return `tailored CV needs a check: ${saved.warnings[0]}`;
  if (/\[YOUR ANSWER|\[.*?\]/.test(saved.body)) return "email body has a placeholder";
  const recent = Object.values(store.jobs).find(
    (j) =>
      j.id !== job.id &&
      j.appliedAt &&
      j.company.trim().toLowerCase() === job.company.trim().toLowerCase() &&
      Date.now() - new Date(j.appliedAt).getTime() < 30 * DAY,
  );
  if (recent) return `already applied to ${job.company} in the last 30 days (${recent.title})`;
  return null;
}

export function loadSaved(job: Job): SavedMaterials | null {
  if (!job.materialsDir) return null;
  const f = path.join(job.materialsDir, "materials.json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}

/**
 * Applies by email to shortlisted jobs whose description gives an address to send the CV to.
 * In "auto" mode it sends from your Gmail; in "draft" mode it leaves the email in Gmail Drafts.
 * Everything else is left for you to apply to on the company's site.
 */
export async function applyStep(store: Store, cfg: Config, send = sendOrDraft, only?: Job): Promise<ApplyResult> {
  const result: ApplyResult = { sent: [], drafted: [], held: [], portal: [] };
  const g = cfg.gmail;
  const candidates = only ? [only] : store.byStatus("shortlisted").sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0));
  if (cfg.apply.mode === "off" || !g?.enabled) {
    result.portal.push(...candidates);
    return result;
  }
  const today = new Date().toISOString().slice(0, 10);
  let sentToday = Object.values(store.jobs).filter((j) => j.appliedVia === "email" && j.appliedAt?.startsWith(today)).length;

  for (const job of candidates) {
    const to = job.score?.apply_email?.trim() ?? "";
    if (!isEmail(to)) {
      result.portal.push(job);
      continue;
    }
    if (job.notes.some((n) => n.text.startsWith("Application email drafted"))) continue; // already in Drafts
    const saved = loadSaved(job);
    const reason = holdReason(job, saved, store, cfg);
    // Possible scams are never sent or drafted; you get a warning instead.
    if (job.score?.red_flags.length) {
      result.held.push({ job, reason: `⚠️ red flags, not applying: ${job.score.red_flags.join("; ")}` });
      continue;
    }
    // A held job is still drafted, so it is one click away once you've checked it.
    const mode = reason || sentToday >= cfg.apply.max_per_day ? "draft" : cfg.apply.mode;
    if (!saved) {
      result.held.push({ job, reason: reason ?? "materials not drafted" });
      continue;
    }
    const pdf = path.join(job.materialsDir!, saved.pdf);
    try {
      const r = await send(g, mode, {
        to,
        subject: saved.subject,
        text: saved.body,
        attachments: fs.existsSync(pdf) ? [{ filename: saved.pdf, path: pdf }] : [],
        bcc: mode === "auto" && cfg.apply.bcc_self ? g.address : undefined,
      });
      const at = new Date().toISOString();
      if (r.sent) {
        job.status = "applied";
        job.appliedAt = at;
        job.appliedVia = "email";
        job.applicationMessageId = r.messageId;
        job.notes.push({ at, text: `Applied by email to ${to}` });
        result.sent.push(job);
        sentToday++;
        console.log(`  applied by email: ${job.company} — ${job.title} → ${to}`);
      } else {
        job.notes.push({ at, text: `Application email drafted to ${to}${reason ? ` (held: ${reason})` : ""}` });
        if (reason) result.held.push({ job, reason });
        else result.drafted.push(job);
        console.log(`  drafted application: ${job.company} — ${job.title}${reason ? ` (held: ${reason})` : ""}`);
      }
      store.save();
    } catch (e) {
      result.held.push({ job, reason: `sending failed: ${(e as Error).message}` });
    }
  }
  return result;
}
