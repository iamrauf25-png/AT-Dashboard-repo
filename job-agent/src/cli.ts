import fs from "node:fs";
import path from "node:path";
import { cvText, scoreJob } from "./claude.js";
import { loadConfig } from "./config.js";
import { matchTracks } from "./filter.js";
import {
  digestStep,
  draftFor,
  exportCsv,
  fetchStep,
  filterStep,
  followUpStep,
  followUpsDue,
  gmailStep,
  scoreStep,
  shortlistStep,
  writeReport,
} from "./pipeline.js";
import { Store } from "./store.js";
import type { InboxEvent, JobStatus } from "./types.js";

const HELP = `job-agent — find, score and prepare job applications

Usage: npm run job -- <command> [args]

  run [--import FILE...]   Full daily run: Gmail + job boards, filter, score, tailor CVs for
                           the top N, write the report, email you the digest
  fetch [--import FILE...] Only fetch new jobs (and import your own CSV/JSON)
  gmail                    Only check Gmail (job alerts + replies from companies)
  jd ID FILE               Give a job its full description (copied into a .txt file),
                           then re-score it and re-tailor the CV and materials
  cvs                      Check that each track's CV can be read
  score                    Filter and score jobs not yet scored
  shortlist                Draft materials for the best scored jobs
  report                   Rewrite today's report
  list [STATUS]            List jobs (default: shortlisted + applied + interview)
  show ID                  Show one job with its score
  draft ID                 Draft materials for any job you pick
  mark ID STATUS [NOTE]    Update a job: applied | assessment | interview | offer | rejected | skipped
  followups                Draft follow-ups for applications with no reply
  export                   Write output/tracker.csv

IDs can be shortened to any unique prefix or suffix.`;

const STATUSES: JobStatus[] = ["new", "filtered_out", "scored", "shortlisted", "applied", "assessment", "interview", "offer", "rejected", "skipped"];

async function main() {
  const [cmd = "help", ...args] = process.argv.slice(2);
  if (cmd === "help" || cmd === "--help" || cmd === "-h") return console.log(HELP);

  try {
    process.loadEnvFile(".env"); // ANTHROPIC_API_KEY, GMAIL_APP_PASSWORD, optional ADZUNA_APP_ID / ADZUNA_APP_KEY
  } catch {}
  const cfg = loadConfig();
  const store = new Store();
  const imports = collectImports(args);

  switch (cmd) {
    case "run": {
      let events: InboxEvent[] = [];
      try {
        events = await gmailStep(store, cfg);
      } catch (e) {
        console.warn(`  Gmail skipped: ${(e as Error).message}`);
      }
      await fetchStep(store, cfg, imports);
      filterStep(store, cfg);
      await scoreStep(store, cfg);
      const fresh = await shortlistStep(store, cfg);
      const report = writeReport(store, cfg, events);
      exportCsv(store);
      try {
        await digestStep(store, cfg, fresh, events);
      } catch (e) {
        console.warn(`  Digest not sent: ${(e as Error).message}`);
      }
      const due = followUpsDue(store, cfg).length;
      console.log(`\nReport: ${path.relative(process.cwd(), report)}`);
      if (due) console.log(`${due} follow-up(s) due — run: npm run job -- followups`);
      break;
    }
    case "fetch":
      await fetchStep(store, cfg, imports);
      break;
    case "gmail": {
      const events = await gmailStep(store, cfg);
      for (const e of events) console.log(`  ${e.kind}: ${e.summary}${e.action ? ` → ${e.action}` : ""}`);
      console.log(`Report: ${path.relative(process.cwd(), writeReport(store, cfg, events))}`);
      break;
    }
    case "jd": {
      const j = store.find(need(args[0], "ID"));
      const text = fs.readFileSync(need(args[1], "FILE"), "utf8").trim();
      if (text.length < 200) throw new Error("That file looks too short to be a full job description.");
      j.description = text;
      j.snippetOnly = false;
      j.filterReason = undefined;
      if (!j.tracks?.length) {
        j.tracks = matchTracks(j.title, cfg);
      }
      console.log("Re-scoring with the full description...");
      j.score = await scoreJob(j, cfg);
      console.log(`Score: ${j.score.overall} (${j.score.verdict}), use your ${j.score.best_track} CV`);
      const dir = await draftFor(j, cfg);
      if (["new", "scored", "filtered_out"].includes(j.status)) j.status = "shortlisted";
      store.save();
      console.log(`Written: ${path.relative(process.cwd(), dir)}/`);
      break;
    }
    case "cvs":
      for (const t of cfg.profile.tracks) {
        const text = await cvText(t, cfg);
        console.log(`${t.name}: ${t.cv_path} — ${text.split(/\s+/).length} words, starts "${text.slice(0, 60).replace(/\s+/g, " ")}..."`);
      }
      break;
    case "score":
      filterStep(store, cfg);
      await scoreStep(store, cfg);
      break;
    case "shortlist":
      await shortlistStep(store, cfg);
      console.log(`Report: ${path.relative(process.cwd(), writeReport(store, cfg))}`);
      break;
    case "report":
      console.log(`Report: ${path.relative(process.cwd(), writeReport(store, cfg))}`);
      break;
    case "list": {
      const wanted = (args[0] ? [args[0]] : ["shortlisted", "applied", "assessment", "interview", "offer"]) as JobStatus[];
      const rows = store.byStatus(...wanted).sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0));
      if (!rows.length) return console.log(`No jobs with status ${wanted.join("/")}.`);
      for (const j of rows) {
        console.log(`${String(j.score?.overall ?? "--").padStart(3)}  ${j.status.padEnd(11)} ${j.company} — ${j.title}  [${j.id}]`);
      }
      break;
    }
    case "show": {
      const j = store.find(need(args[0], "ID"));
      console.log(`${j.title} — ${j.company}\n${j.location}${j.remote ? " (remote possible)" : ""}\n${j.url}\nStatus: ${j.status}${j.filterReason ? ` (${j.filterReason})` : ""}`);
      if (j.score) {
        const s = j.score;
        console.log(`Score: ${s.overall} — ${s.verdict} (skills ${s.skills_match}, seniority ${s.seniority_fit}, domain ${s.domain_fit}, logistics ${s.logistics_fit})`);
        console.log(`Fit: ${s.reasons.join("; ")}\nGaps: ${s.gaps.join("; ") || "none"}\nRed flags: ${s.red_flags.join("; ") || "none"}`);
      }
      if (j.score) console.log(`Apply with: your ${j.score.best_track} CV`);
      if (j.materialsDir) console.log(`Materials: ${j.materialsDir}/`);
      for (const e of j.inbox ?? []) console.log(`Email ${e.at.slice(0, 10)} (${e.kind}): ${e.summary}${e.action ? ` → ${e.action}` : ""}`);
      for (const n of j.notes) console.log(`Note ${n.at.slice(0, 10)}: ${n.text}`);
      break;
    }
    case "draft": {
      const j = store.find(need(args[0], "ID"));
      const dir = await draftFor(j, cfg);
      if (["new", "scored", "filtered_out"].includes(j.status)) j.status = "shortlisted";
      store.save();
      console.log(`Written: ${path.relative(process.cwd(), dir)}/materials.md`);
      break;
    }
    case "mark": {
      const j = store.find(need(args[0], "ID"));
      const status = need(args[1], "STATUS") as JobStatus;
      if (!STATUSES.includes(status)) throw new Error(`Unknown status "${status}". Use one of: ${STATUSES.join(", ")}`);
      j.status = status;
      if (status === "applied" && !j.appliedAt) j.appliedAt = new Date().toISOString();
      const note = args.slice(2).join(" ");
      if (note) j.notes.push({ at: new Date().toISOString(), text: note });
      store.save();
      exportCsv(store);
      console.log(`${j.company} — ${j.title}: ${status}`);
      break;
    }
    case "followups":
      await followUpStep(store, cfg);
      break;
    case "export":
      console.log(`Written: ${path.relative(process.cwd(), exportCsv(store))}`);
      break;
    default:
      console.log(HELP);
      process.exitCode = 1;
  }
}

function collectImports(args: string[]): string[] {
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--import") {
      while (args[i + 1] && !args[i + 1].startsWith("--")) files.push(args[++i]);
    }
  }
  return files;
}

function need(v: string | undefined, name: string): string {
  if (!v) throw new Error(`Missing ${name}. See: npm run job -- help`);
  return v;
}

main().catch((e) => {
  console.error(`Error: ${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
});
