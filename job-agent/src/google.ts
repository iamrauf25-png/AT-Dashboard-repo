import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { calendar_v3, calendar } from "@googleapis/calendar";
import { OAuth2Client } from "google-auth-library";
import { DATA_DIR, type Config } from "./config.js";
import type { Interview } from "./types.js";

/**
 * Google Calendar via OAuth. One-time setup (see README): create an OAuth client of type
 * "Desktop app" in Google Cloud, enable the Calendar API, save the JSON as google-credentials.json
 * in this folder, then run `npm run job -- google-login`.
 */

const CREDENTIALS = path.join(process.cwd(), "google-credentials.json");
const TOKEN = path.join(DATA_DIR, "google-token.json");
const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.freebusy"];

function oauthClient(redirectUri?: string): OAuth2Client {
  if (!fs.existsSync(CREDENTIALS)) throw new Error("google-credentials.json not found (see README → Google Calendar)");
  const raw = JSON.parse(fs.readFileSync(CREDENTIALS, "utf8"));
  const c = raw.installed ?? raw.web;
  return new OAuth2Client({ clientId: c.client_id, clientSecret: c.client_secret, redirectUri });
}

/** Opens a one-time browser sign-in and stores a refresh token in data/google-token.json. */
export async function googleLogin(): Promise<void> {
  const server = http.createServer();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const client = oauthClient(`http://127.0.0.1:${port}`);
  const url = client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES });
  console.log(`Open this link in your browser and allow access:\n\n${url}\n`);
  const code = await new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      const u = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      const c = u.searchParams.get("code");
      res.end(c ? "Signed in. You can close this tab." : "No code received.");
      if (c) resolve(c);
      else if (u.searchParams.get("error")) reject(new Error(u.searchParams.get("error")!));
    });
  });
  server.close();
  const { tokens } = await client.getToken(code);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKEN, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  console.log("Google Calendar connected.");
}

let api: calendar_v3.Calendar | null = null;
function cal(): calendar_v3.Calendar {
  if (api) return api;
  if (!fs.existsSync(TOKEN)) throw new Error("Google Calendar not connected: run `npm run job -- google-login`");
  const client = oauthClient();
  client.setCredentials(JSON.parse(fs.readFileSync(TOKEN, "utf8")));
  client.on("tokens", (t) => {
    const old = JSON.parse(fs.readFileSync(TOKEN, "utf8"));
    fs.writeFileSync(TOKEN, JSON.stringify({ ...old, ...t }, null, 2), { mode: 0o600 });
  });
  api = calendar({ version: "v3", auth: client });
  return api;
}

export const calendarReady = (cfg: Config) => Boolean(cfg.calendar?.enabled) && fs.existsSync(TOKEN);

export async function busyBetween(cfg: Config, start: Date, end: Date): Promise<{ start: Date; end: Date }[]> {
  const id = cfg.calendar!.calendar_id;
  const r = await cal().freebusy.query({
    requestBody: { timeMin: start.toISOString(), timeMax: end.toISOString(), timeZone: cfg.timezone, items: [{ id }] },
  });
  return (r.data.calendars?.[id]?.busy ?? []).map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
}

export async function isFree(cfg: Config, start: Date, end: Date): Promise<boolean> {
  return (await busyBetween(cfg, start, end)).length === 0;
}

/** Wall-clock parts of a Date in the configured time zone. */
function local(d: Date, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { day: p.weekday as string, date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** True if the slot falls inside your interview availability (days and hours) with enough notice. */
export function withinAvailability(cfg: Config, start: Date, end: Date): boolean {
  const a = cfg.replies.availability;
  const [sh, sm] = a.start.split(":").map(Number);
  const [eh, em] = a.end.split(":").map(Number);
  const s = local(start, cfg.timezone);
  const e = local(end, cfg.timezone);
  return (
    start.getTime() - Date.now() >= a.min_notice_hours * 3600_000 &&
    (a.days as string[]).includes(s.day) &&
    s.date === e.date &&
    s.minutes >= sh * 60 + sm &&
    e.minutes <= eh * 60 + em
  );
}

/**
 * Up to `n` free one-hour slots in your availability over the next `days` days, one per day, alternating
 * between late morning and afternoon so the recruiter gets a real choice.
 */
export async function freeSlots(cfg: Config, n = 3, days = 6): Promise<Date[]> {
  const a = cfg.replies.availability;
  const from = new Date(Date.now() + a.min_notice_hours * 3600_000);
  const to = new Date(Date.now() + days * 86_400_000);
  const busy = calendarReady(cfg) ? await busyBetween(cfg, from, to) : [];
  const preferences = [[11 * 60, 15 * 60], [15 * 60, 11 * 60]]; // minutes after midnight, local time
  const byDay = new Map<string, Date[]>();
  for (let t = Math.ceil(from.getTime() / 1800_000) * 1800_000; t < to.getTime(); t += 1800_000) {
    const s = new Date(t);
    const e = new Date(t + 3600_000);
    if (!withinAvailability(cfg, s, e) || busy.some((b) => b.start < e && b.end > s)) continue;
    const day = local(s, cfg.timezone).date;
    byDay.set(day, [...(byDay.get(day) ?? []), s]);
  }
  const out: Date[] = [];
  for (const [i, candidates] of [...byDay.values()].entries()) {
    if (out.length >= n) break;
    const prefs = preferences[i % 2];
    const pick =
      prefs.map((m) => candidates.find((c) => local(c, cfg.timezone).minutes === m)).find(Boolean) ?? candidates[0];
    out.push(pick);
  }
  return out;
}

export function formatSlot(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: tz, weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(d);
}

/** Adds the interview to your calendar once (deduplicated by the email it came from). Returns the event link. */
export async function addInterview(
  cfg: Config,
  iv: Interview,
  info: { company: string; role: string; sourceMessageId: string; notes: string },
): Promise<{ id: string; link: string; existed: boolean }> {
  const c = cfg.calendar!;
  const key = info.sourceMessageId.replace(/[^A-Za-z0-9]/g, "").slice(0, 60);
  const existing = await cal().events.list({ calendarId: c.calendar_id, privateExtendedProperty: [`jobAgentKey=${key}`], maxResults: 1 });
  const found = existing.data.items?.[0];
  if (found) return { id: found.id!, link: found.htmlLink ?? "", existed: true };

  const start = new Date(iv.start);
  const end = iv.end ? new Date(iv.end) : new Date(start.getTime() + 3600_000);
  const isLink = /^https?:\/\//.test(iv.where);
  const r = await cal().events.insert({
    calendarId: c.calendar_id,
    requestBody: {
      summary: `Interview: ${info.role} — ${info.company}`,
      location: isLink ? undefined : iv.where || undefined,
      description: [isLink ? `Join: ${iv.where}` : "", iv.with ? `With: ${iv.with}` : "", `Mode: ${iv.mode.replace("_", " ")}`, "", info.notes].filter(Boolean).join("\n"),
      start: { dateTime: start.toISOString(), timeZone: cfg.timezone },
      end: { dateTime: end.toISOString(), timeZone: cfg.timezone },
      reminders: { useDefault: false, overrides: c.reminders_minutes.map((m) => ({ method: "popup", minutes: m })) },
      extendedProperties: { private: { jobAgentKey: key } },
    },
  });
  return { id: r.data.id!, link: r.data.htmlLink ?? "", existed: false };
}

/** Adds an all-day-style reminder for a test or assignment deadline. */
export async function addDeadline(cfg: Config, title: string, deadline: Date, notes: string, sourceMessageId: string) {
  const c = cfg.calendar!;
  const key = `dl${sourceMessageId.replace(/[^A-Za-z0-9]/g, "").slice(0, 58)}`;
  const existing = await cal().events.list({ calendarId: c.calendar_id, privateExtendedProperty: [`jobAgentKey=${key}`], maxResults: 1 });
  if (existing.data.items?.length) return;
  await cal().events.insert({
    calendarId: c.calendar_id,
    requestBody: {
      summary: `Deadline: ${title}`,
      description: notes,
      start: { dateTime: new Date(deadline.getTime() - 1800_000).toISOString(), timeZone: cfg.timezone },
      end: { dateTime: deadline.toISOString(), timeZone: cfg.timezone },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 1440 }, { method: "popup", minutes: 180 }] },
      extendedProperties: { private: { jobAgentKey: key } },
    },
  });
}
