import { createHash } from "node:crypto";
import fs from "node:fs";
import type { Config } from "../config.js";
import type { RawJob } from "../types.js";

/**
 * Job sources. Every source here is a public, documented listing API or a file you supply,
 * so nothing scrapes a site that forbids it or logs in as you.
 */

const UA = { "User-Agent": "job-agent/0.1 (personal job search)" };

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { ...UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.split("?")[0]}`);
  return res.json();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** Greenhouse sends HTML that is itself entity-escaped, so decode once to get HTML, strip tags, then decode the text. */
export function htmlToText(html: string): string {
  const stripped = decodeEntities(html)
    .replace(/<(br|\/p|\/li|\/h\d|\/div)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(stripped)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

const looksRemote = (s: string) => /remote|anywhere|work from home|wfh/i.test(s);

// Greenhouse: https://developers.greenhouse.io/job-board.html
export async function fetchGreenhouse(slug: string): Promise<RawJob[]> {
  const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`);
  return (data.jobs ?? []).map((j: any): RawJob => {
    const location = j.location?.name ?? "";
    return {
      source: "greenhouse",
      sourceId: `${slug}-${j.id}`,
      company: j.company_name ?? slug,
      title: j.title,
      location,
      remote: looksRemote(location),
      url: j.absolute_url,
      description: htmlToText(j.content ?? ""),
      postedAt: j.first_published ?? j.updated_at,
    };
  });
}

// Lever: https://github.com/lever/postings-api
export async function fetchLever(slug: string): Promise<RawJob[]> {
  const data = await getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
  return (Array.isArray(data) ? data : []).map((j: any): RawJob => {
    const lists = (j.lists ?? []).map((l: any) => `${l.text}\n${htmlToText(l.content ?? "")}`).join("\n\n");
    const location = j.categories?.location ?? "";
    const salary = j.salaryRange
      ? `${j.salaryRange.currency ?? ""} ${j.salaryRange.min ?? "?"}-${j.salaryRange.max ?? "?"} ${j.salaryRange.interval ?? ""}`.trim()
      : undefined;
    return {
      source: "lever",
      sourceId: `${slug}-${j.id}`,
      company: slug,
      title: j.text,
      location,
      remote: j.workplaceType === "remote" || looksRemote(location),
      url: j.hostedUrl,
      description: [j.descriptionPlain, lists, j.additionalPlain].filter(Boolean).join("\n\n"),
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
      salary,
    };
  });
}

// Ashby: https://developers.ashbyhq.com/docs/public-job-posting-api
export async function fetchAshby(slug: string): Promise<RawJob[]> {
  const data = await getJson(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`,
  );
  return (data.jobs ?? [])
    .filter((j: any) => j.isListed !== false)
    .map((j: any): RawJob => ({
      source: "ashby",
      sourceId: `${slug}-${j.id}`,
      company: slug,
      title: j.title,
      location: j.location ?? "",
      remote: Boolean(j.isRemote) || j.workplaceType === "Remote",
      url: j.jobUrl,
      description: j.descriptionPlain ?? htmlToText(j.descriptionHtml ?? ""),
      postedAt: j.publishedAt,
      salary: j.compensation?.compensationTierSummary,
    }));
}

// Adzuna: https://developer.adzuna.com/ (free key; set ADZUNA_APP_ID and ADZUNA_APP_KEY)
export async function fetchAdzuna(cfg: NonNullable<Config["sources"]["adzuna"]>): Promise<RawJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) {
    console.warn("  adzuna: skipped (set ADZUNA_APP_ID and ADZUNA_APP_KEY to enable)");
    return [];
  }
  const out: RawJob[] = [];
  for (const s of cfg.searches) {
    const q = new URLSearchParams({
      app_id: id,
      app_key: key,
      what: s.what,
      where: s.where,
      results_per_page: "50",
      max_days_old: String(cfg.max_days_old),
      sort_by: "date",
    });
    const data = await getJson(`https://api.adzuna.com/v1/api/jobs/${cfg.country}/search/1?${q}`);
    for (const j of data.results ?? []) {
      const location = j.location?.display_name ?? "";
      out.push({
        source: "adzuna",
        sourceId: String(j.id),
        company: j.company?.display_name ?? "Unknown",
        title: htmlToText(j.title ?? ""),
        location,
        remote: looksRemote(`${location} ${j.title}`),
        url: j.redirect_url,
        // Adzuna returns a snippet, not the full description; scoring notes that.
        description: htmlToText(j.description ?? ""),
        snippetOnly: true,
        postedAt: j.created,
        salary: j.salary_min ? `${j.salary_min}-${j.salary_max ?? "?"}` : undefined,
      });
    }
  }
  return out;
}

/**
 * Jobs you collected yourself (LinkedIn, Naukri, referrals...). Accepts a JSON array or a CSV with
 * a header row. Columns: company, title, location, url, description (required: company, title, description).
 */
export function readManualFile(file: string): RawJob[] {
  const text = fs.readFileSync(file, "utf8");
  const rows: Record<string, string>[] = file.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
  return rows
    .filter((r) => r.company && r.title && r.description)
    .map((r): RawJob => ({
      source: "manual",
      sourceId: r.id || createHash("sha1").update(r.url || `${r.company}|${r.title}`).digest("hex").slice(0, 10),
      company: r.company,
      title: r.title,
      location: r.location ?? "",
      remote: looksRemote(r.location ?? ""),
      url: r.url ?? "",
      description: r.description,
      postedAt: r.posted_at || undefined,
      salary: r.salary || undefined,
    }));
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  const [header, ...body] = rows;
  const keys = (header ?? []).map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** Pulls from every configured source. A failing source is reported and skipped, not fatal. */
export async function fetchAll(cfg: Config): Promise<RawJob[]> {
  const tasks: [string, () => Promise<RawJob[]>][] = [
    ...cfg.sources.greenhouse.map((s): [string, () => Promise<RawJob[]>] => [`greenhouse/${s}`, () => fetchGreenhouse(s)]),
    ...cfg.sources.lever.map((s): [string, () => Promise<RawJob[]>] => [`lever/${s}`, () => fetchLever(s)]),
    ...cfg.sources.ashby.map((s): [string, () => Promise<RawJob[]>] => [`ashby/${s}`, () => fetchAshby(s)]),
  ];
  if (cfg.sources.adzuna?.searches.length) tasks.push(["adzuna", () => fetchAdzuna(cfg.sources.adzuna!)]);

  const results = await Promise.allSettled(tasks.map(([, fn]) => fn()));
  const all: RawJob[] = [];
  results.forEach((r, i) => {
    const name = tasks[i][0];
    if (r.status === "fulfilled") {
      console.log(`  ${name}: ${r.value.length} jobs`);
      all.push(...r.value);
    } else {
      console.warn(`  ${name}: failed (${(r.reason as Error).message})`);
    }
  });
  return all;
}
