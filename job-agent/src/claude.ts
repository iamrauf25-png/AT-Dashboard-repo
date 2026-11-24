import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Config } from "./config.js";
import type { Job, ScoreResult } from "./types.js";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY (or an `ant auth login` profile)

// ---------- CV ----------

type CvBlock = Anthropic.Beta.BetaContentBlockParam;
let cvBlockCache: CvBlock | null = null;

/** The CV goes in as the first content block, marked for prompt caching so every job reuses it cheaply. */
function cvBlock(cfg: Config): CvBlock {
  if (cvBlockCache) return cvBlockCache;
  const file = path.resolve(cfg.profile.cv_path);
  if (!fs.existsSync(file)) throw new Error(`CV not found at ${file} (profile.cv_path in config.yaml).`);
  if (file.toLowerCase().endsWith(".pdf")) {
    cvBlockCache = {
      type: "document",
      title: "Candidate CV",
      source: { type: "base64", media_type: "application/pdf", data: fs.readFileSync(file).toString("base64") },
      cache_control: { type: "ephemeral" },
    };
  } else {
    cvBlockCache = {
      type: "text",
      text: `<candidate_cv>\n${fs.readFileSync(file, "utf8")}\n</candidate_cv>`,
      cache_control: { type: "ephemeral" },
    };
  }
  return cvBlockCache;
}

function jobText(job: Job): string {
  return [
    `<job id="${job.id}">`,
    `Company: ${job.company}`,
    `Title: ${job.title}`,
    `Location: ${job.location || "not stated"}${job.remote ? " (remote possible)" : ""}`,
    job.salary ? `Salary: ${job.salary}` : "",
    job.source === "adzuna" ? "Note: description below is a short snippet, not the full posting." : "",
    `Description:\n${job.description.slice(0, 20_000)}`,
    `</job>`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function ask<T extends z.ZodType>(
  cfg: Config,
  opts: { system: string; prompt: string; schema: T; effort: "low" | "medium" | "high"; maxTokens: number },
): Promise<z.infer<T>> {
  const response = await client.beta.messages.parse({
    model: cfg.model,
    max_tokens: opts.maxTokens,
    // If a safety classifier declines, the API retries on a fallback model within the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opts.system,
    output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
    messages: [{ role: "user", content: [cvBlock(cfg), { type: "text", text: opts.prompt }] }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined this request");
  if (response.stop_reason === "max_tokens") throw new Error("response was cut off (max_tokens)");
  if (!response.parsed_output) throw new Error("could not parse Claude's response");
  return response.parsed_output as z.infer<T>;
}

// ---------- Scoring ----------

const ScoreSchema = z.object({
  skills_match: z.number().describe("0-100: how well the candidate's demonstrated skills cover the must-haves"),
  seniority_fit: z.number().describe("0-100: years and level of responsibility versus what the role asks"),
  domain_fit: z.number().describe("0-100: industry / function overlap"),
  logistics_fit: z.number().describe("0-100: location, work mode, salary if stated, versus the candidate's goals"),
  verdict: z.enum(["strong", "possible", "weak"]),
  reasons: z.array(z.string()).describe("Up to 3 short reasons this is a fit, each citing CV evidence"),
  gaps: z.array(z.string()).describe("Must-haves the CV does not show"),
  red_flags: z.array(z.string()).describe("Concerns about the posting itself, e.g. vague, unpaid, commission-only, likely scam"),
});

const SCORE_SYSTEM = `You screen job postings for one candidate, whose CV is provided.
Score honestly against the evidence in the CV; do not give credit for skills the CV does not show.
Be strict on must-have requirements and on seniority mismatches in either direction.
Keep every reason, gap and red flag to one short sentence.`;

export async function scoreJob(job: Job, cfg: Config): Promise<ScoreResult> {
  const s = await ask(cfg, {
    system: SCORE_SYSTEM,
    prompt: `Candidate's goals: ${cfg.profile.goals || "(not stated)"}\n\n${jobText(job)}\n\nScore this job for the candidate.`,
    schema: ScoreSchema,
    effort: "low",
    maxTokens: 4000,
  });
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const w = cfg.scoring.weights;
  const total = w.skills_match + w.seniority_fit + w.domain_fit + w.logistics_fit;
  const overall =
    (clamp(s.skills_match) * w.skills_match +
      clamp(s.seniority_fit) * w.seniority_fit +
      clamp(s.domain_fit) * w.domain_fit +
      clamp(s.logistics_fit) * w.logistics_fit) /
    total;
  return {
    ...s,
    skills_match: clamp(s.skills_match),
    seniority_fit: clamp(s.seniority_fit),
    domain_fit: clamp(s.domain_fit),
    logistics_fit: clamp(s.logistics_fit),
    overall: Math.round(overall),
    reasons: s.reasons.slice(0, 3),
  };
}

// ---------- Tailoring ----------

const MaterialsSchema = z.object({
  cover_note: z.string().describe("150-250 word cover note / application answer, plain text, no placeholders"),
  recruiter_message: z.string().describe("LinkedIn connection note to a recruiter or hiring manager, under 300 characters"),
  cv_bullets: z.array(z.string()).describe("4-6 CV bullets, reworded from the CV to mirror this job's language; same facts only"),
  keywords: z.array(z.string()).describe("Keywords from the posting the CV genuinely supports and should mention"),
  interview_prep: z.array(z.string()).describe("3-5 likely interview questions for this role, each with a one-line pointer to a CV story to use"),
  honesty_notes: z.string().describe("Anything the candidate should not claim, or should address openly, given the gaps"),
});
export type Materials = z.infer<typeof MaterialsSchema>;

const TAILOR_SYSTEM = `You help one candidate, whose CV is provided, apply for a specific job.
Write in the candidate's first person, in plain, confident, specific language. No clichés ("I am writing to express"), no flattery, no emoji.
Never invent experience, employers, numbers, tools or qualifications. Only rephrase and select what the CV supports.
Where the job asks for something the CV lacks, do not paper over it; mention it in honesty_notes instead.`;

export async function draftMaterials(job: Job, cfg: Config): Promise<Materials> {
  const why = job.score ? `\n\nScreening notes: fits because ${job.score.reasons.join("; ")}. Gaps: ${job.score.gaps.join("; ") || "none"}.` : "";
  return ask(cfg, {
    system: TAILOR_SYSTEM,
    prompt: `Candidate's goals: ${cfg.profile.goals || "(not stated)"}\n\n${jobText(job)}${why}\n\nDraft the application materials.`,
    schema: MaterialsSchema,
    effort: "medium",
    maxTokens: 12000,
  });
}

// ---------- Follow-ups ----------

const FollowUpSchema = z.object({
  email: z.string().describe("Short follow-up email body, 60-120 words"),
  linkedin: z.string().describe("Short LinkedIn follow-up message, under 300 characters"),
});

export async function draftFollowUp(job: Job, cfg: Config) {
  const days = job.appliedAt ? Math.round((Date.now() - new Date(job.appliedAt).getTime()) / 86_400_000) : "?";
  return ask(cfg, {
    system: `${TAILOR_SYSTEM}\nYou are now writing a polite, brief follow-up on an application with no reply yet. Reaffirm one specific fit point; do not pester.`,
    prompt: `${jobText(job)}\n\nThe candidate applied ${days} days ago and has not heard back. Draft the follow-up.`,
    schema: FollowUpSchema,
    effort: "low",
    maxTokens: 3000,
  });
}

/** Runs `fn` over items with at most `limit` in flight. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (e) {
        results[i] = { status: "rejected", reason: e };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
