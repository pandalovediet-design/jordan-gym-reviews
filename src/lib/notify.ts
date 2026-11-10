import "server-only";

/**
 * Sends a short alert to the platform owner. Works with either channel (or both):
 *  - Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *  - Email via Resend: RESEND_API_KEY + ADMIN_NOTIFY_EMAIL
 * Does nothing when no channel is configured, and never throws (an alert must not break signup).
 */
export async function notifyAdmin(text: string): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  const { TELEGRAM_BOT_TOKEN: tg, TELEGRAM_CHAT_ID: chat, RESEND_API_KEY: resend, ADMIN_NOTIFY_EMAIL: to } = process.env;
  const signal = () => AbortSignal.timeout(4000);
  if (tg && chat) {
    tasks.push(fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" }, signal: signal(),
      body: JSON.stringify({ chat_id: chat, text }),
    }));
  }
  if (resend && to) {
    tasks.push(fetch("https://api.resend.com/emails", {
      method: "POST", signal: signal(),
      headers: { "content-type": "application/json", authorization: `Bearer ${resend}` },
      body: JSON.stringify({ from: "GYMJO <onboarding@resend.dev>", to: [to], subject: text.split("\n")[0], text }),
    }));
  }
  await Promise.allSettled(tasks);
}
