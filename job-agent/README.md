# job-agent

A personal job-hunting agent. Every day it:

1. **Reads Gmail.** It turns job-alert emails (LinkedIn, Naukri, Indeed, foundit, apna) into jobs. It also reads replies from companies (application received, test, interview invite, rejection, offer, recruiter outreach) and updates your tracker.
2. **Fetches** postings from company job boards (Greenhouse, Lever, Ashby), the Adzuna aggregator, and any CSV of jobs you collected yourself.
3. **Filters** them cheaply by title, location (Delhi / Noida / Gurugram), age and excluded keywords, before any AI call.
4. **Matches each job to one of your CV tracks** (Operations, Team Leader, E-commerce, Sales Team Lead, Business Growth). It then scores the job against your CV on skills, seniority, domain and logistics, with reasons, gaps and red flags.
5. **Tailors your CV to each top job's description.** Claude starts from the right CV version, rewrites the headline, summary, competencies and bullets for that job, and saves an editable Word file. Alongside it you get a cover note, a recruiter message, an application email, the job's keywords your CV covers, interview prep, and the requirements you don't meet.
6. **Emails you a digest** with the day's matches, inbox updates and follow-ups due, with the tailored CVs attached.

It never submits an application for you. You check the tailored CV, then apply yourself.

### Your CV stays truthful

The tailoring may only select, reorder and reword what is already in your CV. It may not add employers, titles, numbers, team sizes, tools or achievements. After each draft, the code checks every employer, job title and date against your original CV and flags any mismatch at the top of `materials.md`. Requirements you don't meet go in a "Be careful about" section, not into the CV.

## Setup (once)

Requires Node.js 22+.

```bash
cd job-agent
npm install
cp config.example.yaml config.yaml
mkdir cvs
```

**1. Your CVs.** Copy your five CVs into `cvs/` with these names, or change the `cv_path` lines in `config.yaml`:

| Track | File |
|---|---|
| Operations | `cvs/1-operations.pdf` |
| Team Leader | `cvs/2-team-leader.pdf` |
| E-commerce | `cvs/3-ecommerce.pdf` |
| Sales Team Lead | `cvs/4-sales-team-lead.pdf` |
| Business Growth | `cvs/5-business-growth.pdf` |

**2. Anthropic API key.** Create one at [platform.claude.com](https://platform.claude.com/).

**3. Gmail app password.** Turn on 2-Step Verification for your Google account. Then go to <https://myaccount.google.com/apppasswords>, create an app password named "job-agent", and copy the 16 characters. Set `gmail.address` in `config.yaml` to your Gmail address.

**4. Create `.env`** in the `job-agent` folder:

```
ANTHROPIC_API_KEY=sk-ant-...
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
# optional, for more job sources (free at developer.adzuna.com):
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

**5. Check it reads your CVs.** This command reads each PDF once and caches the text in `data/cv-text/`:

```bash
npm run job -- cvs
```

**6. Set up job alerts** on LinkedIn and Naukri (and Indeed or foundit if you use them) for each of your five job types in Delhi, Noida and Gurugram, delivered to this Gmail address. These alerts are the agent's main job feed.

`config.yaml`, `cvs/`, `.env`, `data/` and `output/` are git-ignored, so your personal data never leaves your computer through git.

## Daily use

```bash
npm run job -- run
```

Then open the digest email, or `output/<date>/report.md`. Each shortlisted job has a folder:

```
output/2026-11-24/acme-naturals-e-commerce-executive/
  Your_Name_CV_acme-naturals.docx    ← tailored CV: review, then save as PDF to upload
  materials.md                       ← cover note, recruiter message, email, interview prep
```

After applying, record it. Replies from the company are then tracked from Gmail automatically.

```bash
npm run job -- mark 5164 applied
npm run job -- mark 415f skipped
```

### Jobs from alert emails

An alert email only has a short summary of each job, so those jobs are marked _alert summary only_ and get light tailoring. For any you like:

1. Open the link and copy the full job description into a text file.
2. Run:

```bash
npm run job -- jd 5164 jd.txt
```

This re-scores the job and re-tailors your CV against the full description.

### All commands

| Command | What it does |
|---|---|
| `run [--import FILE]` | Daily run: Gmail, job boards, filter, score, tailor the top N, report, digest |
| `gmail` | Only check Gmail (alerts and replies) |
| `jd ID FILE` | Give a job its full description, then re-score and re-tailor |
| `draft ID` | Tailor the CV and materials for any job, even one below the cut |
| `list [status]` | List the pipeline (default: shortlisted → offer) |
| `show ID` | A job's score, chosen CV, gaps, emails and notes |
| `mark ID STATUS [note]` | `applied`, `assessment`, `interview`, `offer`, `rejected`, `skipped` |
| `followups` | Draft follow-ups for applications with no reply after `follow_up_days` |
| `export` | Write `output/tracker.csv` (open it in Sheets or Excel) |
| `cvs` | Check every track's CV can be read |

An ID can be shortened to any unique prefix or suffix.

### Importing jobs you collected

The CSV needs a header row with `company,title,location,url,description`. Paste the full job text into `description`; see `examples/linkedin-jobs.csv`. Run it with `npm run job -- run --import jobs.csv`.

### Running it every day

On macOS or Linux, run `crontab -e` and add this line to run it at 8:37 every morning:

```
37 8 * * * cd /path/to/job-agent && /usr/bin/env npm run job -- run >> data/cron.log 2>&1
```

On Windows, use Task Scheduler with the action `cmd /c "cd /d C:\path\to\job-agent && npm run job -- run"`.

## How it works

```
Gmail alerts ─┐
job boards  ──┼─► data/jobs.json ─► filter ─► score (best CV track) ─► tailor CV + materials ─► report + digest
CSV imports ──┘                                                                           Gmail replies ─► status updates
```

- **Tracks.** Each track lists title phrases. A job joins every track whose phrase appears in its title as whole words, so "E-commerce" and "Ecommerce", or "Gurgaon" and "Gurugram", count as the same. Claude then picks the best CV among the matched tracks for that job.
- **Claude calls** (`src/claude.ts`) use structured outputs, validated against Zod schemas. Each CV is placed first in the prompt with prompt caching, so scoring many jobs re-reads it cheaply. Effort is `low` for scoring and email reading and `medium` for tailoring. The refusal fallback is on (`fallbacks: "default"`).
- **Gmail** (`src/gmail.ts`) uses IMAP with your app password and only searches your inbox for alert senders and job-related words, so unrelated mail is never read or sent to Claude. The only email it sends is the digest, to your own address.
- **Email content is treated as data, never as instructions.**

### Cost

On `claude-opus-5-5`, a day that scores around 80 jobs and tailors 10 costs roughly $2–3. To spend less, lower `max_jobs_per_run` or `top_n`, tighten the track titles, or set `model: claude-sonnet-5-5`.

## Adding a source

Write a function in `src/sources/index.ts` that returns `RawJob[]`, and add it to `fetchAll`. Stick to official APIs, RSS feeds, email alerts or files you export yourself. LinkedIn and Naukri forbid scraping and automated applying.
