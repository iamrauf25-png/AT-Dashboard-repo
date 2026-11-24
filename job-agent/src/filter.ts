import type { Config } from "./config.js";
import type { Job } from "./types.js";

/**
 * Cheap deterministic filters, run before any Claude call. Returns the reason a job fails,
 * or null if it passes.
 */
export function hardFilter(job: Job, cfg: Config): string | null {
  const p = cfg.profile;
  const title = job.title.toLowerCase();
  const text = `${job.title}\n${job.description}`.toLowerCase();

  if (p.exclude_companies.some((c) => job.company.toLowerCase().includes(c.toLowerCase()))) {
    return "excluded company";
  }
  const badWord = p.exclude_keywords.find((k) => text.includes(k.toLowerCase()));
  if (badWord) return `excluded keyword "${badWord}"`;

  if (p.target_titles.length && !p.target_titles.some((t) => titleMatches(title, t.toLowerCase()))) {
    return "title not in target list";
  }

  if (p.locations.length) {
    const loc = job.location.toLowerCase();
    const inArea = p.locations.some((l) => loc.includes(l.toLowerCase()));
    if (!inArea && !(p.remote_ok && job.remote)) return `location "${job.location || "unknown"}"`;
  }

  if (job.postedAt) {
    const ageDays = (Date.now() - new Date(job.postedAt).getTime()) / 86_400_000;
    if (ageDays > p.max_age_days) return `posted ${Math.round(ageDays)} days ago`;
  }

  if (job.description.trim().length < 80) return "no usable description";
  return null;
}

/** Every word of the target phrase appears in the title, so "operations manager" matches "Senior Manager, Operations". */
function titleMatches(title: string, target: string): boolean {
  return target.split(/\s+/).filter(Boolean).every((w) => title.includes(w));
}
