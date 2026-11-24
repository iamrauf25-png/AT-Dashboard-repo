import type { Config } from "./config.js";
import type { Job } from "./types.js";

/** Lowercases and smooths spelling variants so "E-Commerce" matches "ecommerce" and "Gurgaon" matches "Gurugram". */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\be[\s-]?commerce\b/g, "ecommerce")
    .replace(/\bq[\s-]?commerce\b/g, "quick commerce")
    .replace(/\bgurgaon\b/g, "gurugram")
    .replace(/\bsr\.?\s/g, "senior ")
    .replace(/\basst\.?\s/g, "assistant ")
    .replace(/\bmgr\b/g, "manager")
    .replace(/\bbiz\b/g, "business");
}

/**
 * Which tracks' title phrases this title matches, best match first. A phrase matches when each of its
 * words appears in the title as a whole word (a plural "s" is allowed), so "team lead" does not match
 * "Team Leader" by accident. Longer matching phrases rank higher.
 */
export function matchTracks(title: string, cfg: Config): string[] {
  const t = norm(title);
  const hasWord = (w: string) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?($|[^a-z0-9])`).test(t);
  return cfg.profile.tracks
    .map((tr) => ({
      name: tr.name,
      best: Math.max(0, ...tr.titles.map((p) => norm(p).split(/\s+/).filter(Boolean)).filter((ws) => ws.every(hasWord)).map((ws) => ws.length)),
    }))
    .filter((m) => m.best > 0)
    .sort((a, b) => b.best - a.best)
    .map((m) => m.name);
}

/**
 * Cheap deterministic filters, run before any Claude call. Returns the reason a job fails,
 * or null if it passes (and records which tracks it matched).
 */
export function hardFilter(job: Job, cfg: Config): string | null {
  const p = cfg.profile;
  const title = norm(job.title);
  const text = norm(`${job.title}\n${job.description}`);

  if (p.exclude_companies.some((c) => norm(job.company).includes(norm(c)))) return "excluded company";

  const badTitle = p.exclude_title_keywords.find((k) => title.includes(norm(k)));
  if (badTitle) return `title has "${badTitle}"`;

  const badWord = p.exclude_keywords.find((k) => text.includes(norm(k)));
  if (badWord) return `excluded keyword "${badWord}"`;

  const tracks = matchTracks(job.title, cfg);
  if (!tracks.length) return "title not in any track";
  job.tracks = tracks;

  // Recruiter emails often don't state a location; let Claude judge those from the email itself.
  if (p.locations.length && !(job.source === "recruiter" && !job.location)) {
    const loc = norm(job.location);
    const inArea = p.locations.some((l) => loc.includes(norm(l)));
    if (!inArea && !(p.remote_ok && job.remote)) return `location "${job.location || "unknown"}"`;
  }

  if (job.postedAt) {
    const ageDays = (Date.now() - new Date(job.postedAt).getTime()) / 86_400_000;
    if (ageDays > p.max_age_days) return `posted ${Math.round(ageDays)} days ago`;
  }

  if (!job.snippetOnly && job.description.trim().length < 80) return "no usable description";
  return null;
}
