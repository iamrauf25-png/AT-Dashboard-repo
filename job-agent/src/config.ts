import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

const TrackSchema = z.object({
  // Short name, e.g. "Operations". Shown in reports and used to pick the CV.
  name: z.string(),
  // The CV written for this kind of role (.pdf, .md or .txt).
  cv_path: z.string(),
  // A job belongs to this track if every word of any phrase appears in its title.
  titles: z.array(z.string()).min(1),
});
export type Track = z.infer<typeof TrackSchema>;

const ConfigSchema = z.object({
  profile: z.object({
    // A few lines on what you want next, in your own words. Sent to Claude with the CV.
    goals: z.string().default(""),
    tracks: z.array(TrackSchema).min(1),
    locations: z.array(z.string()).default([]),
    remote_ok: z.boolean().default(false),
    // Dropped if any of these appear anywhere in the title or description.
    exclude_keywords: z.array(z.string()).default([]),
    // Dropped if any of these appear in the title only (e.g. "developer" for non-tech searches).
    exclude_title_keywords: z.array(z.string()).default([]),
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
  gmail: z
    .object({
      enabled: z.boolean().default(true),
      address: z.string(), // the password comes from GMAIL_APP_PASSWORD
      lookback_days: z.number().default(3), // first run only; later runs continue from the last check
      // Read job-alert emails from these senders and turn them into jobs.
      alert_senders: z
        .array(z.string())
        .default([
          "jobalerts-noreply@linkedin.com",
          "jobs-noreply@linkedin.com",
          "naukri.com",
          "indeed.com",
          "foundit.in",
          "apna.co",
        ]),
      // Scan other mail for recruiter replies, interview invites and rejections.
      track_replies: z.boolean().default(true),
      // Email yourself the daily report, with tailored CVs attached.
      send_digest: z.boolean().default(true),
      max_emails_per_run: z.number().default(60),
    })
    .optional(),
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
  // Applying by email when a job description gives an address to send your CV to.
  apply: z
    .object({
      // auto: send right away · draft: put it in Gmail Drafts for you to send · off
      mode: z.enum(["auto", "draft", "off"]).default("draft"),
      min_score: z.number().default(70), // never send below this score
      max_per_day: z.number().default(10),
      bcc_self: z.boolean().default(true),
    })
    .default({ mode: "draft", min_score: 70, max_per_day: 10, bcc_self: true }),
  // Replying to recruiters and companies.
  replies: z
    .object({
      mode: z.enum(["auto", "draft", "off"]).default("draft"),
      max_per_run: z.number().default(10),
      // Facts the agent may share when asked. Leave a field empty and it will ask you instead of guessing.
      facts: z.record(z.string(), z.string()).default({}),
      // When you can attend interviews; used to accept a proposed time or to offer slots.
      availability: z
        .object({
          days: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).default(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
          start: z.string().default("10:00"),
          end: z.string().default("18:00"),
          min_notice_hours: z.number().default(18),
        })
        .default({ days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], start: "10:00", end: "18:00", min_notice_hours: 18 }),
    })
    .default({
      mode: "draft",
      max_per_run: 10,
      facts: {},
      availability: { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], start: "10:00", end: "18:00", min_notice_hours: 18 },
    }),
  calendar: z
    .object({
      enabled: z.boolean().default(true),
      calendar_id: z.string().default("primary"),
      reminders_minutes: z.array(z.number()).default([1440, 120, 30]),
    })
    .optional(),
  whatsapp: z
    .object({
      enabled: z.boolean().default(true),
      // callmebot: free, personal-use notifications (key in CALLMEBOT_API_KEY)
      // twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env
      provider: z.enum(["callmebot", "twilio"]).default("callmebot"),
      phone: z.string(), // your number with country code, e.g. +9198XXXXXXXX
      daily_summary: z.boolean().default(true),
    })
    .optional(),
  timezone: z.string().default("Asia/Kolkata"),
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
  for (const t of parsed.data.profile.tracks) {
    if (!fs.existsSync(path.resolve(t.cv_path))) throw new Error(`CV for track "${t.name}" not found: ${t.cv_path}`);
  }
  return parsed.data;
}

export function trackByName(cfg: Config, name: string | undefined): Track {
  return cfg.profile.tracks.find((t) => t.name === name) ?? cfg.profile.tracks[0];
}
