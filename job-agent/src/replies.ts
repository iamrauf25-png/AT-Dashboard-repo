import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { planReply, type EmailClass } from "./claude.js";
import { trackByName, type Config } from "./config.js";
import { matchTracks } from "./filter.js";
import { isNoReply, sendOrDraft, type FetchedMail } from "./gmail.js";
import * as google from "./google.js";
import { whatsapp } from "./notify.js";
import type { Store } from "./store.js";
import type { InboxEvent, Interview, Job, RawJob } from "./types.js";

/** Everything with side effects, injectable so the logic can be tested without Gmail, Calendar or WhatsApp. */
export interface Deps {
  send: typeof sendOrDraft;
  notify: (cfg: Config, text: string) => Promise<boolean>;
  calendarReady: (cfg: Config) => boolean;
  conflicts: (cfg: Config, start: Date, end: Date) => Promise<{ start: Date; end: Date }[]>;
  freeSlots: typeof google.freeSlots;
  addInterview: typeof google.addInterview;
  addDeadline: typeof google.addDeadline;
}

export const realDeps: Deps = {
  send: sendOrDraft,
  notify: whatsapp,
  calendarReady: google.calendarReady,
  conflicts: google.busyBetween,
  freeSlots: google.freeSlots,
  addInterview: google.addInterview,
  addDeadline: google.addDeadline,
};

const validDate = (s: string) => (s && !Number.isNaN(new Date(s).getTime()) ? new Date(s) : null);

/**
 * Acts on one classified email: adds interviews and deadlines to Google Calendar, replies (or drafts
 * a reply) in the same thread, and WhatsApps you whatever needs your attention.
 */
export async function actOnEmail(
  mail: FetchedMail,
  cls: EmailClass,
  job: Job | undefined,
  event: InboxEvent,
  store: Store,
  cfg: Config,
  budget: { replies: number },
  deps: Deps = realDeps,
): Promise<void> {
  const tz = cfg.timezone;
  const company = job?.company || cls.company || "the company";
  const role = job?.title || cls.role || "the role";
  const label = `${role} — ${company}`;
  const done: string[] = [];
  const alerts: string[] = [];
  let schedulingNote = "";
  let forceDraft = false;

  // ---- Interviews ----
  if (cls.kind === "interview_invite") {
    const start = validDate(cls.interview_start);
    if (start) {
      const end = validDate(cls.interview_end) ?? new Date(start.getTime() + 3600_000);
      const iv: Interview = { start: start.toISOString(), end: end.toISOString(), mode: cls.interview_mode, where: cls.interview_where, with: cls.interview_with };
      event.interview = iv;
      const when = google.formatSlot(start, tz);
      if (!deps.calendarReady(cfg)) {
        forceDraft = true;
        schedulingNote = `The proposed time is ${when}. The candidate's calendar could not be checked: confirm the time politely only if no availability problem is mentioned; this reply is a draft for the candidate to check.`;
        alerts.push(`📅 Interview proposed: ${label}\n${when}${iv.where ? `\n📍 ${iv.where}` : ""}\nCalendar not connected — I drafted a confirmation in Gmail for you to check.`);
      } else {
        const busy = await deps.conflicts(cfg, start, end);
        const inHours = google.withinAvailability(cfg, start, end);
        if (!busy.length && inHours) {
          const ev = await deps.addInterview(cfg, iv, { company, role, sourceMessageId: mail.messageId, notes: `${cls.summary}\n${cls.action}` });
          iv.calendarEventId = ev.id;
          done.push("calendar");
          schedulingNote = `The proposed time ${when} is free and has been added to the candidate's calendar. Confirm attendance at that time${iv.where ? ` (${iv.where})` : ""}.`;
          alerts.push(`📅 Interview scheduled: ${label}\n🕒 ${when}${iv.where ? `\n📍 ${iv.where}` : ""}${iv.with ? `\n👤 ${iv.with}` : ""}\n✅ Added to Google Calendar${ev.link ? `: ${ev.link}` : ""}`);
        } else {
          forceDraft = true;
          const slots = await deps.freeSlots(cfg);
          const why = busy.length ? "clashes with something in your calendar" : "is outside your interview hours";
          schedulingNote = slots.length
            ? `The proposed time ${when} is NOT possible. Apologise briefly and offer these alternatives instead: ${slots.map((s) => google.formatSlot(s, tz)).join("; ")}.`
            : `The proposed time ${when} is NOT possible. Apologise briefly and ask for another time.`;
          alerts.push(`⚠️ Interview time ${why}: ${label}\nProposed: ${when}\nI drafted a reply in Gmail suggesting other times — please check and send it.`);
        }
      }
    } else {
      const slots = await deps.freeSlots(cfg);
      schedulingNote = slots.length
        ? `No time has been fixed. Offer these interview slots: ${slots.map((s) => google.formatSlot(s, tz)).join("; ")}.`
        : "No time has been fixed. Say the candidate is flexible on weekdays and ask them to propose a time.";
      alerts.push(`📨 Interview invite: ${label}\n${cls.summary}${slots.length ? `\nI offered: ${slots.map((s) => google.formatSlot(s, tz)).join(" / ")}` : ""}`);
    }
  }

  // ---- Tests / assignments ----
  if (cls.kind === "assessment") {
    const dl = validDate(cls.deadline);
    if (dl && deps.calendarReady(cfg)) {
      await deps.addDeadline(cfg, label, dl, `${cls.summary}\n${cls.action}`, mail.messageId);
      done.push("calendar");
    }
    alerts.push(`📝 Test/assignment: ${label}\n${cls.action || cls.summary}${dl ? `\n⏰ Due ${google.formatSlot(dl, tz)}` : ""}`);
  }

  if (cls.kind === "offer") alerts.push(`🎉 Offer: ${label}\n${cls.summary}\nI have not replied — this one is yours.`);

  // ---- Recruiter outreach: also add the role as a job lead so it gets scored ----
  if (cls.kind === "recruiter_outreach" && cls.role) {
    const lead: RawJob = {
      source: "recruiter",
      sourceId: createHash("sha1").update(mail.messageId).digest("hex").slice(0, 10),
      company: cls.company || "Unknown (recruiter)",
      title: cls.role,
      location: "",
      remote: false,
      url: "",
      description: `${cls.summary}\n\nFrom ${mail.from}:\n${mail.text.slice(0, 4000)}`,
      snippetOnly: true,
      postedAt: mail.date,
    };
    store.addRaw([lead]);
    alerts.push(`👋 Recruiter outreach: ${cls.role}${cls.company ? ` at ${cls.company}` : ""}\n${cls.summary}`);
  }

  // ---- Reply ----
  const wantsReply = cls.needs_reply || cls.kind === "interview_invite" || cls.kind === "recruiter_outreach";
  const noReplyKinds = ["offer", "rejection", "application_received", "not_job_related"];
  if (wantsReply && !noReplyKinds.includes(cls.kind) && cfg.replies.mode !== "off" && cfg.gmail) {
    if (isNoReply(mail.replyTo)) {
      alerts.push(`↩️ ${label}: this needs a response but came from a no-reply address. ${cls.action}`);
    } else if (budget.replies <= 0) {
      alerts.push(`↩️ ${label}: reply limit for this run reached — please answer: ${cls.summary}`);
    } else {
      const trackName = job?.score?.best_track ?? job?.tracks?.[0] ?? matchTracks(role, cfg)[0];
      const track = trackByName(cfg, trackName);
      const plan = await planReply(
        mail,
        cls,
        { track, jobLine: job ? `${job.title} at ${job.company} (status: ${job.status})` : `${role} at ${company} (not applied yet)`, schedulingNote },
        cfg,
      );
      const mode = forceDraft || !plan.can_send || cfg.replies.mode === "draft" ? "draft" : "auto";
      const attachments: { filename: string; path: string }[] = [];
      if (plan.attach_cv) {
        const saved = job?.materialsDir && fs.existsSync(path.join(job.materialsDir, "materials.json"))
          ? (JSON.parse(fs.readFileSync(path.join(job.materialsDir, "materials.json"), "utf8")) as { pdf: string })
          : null;
        const tailored = saved ? path.join(job!.materialsDir!, saved.pdf) : "";
        if (tailored && fs.existsSync(tailored)) attachments.push({ filename: saved!.pdf, path: tailored });
        else if (track.cv_path.toLowerCase().endsWith(".pdf")) attachments.push({ filename: `CV_${track.name.replace(/\W+/g, "_")}.pdf`, path: path.resolve(track.cv_path) });
      }
      const subject = /^re:/i.test(mail.subject) ? mail.subject : `Re: ${mail.subject}`;
      const r = await deps.send(cfg.gmail, mode, {
        to: mail.replyTo,
        subject,
        text: plan.body,
        attachments,
        inReplyTo: mail.messageId,
        references: mail.references,
      });
      budget.replies--;
      done.push(r.sent ? "replied" : "drafted reply");
      if (!r.sent && !plan.can_send) alerts.push(`✋ ${label}: I need you before replying — ${plan.hold_reason}\nA draft is waiting in Gmail.`);
      else if (!r.sent && !forceDraft) alerts.push(`✉️ Reply drafted for ${label} — waiting in Gmail Drafts.`);
      else if (r.sent && alerts.length) alerts[alerts.length - 1] += `\n✉️ Replied to ${mail.replyTo}.`;
    }
  }

  for (const a of alerts) if (await deps.notify(cfg, a)) done.push("whatsapp");
  event.handled = [...new Set(done)].join(", ") || undefined;
}
