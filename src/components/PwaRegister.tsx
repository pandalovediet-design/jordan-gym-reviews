"use client";

import { useEffect } from "react";

/**
 * Registers the service worker and stashes the browser's install prompt for the header's
 * "ثبّت التطبيق" button (InstallButton). No floating banner: it popped up late and vanished,
 * which looked like a glitch, and duplicated the header button.
 */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const stash = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __pwaEvt?: Event }).__pwaEvt = e;
      window.dispatchEvent(new Event("pwa-ready"));
    };
    window.addEventListener("beforeinstallprompt", stash);
    return () => window.removeEventListener("beforeinstallprompt", stash);
  }, []);
  return null;
}
