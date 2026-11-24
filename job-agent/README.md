# job-agent

A personal job-hunting agent. Each run it:

1. **Fetches** new postings from company job boards (Greenhouse, Lever, Ashby), the Adzuna aggregator, and any jobs you collected yourself (LinkedIn, Naukri, referrals) as a CSV or JSON file.
2. **Filters** them cheaply by title, location, age, and excluded keywords or companies, before any AI call.
3. **Scores** the rest against your CV with Claude, on four sub-scores you weight: skills, seniority, domain and logistics. Each score comes with reasons, gaps and red flags.
4. **Drafts materials** for the top N: a cover note, a recruiter message, reworded CV bullets, keywords, interview prep, and what *not* to claim.
5. **Writes a daily report** and keeps a tracker: shortlisted → applied → interview → offer.
6. **Drafts follow-ups** for applications with no reply after N days.

It never submits an application for you. You review the materials and apply yourself. That keeps the quality up and your accounts safe: LinkedIn and Naukri forbid automated applying and scraping, which is why LinkedIn jobs come in through a file you supply.

## Setup

Requires Node.js 22+ and an [Anthropic API key](https://platform.claude.com/).

```bash
cd job-agent
npm install
cp config.example.yaml config.yaml   # then edit it
cp cv.example.md cv.md               # or point cv_path at your PDF CV
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

Optional: get a free [Adzuna](https://developer.adzuna.com/) key and add `ADZUNA_APP_ID=...` and `ADZUNA_APP_KEY=...` to `.env`.

`config.yaml`, `cv.*`, `.env`, `data/` and `output/` are git-ignored, so your personal data stays local.

## Daily use

```bash
npm run job -- run                                  # full run
npm run job -- run --import ~/Downloads/jobs.csv    # also import jobs you collected
```

Open `output/<date>/report.md`. For each shortlisted job, edit `materials.md` until it sounds like you, apply, then record it:

```bash
npm run job -- mark 5164 applied "applied on careers page"
npm run job -- mark 415f skipped
npm run job -- mark 5164 interview "HR round Tue 3pm"
```

Other commands:

| Command | What it does |
|---|---|
| `list [status]` | Lists the pipeline (default: shortlisted, applied, interview, offer) |
| `show ID` | Shows a job's score, reasons, gaps and notes |
| `draft ID` | Drafts materials for any job, even one below the cut |
| `followups` | Drafts follow-up emails and LinkedIn messages for stale applications |
| `export` | Writes `output/tracker.csv` (open it in Sheets or Excel) |

An ID can be shortened to any unique prefix or suffix.

### Importing jobs you collected

The CSV needs a header row with `company,title,location,url,description`. The first two and `description` are required; paste the full job text into `description`. See `examples/linkedin-jobs.csv`. A JSON array of objects with the same keys also works.

### Running it every day

On macOS or Linux, run `crontab -e` and add:

```
37 8 * * * cd /path/to/job-agent && /usr/bin/env npm run job -- run >> data/cron.log 2>&1
```

On Windows, use Task Scheduler to run the same command.

## How it works

```
sources/ ─► store (data/jobs.json) ─► filter.ts ─► claude.ts scoreJob ─► claude.ts draftMaterials ─► output/<date>/
```

- **Claude calls** (`src/claude.ts`) use structured outputs: each response is checked against a Zod schema, so there's no fragile text parsing. Your CV is sent as the first content block with prompt caching, so scoring 80 jobs re-reads it at a fraction of the cost. Scoring runs at `low` effort, and drafting at `medium`.
- **The overall score** is computed in code from the weighted sub-scores, so changing `scoring.weights` re-ranks the results without changing any prompt.
- **Refusals:** the server-side fallback is on (`fallbacks: "default"`). If a safety classifier declines a request, the API retries it on a fallback model in the same call.
- **Honesty guardrail:** the drafting prompt forbids inventing experience. Gaps go into a "Be careful about" section instead of being hidden.

### Cost

On `claude-opus-5-5`, a typical run that scores ~80 jobs and drafts 10 costs roughly $2–3, mostly the scoring. Lower `max_jobs_per_run`, tighten the title and location filters, or set `model: claude-sonnet-5-5` in `config.yaml` to spend less.

## Adding a source

Write a function in `src/sources/index.ts` that returns `RawJob[]`, and add it to `fetchAll`. Stick to official APIs, RSS feeds or files you export yourself.
