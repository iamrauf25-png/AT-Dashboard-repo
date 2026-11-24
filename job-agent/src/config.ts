import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

const ConfigSchema = z.object({
  profile: z.object({
    cv_path: z.string(),
    // A few lines on what you want next, in your own words. Sent to Claude with the CV.
    goals: z.string().default(""),
    target_titles: z.array(z.string()).default([]),
    locations: z.array(z.string()).default([]),
    remote_ok: z.boolean().default(true),
    exclude_keywords: z.array(z.string()).default([]),
    exclude_companies: z.array(z.string()).default([]),
    max_age_days: z.number().default(14),
  }),
  sources: z
    .object({
      greenhouse: z.array(z.string()).default([]),
      lever: z.array(z.string()).default([]),
      ashby: z.array(z.string()).default([]),
      adzuna: z
        .object({
          country: z.string().default("in"),
          searches: z.array(z.object({ what: z.string(), where: z.string().default("") })).default([]),
          max_days_old: z.number().default(7),
        })
        .optional(),
    })
    .default({ greenhouse: [], lever: [], ashby: [] }),
  scoring: z
    .object({
      weights: z
        .object({
          skills_match: z.number().default(0.4),
          seniority_fit: z.number().default(0.2),
          domain_fit: z.number().default(0.2),
          logistics_fit: z.number().default(0.2),
        })
        .default({ skills_match: 0.4, seniority_fit: 0.2, domain_fit: 0.2, logistics_fit: 0.2 }),
      top_n: z.number().default(10),
      min_score: z.number().default(60),
      max_jobs_per_run: z.number().default(80),
    })
    .default({
      weights: { skills_match: 0.4, seniority_fit: 0.2, domain_fit: 0.2, logistics_fit: 0.2 },
      top_n: 10,
      min_score: 60,
      max_jobs_per_run: 80,
    }),
  follow_up_days: z.number().default(7),
  model: z.string().default("claude-opus-5-5"),
});

export type Config = z.infer<typeof ConfigSchema>;

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data");
export const OUTPUT_DIR = path.join(ROOT, "output");

export function loadConfig(file = path.join(ROOT, "config.yaml")): Config {
  if (!fs.existsSync(file)) {
    throw new Error(`No config found at ${file}. Copy config.example.yaml to config.yaml and fill it in.`);
  }
  const parsed = ConfigSchema.safeParse(YAML.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    throw new Error(`config.yaml is invalid:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
