"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaRegister() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try { dismissed = localStorage.getItem("pwa-dismissed") === "1"; } catch {}
    if (standalone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); setHidden(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (isIos) queueMicrotask(() => { setIos(true); setHidden(false); });
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || (!evt && !ios)) return null;
  const close = () => {
    setHidden(true);
    try { localStorage.setItem("pwa-dismissed", "1"); } catch {}
  };
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-surface p-4 text-sm shadow-xl ring-1 ring-white/15">
      <div className="flex-1">
        <p className="font-bold">ثبّت التطبيق على جهازك</p>
        <p className="text-xs text-muted">
          {ios ? "من زر المشاركة اختر «إضافة إلى الشاشة الرئيسية»." : "وصول أسرع بدون فتح المتصفح."}
        </p>
      </div>
      {evt && (
        <button
          onClick={async () => { await evt.prompt(); await evt.userChoice; setHidden(true); }}
          className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"
        >تثبيت</button>
      )}
      <button onClick={close} aria-label="إغلاق" className="text-muted hover:text-foreground">✕</button>
    </div>
  );
}
