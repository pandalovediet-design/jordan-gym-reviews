import type { Instrumentation } from "next";

const lastSent = new Map<string, number>();

/** Server errors go to the owner's alert channel (Telegram), at most once per error every 10 minutes. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const e = err as Error & { digest?: string };
  // Redirects and not-found are control flow, not failures.
  if (typeof e.digest === "string" && /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR)/.test(e.digest)) return;
  const key = `${context.routePath}|${e.message}`.slice(0, 200);
  const now = Date.now();
  if (now - (lastSent.get(key) ?? 0) < 10 * 60_000) return;
  lastSent.set(key, now);
  if (lastSent.size > 200) lastSent.clear();
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { notifyAdmin } = await import("@/lib/notify");
  await notifyAdmin(`⚠️ خطأ بالموقع\nالصفحة: ${request.path}\n${String(e.message).slice(0, 300)}`);
};
