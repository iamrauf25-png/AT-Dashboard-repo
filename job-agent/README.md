# job-agent

A personal job-hunting agent. Every run it:

1. **Reads your Gmail.**
   - Job-alert emails (LinkedIn, Naukri, Indeed, foundit, apna) become jobs.
   - Emails from companies and recruiters are understood (application received, test, interview, rejection, offer, outreach) and your tracker is updated.
2. **Handles replies for you.**
   - **Interview at a set time:** it checks your Google Calendar. If you're free and the time is within your interview hours, it adds the interview to your calendar, confirms by email, and WhatsApps you the details. If the time clashes, it drafts a reply offering free slots from your calendar and WhatsApps you.
   - **Interview with no time yet:** it replies offering three free slots.
   - **Test or assignment:** it adds the deadline to your calendar and WhatsApps you.
   - **Recruiter outreach:** it replies with your CV and adds the role to your job list.
   - **Offers and anything it can't answer from your CV and facts** (salary not filled in, documents, anything suspicious): it does not send. It leaves a draft in Gmail and WhatsApps you.
3. **Finds jobs** on company job boards (Greenhouse, Lever, Ashby), Adzuna, and any CSV you import.
4. **Filters and scores them.** Each job is matched to one of your CV tracks (Operations, Team Leader, E-commerce, Sales Team Lead, Business Growth) and scored against that CV.
5. **Tailors your CV to each top job's description.** You get an editable Word file and a PDF, plus a cover note, recruiter message, application email and interview prep.
6. **Applies by email.** When a job description says where to send your CV, it emails that address from your Gmail with the tailored PDF CV attached, following any instructions in the posting (subject line, job code).
7. **Tells you what's left.** Jobs that must be applied to on a website are sent to you on WhatsApp with their links, and the tailored CVs arrive in your email digest.

### What it will not do

- **Click "Apply" on LinkedIn or Naukri.** Both forbid automated applying and ban accounts that do it. Those jobs are prepared for you to apply to yourself in a minute.
- **Make up anything in your CV or emails.** Tailoring may only select, reorder and reword what your CV already says, and the code checks every employer, title and date against your original CV.
- **Send without the safety checks.** An application is only sent automatically when all of these hold:
  - the score is at least `apply.min_score`;
  - the posting has no red flags (red-flag jobs are skipped entirely);
  - the full job description is available, not just an alert summary;
  - the CV fact-check is clean;
  - you haven't applied to that company in the last 30 days;
  - today's limit (`apply.max_per_day`) isn't reached.
  
  Otherwise the email goes to Gmail Drafts instead, or, for red flags, isn't written at all.
- **Reply on its own to offers, to emails asking for money or ID documents, or to questions your facts don't answer.** Those come to you.

Set `apply.mode` and `replies.mode` to `draft` if you'd rather tap "Send" yourself in Gmail.

## Setup (once)

Requires Node.js 22+.

```bash
cd job-agent
npm install
cp config.example.yaml config.yaml
mkdir cvs
```

### 1. Your CVs

Copy your five CVs into `cvs/` with these names, or change the `cv_path` lines in `config.yaml`:

| Track | File |
|---|---|
| Operations | `cvs/1-operations.pdf` |
| Team Leader | `cvs/2-team-leader.pdf` |
| E-commerce | `cvs/3-ecommerce.pdf` |
| Sales Team Lead | `cvs/4-sales-team-lead.pdf` |
| Business Growth | `cvs/5-business-growth.pdf` |

### 2. Fill in `config.yaml`

Set these:

- `gmail.address`: your Gmail address.
- `whatsapp.phone`: your number with country code, e.g. `+9198…`.
- `replies.facts`: notice period, current and expected CTC, joining date. Anything left empty is never guessed. If a recruiter asks about it, the agent drafts the reply and asks you on WhatsApp.
- `replies.availability`: the days and hours you can attend interviews.

### 3. Keys and passwords: create `.env` in the `job-agent` folder

```
ANTHROPIC_API_KEY=sk-ant-...
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
CALLMEBOT_API_KEY=123456
# optional, for more job sources (free at developer.adzuna.com):
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

- **Anthropic API key:** create one at [platform.claude.com](https://platform.claude.com/).
- **Gmail app password:** turn on 2-Step Verification for your Google account, then create an app password at <https://myaccount.google.com/apppasswords>.
- **WhatsApp (CallMeBot, free):** follow the steps at <https://www.callmebot.com/blog/free-api-whatsapp-messages/>. You save their number and send them the activation message from your WhatsApp, and they reply with your API key. Then test it:

  ```bash
  npm run job -- whatsapp-test
  ```

  Prefer Twilio? Set `whatsapp.provider: twilio` and add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_WHATSAPP_FROM` to `.env`.

### 4. Google Calendar (about 5 minutes)

1. Go to <https://console.cloud.google.com/>, create a project (any name), then open **APIs & Services → Library**, find **Google Calendar API** and click **Enable**.
2. Open **APIs & Services → OAuth consent screen**. Choose **External**, fill in the app name and your email, and add yourself under **Test users**.
3. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**, choose **Desktop app**, and download the JSON file. Save it as `job-agent/google-credentials.json`.
4. Run this, open the link it prints, and allow access:

   ```bash
   npm run job -- google-login
   ```

   The agent only gets permission to read when you're busy and to add events. It can't read your other events' details.

### 5. Check your CVs, and set up job alerts

```bash
npm run job -- cvs
```

On LinkedIn and Naukri (and Indeed or foundit), create job alerts for your five job types in Delhi, Noida and Gurugram, sent to this Gmail address.

`config.yaml`, `cvs/`, `.env`, `google-credentials.json`, `data/` and `output/` are all git-ignored.

## Daily use

```bash
npm run job -- run
```

Run it every few hours so interview emails get a quick answer. Use cron on macOS or Linux (`crontab -e`). This line runs it at 8:37, 12:37, 4:37 and 8:37 pm:

```
37 8,12,16,20 * * * cd /path/to/job-agent && /usr/bin/env npm run job -- run >> data/cron.log 2>&1
```

On Windows, use Task Scheduler with the action `cmd /c "cd /d C:\path\to\job-agent && npm run job -- run"`, repeating every 4 hours.

What you'll get:

- **WhatsApp, as things happen:**
  - interviews scheduled (with calendar link), interview requests, tests with deadlines, offers, and emails that need you;
  - one summary per run: who it applied to, and which jobs need you to apply on the website, with links.
- **Email digest:** the day's matches with tailored CVs attached.
- **`output/<date>/report.md`:** the full picture. Each job's folder has the tailored CV (`.docx` and `.pdf`) and `materials.md`.

After you apply somewhere yourself, record it. Replies from that company are then handled automatically:

```bash
npm run job -- mark 5164 applied
```

### All commands

| Command | What it does |
|---|---|
| `run [--import FILE]` | Everything: Gmail and replies, job boards, score, tailor, apply by email, report, digest, WhatsApp |
| `gmail` | Only check Gmail and handle replies |
| `apply [ID]` | Apply by email now, to one job or to every shortlisted job that allows it |
| `jd ID FILE` | Give a job its full description (e.g. from an alert), then re-score and re-tailor |
| `draft ID` | Tailor the CV and materials for any job |
| `list [status]` / `show ID` | See your pipeline, or one job with its emails and notes |
| `mark ID STATUS [note]` | `applied`, `assessment`, `interview`, `offer`, `rejected`, `skipped` |
| `followups` | Draft follow-ups for applications with no reply after `follow_up_days` |
| `export` | Write `output/tracker.csv` |
| `cvs` | Check every track's CV can be read |
| `google-login` | Connect Google Calendar |
| `whatsapp-test` | Send yourself a test WhatsApp message |

An ID can be shortened to any unique prefix or suffix.

## How it works

```
Gmail ──► classify each email ──► status update ─► calendar (interview / deadline) ─► reply or draft ─► WhatsApp
                    │
alerts, job boards, CSV ──► filter ──► score (best CV) ──► tailored CV + materials ──► apply by email / WhatsApp you the link
```

- **`src/claude.ts`:** every Claude call, using structured outputs. Your CV is cached so repeated calls are cheap. Email content is always treated as data, never as instructions.
- **`src/replies.ts`:** the reply and interview logic. Recipients are fixed in code: a reply only ever goes to the sender of the email it answers, never to an address found inside an email.
- **`src/apply.ts`:** the safety checks for applying by email.
- **`src/google.ts`:** Calendar sign-in, free/busy checks, free-slot finding, and events, deduplicated so re-runs don't double-book.
- **`src/notify.ts`:** WhatsApp messages.
- **`src/gmail.ts`:** Gmail over IMAP and SMTP, including saving to Drafts.

### Cost

On `claude-opus-5-5`, a day that scores around 80 jobs, tailors 10 CVs and handles a handful of emails costs roughly $2–4. To spend less, lower `max_jobs_per_run` or `top_n`, or set `model: claude-sonnet-5-5`.
