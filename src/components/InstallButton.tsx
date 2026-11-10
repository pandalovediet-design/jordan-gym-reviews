"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const getEvt = () => (window as unknown as { __pwaEvt?: InstallEvent }).__pwaEvt ?? null;

/** Install action with browser-native prompt and clear manual instructions as a fallback. */
export function InstallButton({ className = "" }: { className?: string }) {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [tip, setTip] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const syncState = () => {
      setStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          (navigator as unknown as { standalone?: boolean }).standalone === true,
      );
      setReady(!!getEvt());
    };
    const onReady = () => setReady(true);
    const onInstalled = () => {
      setStandalone(true);
      setReady(false);
      setTip(false);
      setMessage("تم تثبيت التطبيق بنجاح.");
    };
    syncState();
    window.addEventListener("pwa-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) return null;
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const click = async () => {
    const e = getEvt();
    if (!e) {
      setTip((v) => !v);
      setMessage("");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await e.prompt();
      const choice = await e.userChoice;
      (window as unknown as { __pwaEvt?: unknown }).__pwaEvt = undefined;
      setReady(false);
      if (choice.outcome === "accepted") {
        setTip(false);
        setMessage("بدأ تثبيت التطبيق. اتبع تعليمات المتصفح لإكماله.");
      } else {
        setMessage("لم يتم التثبيت. يمكنك المحاولة لاحقًا أو اتباع التعليمات اليدوية.");
      }
    } catch {
      setTip(true);
      setMessage("تعذّر فتح نافذة التثبيت؛ استخدم تعليمات المتصفح أدناه.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className={className}>
      <button
        type="button"
        onClick={click}
        disabled={busy}
        aria-expanded={tip}
        aria-controls="install-app-help"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent/15 px-3 py-2 text-sm font-bold text-accent ring-1 ring-accent/40 sm:px-4 transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span aria-hidden="true">📲</span>
        <span className="sr-only sm:not-sr-only">{busy ? "جارٍ فتح التثبيت…" : ready ? "ثبّت التطبيق" : "ثبّت التطبيق"}</span>
      </button>
      {(tip || message) && (
        <span
          id="install-app-help"
          className="mt-2 block max-w-sm rounded-xl bg-surface p-3 text-sm leading-6 text-muted ring-1 ring-white/10"
        >
          {message && <span role="status" aria-live="polite" className="mb-1 block">{message}</span>}
          {tip && (ios
            ? "من زر المشاركة (⬆️) في سفاري اختر «إضافة إلى الشاشة الرئيسية»."
            : "من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».")}
        </span>
      )}
    </span>
  );
}
