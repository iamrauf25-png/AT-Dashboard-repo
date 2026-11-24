import fs from "node:fs";
import path from "node:path";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import { DATA_DIR, type Config } from "./config.js";
import type { EmailForClaude } from "./claude.js";
import { htmlToText } from "./sources/index.js";
import type { InboxEvent } from "./types.js";

/**
 * Gmail access over IMAP/SMTP with an app password (Google Account → Security → 2-Step Verification →
 * App passwords). Mail is only read; the one thing sent is the daily digest, to your own address.
 */

type GmailCfg = NonNullable<Config["gmail"]>;

interface GmailState {
  lastCheck?: string;
  seen: string[]; // Message-IDs already processed
  unmatched: InboxEvent[]; // job-related mail not tied to a tracked application (e.g. recruiter outreach)
}

const STATE_FILE = path.join(DATA_DIR, "gmail-state.json");

export function loadGmailState(): GmailState {
  return fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : { seen: [], unmatched: [] };
}

export function saveGmailState(s: GmailState) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  s.seen = s.seen.slice(-3000);
  s.unmatched = s.unmatched.slice(-50);
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

function password(): string {
  const p = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!p) throw new Error("GMAIL_APP_PASSWORD is not set (create an app password in your Google Account and put it in .env)");
  return p;
}

export interface FetchedMail extends EmailForClaude {
  messageId: string;
}

/** Words that suggest an email is about a job application; used to narrow the Gmail search before any Claude call. */
const JOB_WORDS = [
  "application", "applied", "interview", "candidature", "candidate", "shortlisted", "position", "opening",
  "opportunity", "hiring", "recruiter", "offer", "assessment", "assignment", "resume", "CV", "profile", "HR",
];

const quote = (s: string) => `"${s.replace(/"/g, "")}"`;

/**
 * Fetches new mail since the last check: job alerts from the configured senders, and other
 * job-related mail (matched by keyword or by the name of a company you have applied to).
 */
export async function fetchNewMail(
  g: GmailCfg,
  state: GmailState,
  activeCompanies: string[],
): Promise<{ alerts: FetchedMail[]; replies: FetchedMail[] }> {
  const since = state.lastCheck
    ? `after:${Math.floor(new Date(state.lastCheck).getTime() / 1000) - 3600}`
    : `newer_than:${g.lookback_days}d`;
  const senders = `from:(${g.alert_senders.join(" OR ")})`;
  const terms = [...JOB_WORDS, ...activeCompanies.slice(0, 40).map(quote)].join(" "); // inside { } Gmail treats terms as OR

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: g.address, pass: password() },
    logger: false,
  });
  await client.connect();
  const seen = new Set(state.seen);
  const alerts: FetchedMail[] = [];
  const replies: FetchedMail[] = [];
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Job boards send both alerts and application updates ("Your application was sent to…",
      // "…viewed your application") from the same addresses; route the updates to reply tracking.
      const updateWords = "subject:(application OR applied OR viewed OR interview OR shortlisted OR recruiter)";
      const search = async (q: string) => ((await client.search({ gmraw: q }, { uid: true })) || []) as number[];
      const hasSenders = g.alert_senders.length > 0;
      const alertUids = hasSenders ? await search(`${since} ${senders} -${updateWords}`) : [];
      const replyUids = g.track_replies
        ? [
            ...new Set([
              ...(await search(`${since} ${hasSenders ? `-${senders} ` : ""}-from:me {${terms}}`)),
              ...(hasSenders ? await search(`${since} ${senders} ${updateWords}`) : []),
            ]),
          ]
        : [];
      const budget = g.max_emails_per_run;
      // Newest first, within the per-run cap.
      const pick = (uids: number[], n: number) => uids.sort((a, b) => b - a).slice(0, n);
      const alertPick = pick(alertUids, Math.ceil(budget / 2));
      const replyPick = pick(replyUids, budget - alertPick.length);

      for (const [uids, into] of [[alertPick, alerts], [replyPick, replies]] as const) {
        if (!uids.length) continue;
        for (const msg of await client.fetchAll(uids, { source: true, uid: true }, { uid: true })) {
          if (!msg.source) continue;
          const mail = await simpleParser(msg.source);
          const messageId = mail.messageId ?? `uid-${msg.uid}`;
          if (seen.has(messageId)) continue;
          seen.add(messageId);
          into.push({
            messageId,
            from: mail.from?.text ?? "",
            subject: mail.subject ?? "",
            date: (mail.date ?? new Date()).toISOString(),
            // Alert emails are mostly HTML; keep link targets so job URLs survive the conversion.
            text: mail.text?.trim() || htmlToText(String(mail.html || "").replace(/<a [^>]*href="([^"]+)"[^>]*>/gi, " $1 ")),
          });
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  state.seen = [...seen];
  return { alerts, replies };
}

export async function sendDigest(
  g: GmailCfg,
  msg: { subject: string; html: string; text: string; attachments: { filename: string; path: string }[] },
) {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: g.address, pass: password() },
  });
  await transport.sendMail({ from: g.address, to: g.address, ...msg });
}
