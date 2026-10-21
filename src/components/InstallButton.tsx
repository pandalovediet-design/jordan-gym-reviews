"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const getEvt = () => (window as unknown as { __pwaEvt?: InstallEvent }).__pwaEvt ?? null;

/** Always-available "install the app" button. Uses the browser prompt when it exists, otherwise shows how to do it by hand. */
export function InstallButton({ className = "" }: { className?: string }) {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
      setReady(!!getEvt());
    });
    const on = () => setReady(true);
    window.addEventListener("pwa-ready", on);
    return () => window.removeEventListener("pwa-ready", on);
  }, []);

  if (standalone) return null;
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const click = async () => {
    const e = getEvt();
    if (e) {
      await e.prompt();
      await e.userChoice;
      (window as unknown as { __pwaEvt?: unknown }).__pwaEvt = undefined;
      setReady(false);
    } else setTip((v) => !v);
  };
  return (
    <span className={className}>
      <button type="button" onClick={click} className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent ring-1 ring-accent/40 hover:bg-accent/25">📲 ثبّت التطبيق</button>
      {tip && !ready && (
        <span role="status" className="mt-2 block rounded-xl bg-surface p-3 text-xs text-muted ring-1 ring-white/10">
          {ios ? "من زر المشاركة (⬆️) في سفاري اختر «إضافة إلى الشاشة الرئيسية»." : "من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."}
        </span>
      )}
    </span>
  );
}
