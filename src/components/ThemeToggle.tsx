"use client";

import { useEffect } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  useEffect(() => {
    const saved = window.localStorage.getItem("gymjo-theme");
    const initial: Theme = saved === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = initial;
    document.documentElement.style.colorScheme = initial;
  }, []);

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next: Theme = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    window.localStorage.setItem("gymjo-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="تبديل الوضع الفاتح والداكن"
      title="تبديل الوضع الفاتح والداكن"
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-foreground transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
    </button>
  );
}
