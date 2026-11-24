/**
 * One-time setup wizard: `npm run setup` (or `npm run setup -- <step>` to redo one step).
 * Steps: config, cvs, anthropic, gmail, whatsapp, facts, calendar, schedule.
 * Secrets are typed hidden and written to .env; nothing is sent anywhere except to the service being checked.
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import Anthropic from "@anthropic-ai/sdk";
import { ImapFlow } from "imapflow";
import YAML from "yaml";

const ROOT = process.cwd();
const CONFIG = path.join(ROOT, "config.yaml");
const ENV = path.join(ROOT, ".env");
const CREDS = path.join(ROOT, "google-credentials.json");
/** Which uploaded file is which CV, judged by its file name. */
const CV_NAMES: [string, (f: string) => boolean][] = [
  ["1-operations.pdf", (f) => /operation/i.test(f) && !/sales|growth|commerce|team/i.test(f)],
  ["2-team-leader.pdf", (f) => /team[\s_-]*lead/i.test(f) && !/sales/i.test(f)],
  ["3-ecommerce.pdf", (f) => /e[\s_-]?commerce/i.test(f)],
  ["4-sales-team-lead.pdf", (f) => /sales/i.test(f)],
  ["5-business-growth.pdf", (f) => /growth/i.test(f)],
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const c = { b: (s: string) => `\x1b[1m${s}\x1b[0m`, g: (s: string) => `\x1b[32m${s}\x1b[0m`, y: (s: string) => `\x1b[33m${s}\x1b[0m`, r: (s: string) => `\x1b[31m${s}\x1b[0m`, d: (s: string) => `\x1b[2m${s}\x1b[0m` };
const ok = (s: string) => console.log(`  ${c.g("✓")} ${s}`);
const warn = (s: string) => console.log(`  ${c.y("!")} ${s}`);
const bad = (s: string) => console.log(`  ${c.r("✗")} ${s}`);

async function ask(q: string, def = ""): Promise<string> {
  const a = (await rl.question(`  ${q}${def ? c.d(` [${def}]`) : ""}: `)).trim();
  return a || def;
}
async function yes(q: string, def = true): Promise<boolean> {
  const a = (await ask(`${q} ${def ? "(Y/n)" : "(y/N)"}`)).toLowerCase();
  return a ? a.startsWith("y") : def;
}
async function pause(q = "Press Enter when done") {
  await rl.question(`  ${c.d(q + "…")}`);
}

/** Reads a line without echoing it (shows * per character). */
async function secret(q: string): Promise<string> {
  rl.pause();
  process.stdout.write(`  ${q}: `);
  const stdin = process.stdin;
  const wasRaw = stdin.isRaw;
  if (stdin.isTTY) stdin.setRawMode(true);
  stdin.resume();
  let value = "";
  return new Promise((resolve) => {
    const onData = (buf: Buffer) => {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          stdin.off("data", onData);
          if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
          process.stdout.write("\n");
          rl.resume();
          resolve(value.trim());
          return;
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        value += ch;
        process.stdout.write("*");
      }
    };
    stdin.on("data", onData);
  });
}

function openUrl(url: string) {
  const cmd = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
  console.log(`  ${c.d("Opening")} ${url}`);
}

// ---------- .env and config helpers ----------

function readEnv(): Record<string, string> {
  if (!fs.existsSync(ENV)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(ENV, "utf8")
      .split(/\r?\n/)
      .filter((l) => /^\s*[A-Z0-9_]+\s*=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"(.*)"$/, "$1")];
      }),
  );
}
function setEnv(key: string, value: string) {
  const env = { ...readEnv(), [key]: value };
  fs.writeFileSync(ENV, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", { mode: 0o600 });
  process.env[key] = value;
}
function loadDoc() {
  if (!fs.existsSync(CONFIG)) fs.copyFileSync(path.join(ROOT, "config.example.yaml"), CONFIG);
  return YAML.parseDocument(fs.readFileSync(CONFIG, "utf8"));
}
function saveDoc(doc: YAML.Document) {
  fs.writeFileSync(CONFIG, doc.toString());
}

// ---------- Steps ----------

async function stepConfig() {
  console.log(c.b("\n1. Your Gmail address and WhatsApp number"));
  const doc = loadDoc();
  const curMail = String(doc.getIn(["gmail", "address"]) ?? "");
  const curPhone = String(doc.getIn(["whatsapp", "phone"]) ?? "");
  let mail = "";
  while (!/^[^\s@]+@gmail\.com$/i.test(mail)) {
    mail = await ask("Gmail address the job alerts and recruiter emails arrive at", curMail.includes("your.address") ? "" : curMail);
    if (!/^[^\s@]+@gmail\.com$/i.test(mail)) warn("Please enter a full @gmail.com address.");
  }
  let phone = "";
  while (!/^\+\d{10,15}$/.test(phone)) {
    phone = (await ask("WhatsApp number with country code, e.g. +9198XXXXXXXX", curPhone.includes("X") ? "" : curPhone)).replace(/[\s-]/g, "");
    if (!/^\+\d{10,15}$/.test(phone)) warn("Start with + and the country code, digits only.");
  }
  doc.setIn(["gmail", "address"], mail);
  doc.setIn(["whatsapp", "phone"], phone);
  saveDoc(doc);
  ok("Saved to config.yaml");
}

async function stepCvs() {
  console.log(c.b("\n2. Your five CVs"));
  const dir = path.join(ROOT, "cvs");
  fs.mkdirSync(dir, { recursive: true });
  const missing = CV_NAMES.filter(([n]) => !fs.existsSync(path.join(dir, n)));
  if (!missing.length) return ok("All five CVs are in the cvs folder");
  const home = process.env.USERPROFILE || process.env.HOME || ROOT;
  const from = await ask("Folder that has your five CV PDFs", path.join(home, "Downloads"));
  if (!fs.existsSync(from)) return bad(`Folder not found: ${from}`);
  const pdfs = fs.readdirSync(from).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const used = new Set<string>();
  for (const [target, re] of CV_NAMES) {
    if (fs.existsSync(path.join(dir, target))) continue;
    // Prefer the most recently modified matching file.
    const match = pdfs
      .filter((f) => re(f) && !used.has(f))
      .sort((a, b) => fs.statSync(path.join(from, b)).mtimeMs - fs.statSync(path.join(from, a)).mtimeMs)[0];
    if (!match) {
      warn(`No PDF found for ${target.replace(/^\d-|\.pdf$/g, "")} — copy it into cvs\\${target} yourself`);
      continue;
    }
    used.add(match);
    fs.copyFileSync(path.join(from, match), path.join(dir, target));
    ok(`${match}  →  cvs/${target}`);
  }
}

async function stepAnthropic() {
  console.log(c.b("\n3. Anthropic API key (lets the agent use Claude)"));
  console.log(`  Sign in, add a little credit under Billing (US$5 lasts a few days of daily runs), then
  open API Keys → Create Key, name it "job-agent", and copy it.`);
  if (await yes("Open the API keys page now?")) openUrl("https://platform.claude.com/settings/keys");
  for (;;) {
    const key = await secret("Paste the key (starts with sk-ant-)");
    if (!key.startsWith("sk-ant-")) {
      warn("That doesn't look like an Anthropic key.");
      continue;
    }
    process.stdout.write("  Checking… ");
    try {
      await new Anthropic({ apiKey: key }).models.list({ limit: 1 });
      console.log(c.g("works"));
      setEnv("ANTHROPIC_API_KEY", key);
      return ok("Saved to .env");
    } catch (e) {
      console.log(c.r("rejected"));
      if (e instanceof Anthropic.AuthenticationError) warn("The key was not accepted. Copy it again (the whole key).");
      else warn(`Could not check it: ${(e as Error).message}`);
      if (!(await yes("Try again?"))) return;
    }
  }
}

async function stepGmail() {
  console.log(c.b("\n4. Gmail app password (lets the agent read and send your job emails)"));
  console.log(`  Google needs 2-Step Verification on first. Then on the App passwords page, type the name
  "job-agent", click Create, and copy the 16-letter password.`);
  if (await yes("Open the App passwords page now?")) openUrl("https://myaccount.google.com/apppasswords");
  const address = String(loadDoc().getIn(["gmail", "address"]) ?? "");
  for (;;) {
    const pass = (await secret("Paste the 16-letter app password")).replace(/\s+/g, "");
    if (pass.length !== 16) {
      warn("App passwords are 16 letters.");
      continue;
    }
    process.stdout.write("  Signing in to Gmail… ");
    const client = new ImapFlow({ host: "imap.gmail.com", port: 993, secure: true, auth: { user: address, pass }, logger: false });
    try {
      await client.connect();
      await client.logout();
      console.log(c.g("works"));
      setEnv("GMAIL_APP_PASSWORD", pass);
      return ok("Saved to .env");
    } catch (e) {
      console.log(c.r("failed"));
      warn(`Gmail said: ${(e as Error).message}. Check the address in step 1 (${address}) and the password.`);
      if (!(await yes("Try again?"))) return;
    }
  }
}

async function stepWhatsApp() {
  console.log(c.b("\n5. WhatsApp alerts (CallMeBot, free)"));
  console.log(`  On the page that opens, find CallMeBot's current WhatsApp number, save it in your phone's
  contacts, and send it this exact message from WhatsApp:

      ${c.b("I allow callmebot to send me messages")}

  Within a couple of minutes it replies with your API key (a few digits).`);
  if (await yes("Open the CallMeBot instructions now?")) openUrl("https://www.callmebot.com/blog/free-api-whatsapp-messages/");
  const doc = loadDoc();
  const phone = String(doc.getIn(["whatsapp", "phone"]) ?? "");
  for (;;) {
    const key = await ask("API key from CallMeBot's reply");
    if (!/^\d{4,10}$/.test(key)) {
      warn("The key is the number in CallMeBot's reply.");
      continue;
    }
    setEnv("CALLMEBOT_API_KEY", key);
    process.stdout.write("  Sending a test message… ");
    const q = new URLSearchParams({ phone, text: "✅ Job agent is connected. You'll get interview and application alerts here.", apikey: key });
    try {
      const res = await fetch(`https://api.callmebot.com/whatsapp.php?${q}`);
      console.log(res.ok ? c.g("sent") : c.r(`HTTP ${res.status}`));
    } catch (e) {
      console.log(c.r((e as Error).message));
    }
    if (await yes("Did the test message arrive on WhatsApp?")) {
      doc.setIn(["whatsapp", "provider"], "callmebot");
      doc.setIn(["whatsapp", "enabled"], true);
      saveDoc(doc);
      return ok("WhatsApp alerts are on");
    }
    warn(`It can take a few minutes the first time. Check the number in step 1 (${phone}) and the key.`);
    if (!(await yes("Try again?"))) return;
  }
}

async function stepFacts() {
  console.log(c.b("\n6. What the agent may tell recruiters"));
  console.log(`  Recruiters often ask these. Leave one empty and the agent will ask you on WhatsApp instead
  of answering. These stay on your computer, in config.yaml.`);
  const doc = loadDoc();
  const get = (k: string) => String(doc.getIn(["replies", "facts", k]) ?? "");
  const fields: [string, string, string][] = [
    ["current_ctc", "Current CTC (e.g. 4.2 LPA)", ""],
    ["expected_ctc", "Expected CTC (e.g. 5.5–6 LPA, negotiable)", ""],
    ["notice_period", "Notice period (e.g. 30 days, or Immediate)", ""],
    ["available_to_join", "Earliest joining (e.g. within 30 days of offer)", ""],
    ["current_location", "Where you live", "Delhi"],
    ["preferred_locations", "Where you'll work", "Delhi, Noida, Gurugram"],
    ["open_to_relocation", "Open to relocating outside NCR?", "No"],
  ];
  for (const [k, label, def] of fields) doc.setIn(["replies", "facts", k], await ask(label, get(k) || def));

  console.log(`\n  When can you attend interviews? ${c.d("(the agent only accepts times inside these hours)")}`);
  const days = await ask("Days (Mon Tue Wed Thu Fri Sat Sun)", ((doc.getIn(["replies", "availability", "days"]) as YAML.YAMLSeq | undefined)?.toJSON() ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).join(" "));
  doc.setIn(["replies", "availability", "days"], days.split(/[\s,]+/).filter((d) => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(d)));
  doc.setIn(["replies", "availability", "start"], await ask("From (24h, e.g. 10:00)", String(doc.getIn(["replies", "availability", "start"]) ?? "10:00")));
  doc.setIn(["replies", "availability", "end"], await ask("Until (24h, e.g. 18:00)", String(doc.getIn(["replies", "availability", "end"]) ?? "18:00")));

  console.log(`\n  ${c.b("Safe start:")} for the first few days, applications and replies can wait in Gmail Drafts so you
  can see what the agent writes before anything is sent. Switch to automatic any time with ${c.b("npm run setup -- mode")}.`);
  const safe = await yes("Start in safe mode (drafts only)?");
  doc.setIn(["apply", "mode"], safe ? "draft" : "auto");
  doc.setIn(["replies", "mode"], safe ? "draft" : "auto");
  saveDoc(doc);
  ok(`Saved. Applications and replies: ${safe ? "drafts for you to send" : "sent automatically"}`);
}

async function stepMode() {
  const doc = loadDoc();
  const now = doc.getIn(["apply", "mode"]);
  const auto = await yes(`Applications and replies are now "${now}". Send automatically from now on?`, now !== "auto");
  doc.setIn(["apply", "mode"], auto ? "auto" : "draft");
  doc.setIn(["replies", "mode"], auto ? "auto" : "draft");
  saveDoc(doc);
  ok(auto ? "Automatic sending is on" : "Drafts only");
}

async function stepCalendar() {
  console.log(c.b("\n7. Google Calendar (about 5 minutes, once)"));
  if (!fs.existsSync(CREDS)) {
    console.log(`  a) On the page that opens, create a project (top bar → project picker → New project → name it
     "job-agent" → Create). Make sure it is selected.
  b) Search "Google Calendar API" in the top search bar → open it → ${c.b("Enable")}.
  c) Left menu → ${c.b("Google Auth Platform")} (or "OAuth consent screen") → Get started:
     app name "job-agent", your Gmail as support email, Audience ${c.b("External")}, your Gmail as contact → Create.
     Then ${c.b("Audience")} → Test users → Add users → your Gmail → Save.
  d) ${c.b("Clients")} (or Credentials) → Create client → Application type ${c.b("Desktop app")} → Create →
     ${c.b("Download JSON")}.`);
    if (await yes("Open Google Cloud now?")) openUrl("https://console.cloud.google.com/apis/library/calendar-json.googleapis.com");
    await pause("Press Enter once the JSON file has downloaded");
    const home = process.env.USERPROFILE || process.env.HOME || ROOT;
    const dl = path.join(home, "Downloads");
    const newest = fs.existsSync(dl)
      ? fs
          .readdirSync(dl)
          .filter((f) => /^client_secret.*\.json$/i.test(f))
          .sort((a, b) => fs.statSync(path.join(dl, b)).mtimeMs - fs.statSync(path.join(dl, a)).mtimeMs)[0]
      : undefined;
    const file = await ask("Path of the downloaded JSON", newest ? path.join(dl, newest) : "");
    if (!file || !fs.existsSync(file)) return bad("File not found. Run `npm run setup -- calendar` to try again.");
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!json.installed) return bad('That file is not a "Desktop app" client. Create a Desktop app client and download its JSON.');
    fs.copyFileSync(file, CREDS);
    ok("Saved as google-credentials.json");
  }
  console.log(`\n  Now sign in. Google will warn "Google hasn't verified this app" because it's your own private
  app: click ${c.b("Continue")}, then allow both calendar permissions.`);
  const { googleLogin } = await import("./google.js");
  await googleLogin(openUrl);
  const doc = loadDoc();
  doc.setIn(["calendar", "enabled"], true);
  saveDoc(doc);
  ok("Google Calendar connected");
}

async function stepSchedule() {
  console.log(c.b("\n8. Run automatically every 4 hours"));
  const runner = path.join(ROOT, process.platform === "win32" ? "run-job-agent.cmd" : "run-job-agent.sh");
  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
  if (process.platform === "win32") {
    fs.writeFileSync(runner, `@echo off\r\ncd /d "${ROOT}"\r\ncall npm run job -- run >> "${path.join(ROOT, "data", "run.log")}" 2>&1\r\n`);
    if (!(await yes("Create a Windows scheduled task that runs the agent every 4 hours (8 am to 8 pm)?"))) return;
    const cmd = `schtasks /Create /F /TN "Job Agent" /SC DAILY /ST 08:07 /RI 240 /DU 12:00 /TR "\\"${runner}\\""`;
    exec(cmd, (err, out, errOut) => {
      if (err) bad(`Could not create the task: ${errOut || err.message}`);
      else ok('Scheduled task "Job Agent" created (see Task Scheduler). Your PC must be on and signed in.');
    });
    await new Promise((r) => setTimeout(r, 2500));
  } else {
    fs.writeFileSync(runner, `#!/bin/sh\ncd "${ROOT}" && npm run job -- run >> data/run.log 2>&1\n`, { mode: 0o755 });
    console.log(`  Add this line with ${c.b("crontab -e")}:\n\n    7 8,12,16,20 * * * ${runner}\n`);
  }
}

async function status() {
  const env = readEnv();
  const doc = fs.existsSync(CONFIG) ? loadDoc() : null;
  const facts = doc ? (doc.getIn(["replies", "facts"]) as YAML.YAMLMap | undefined)?.toJSON() ?? {} : {};
  const rows: [string, boolean][] = [
    ["Gmail address and WhatsApp number", Boolean(doc && !String(doc.getIn(["gmail", "address"])).includes("your.address") && !String(doc.getIn(["whatsapp", "phone"])).includes("X"))],
    ["Five CVs in cvs/", CV_NAMES.every(([n]) => fs.existsSync(path.join(ROOT, "cvs", n)))],
    ["Anthropic API key", Boolean(env.ANTHROPIC_API_KEY)],
    ["Gmail app password", Boolean(env.GMAIL_APP_PASSWORD)],
    ["WhatsApp (CallMeBot key)", Boolean(env.CALLMEBOT_API_KEY)],
    ["Recruiter facts (CTC, notice period)", Boolean(facts.expected_ctc && facts.notice_period)],
    ["Google Calendar", fs.existsSync(path.join(ROOT, "data", "google-token.json"))],
  ];
  console.log(c.b("\nSetup status"));
  for (const [label, done] of rows) console.log(`  ${done ? c.g("✓") : c.y("○")} ${label}`);
  return rows.every(([, d]) => d);
}

const STEPS: Record<string, () => Promise<void>> = {
  config: stepConfig,
  cvs: stepCvs,
  anthropic: stepAnthropic,
  gmail: stepGmail,
  whatsapp: stepWhatsApp,
  facts: stepFacts,
  calendar: stepCalendar,
  schedule: stepSchedule,
  mode: stepMode,
};

async function main() {
  console.log(c.b("Job agent setup") + c.d("  (Ctrl+C to stop; run again any time to continue where you left off)"));
  const only = process.argv[2];
  if (only) {
    if (!STEPS[only]) throw new Error(`Unknown step "${only}". Steps: ${Object.keys(STEPS).join(", ")}`);
    await STEPS[only]();
  } else {
    await status();
    for (const [name, fn] of Object.entries(STEPS)) {
      if (name === "mode") continue;
      try {
        await fn();
      } catch (e) {
        bad(`${name}: ${(e as Error).message}`);
        if (!(await yes("Continue with the next step?"))) break;
      }
    }
  }
  const done = await status();
  console.log(
    done
      ? `\n${c.g("All set.")} Do a first run now with ${c.b("npm run job -- run")} and watch WhatsApp and Gmail Drafts.\n`
      : `\nRun ${c.b("npm run setup")} again to finish the steps marked ○, or ${c.b("npm run setup -- <step>")} for one step.\n`,
  );
  rl.close();
}

main().catch((e) => {
  console.error(c.r(`Setup stopped: ${(e as Error).message}`));
  rl.close();
  process.exitCode = 1;
});
