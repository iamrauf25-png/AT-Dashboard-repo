import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./config.js";
import type { Job, JobStatus, RawJob } from "./types.js";

const FILE = path.join(DATA_DIR, "jobs.json");

/** A small JSON-file tracker. One record per job, keyed by `${source}:${sourceId}`. */
export class Store {
  jobs: Record<string, Job>;

  constructor() {
    this.jobs = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : {};
  }

  save() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.jobs, null, 2));
    fs.renameSync(tmp, FILE);
  }

  /** Adds jobs not seen before. Returns the new ones. Also dedupes the same company + title across sources. */
  addRaw(raw: RawJob[]): Job[] {
    const seenKeys = new Set(Object.values(this.jobs).map(dedupeKey));
    const added: Job[] = [];
    for (const r of raw) {
      const id = `${r.source}:${r.sourceId}`;
      if (this.jobs[id] || seenKeys.has(dedupeKey(r))) continue;
      const job: Job = { ...r, id, firstSeen: new Date().toISOString(), status: "new", notes: [] };
      this.jobs[id] = job;
      seenKeys.add(dedupeKey(r));
      added.push(job);
    }
    return added;
  }

  byStatus(...statuses: JobStatus[]): Job[] {
    return Object.values(this.jobs).filter((j) => statuses.includes(j.status));
  }

  /** Finds a job by full id or by a unique prefix / suffix of it. */
  find(idOrPrefix: string): Job {
    const exact = this.jobs[idOrPrefix];
    if (exact) return exact;
    const matches = Object.values(this.jobs).filter(
      (j) => j.id.startsWith(idOrPrefix) || j.id.endsWith(idOrPrefix),
    );
    if (matches.length !== 1) {
      throw new Error(matches.length ? `"${idOrPrefix}" matches ${matches.length} jobs; be more specific.` : `No job "${idOrPrefix}".`);
    }
    return matches[0];
  }
}

function dedupeKey(j: { company: string; title: string }) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${norm(j.company)}|${norm(j.title)}`;
}
