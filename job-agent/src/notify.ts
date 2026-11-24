import type { Config } from "./config.js";

/**
 * WhatsApp messages to yourself.
 *
 * - callmebot (free, personal use): send the activation message described at
 *   https://www.callmebot.com/blog/free-api-whatsapp-messages/ from your phone, then put the
 *   API key you receive in .env as CALLMEBOT_API_KEY.
 * - twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886).
 *
 * Failures are reported but never stop the run.
 */
export async function whatsapp(cfg: Config, text: string): Promise<boolean> {
  const w = cfg.whatsapp;
  if (!w?.enabled) return false;
  const body = text.length > 1500 ? `${text.slice(0, 1490)}…` : text;
  try {
    if (w.provider === "twilio") {
      const sid = need("TWILIO_ACCOUNT_SID");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${need("TWILIO_AUTH_TOKEN")}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: need("TWILIO_WHATSAPP_FROM"), To: `whatsapp:${w.phone}`, Body: body }),
      });
      if (!res.ok) throw new Error(`Twilio ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } else {
      const q = new URLSearchParams({ phone: w.phone, text: body, apikey: need("CALLMEBOT_API_KEY") });
      const res = await fetch(`https://api.callmebot.com/whatsapp.php?${q}`);
      const reply = await res.text();
      if (!res.ok || /error|invalid|not/i.test(reply.slice(0, 300)) && !/queued|sent/i.test(reply)) {
        throw new Error(`CallMeBot ${res.status}: ${reply.replace(/<[^>]+>/g, " ").trim().slice(0, 200)}`);
      }
    }
    return true;
  } catch (e) {
    console.warn(`  WhatsApp not sent: ${(e as Error).message}`);
    return false;
  }
}

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set in .env`);
  return v;
}
