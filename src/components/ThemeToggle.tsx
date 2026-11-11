"use client";

import { useEffect } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  useEffect(() => {
    // Light is the default; dark only when the visitor picked it.
    let saved: string | null = null;
    try { saved = window.localStorage.getItem("gymjo-theme"); } catch {}
    const initial: Theme = saved === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = initial;
    document.documentElement.style.colorScheme = initial;
  }, []);

  function toggleTheme() {
    const current: Theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { window.localStorage.setItem("gymjo-theme", next); } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="تبديل الوضع الفاتح والداكن"
      title="تبديل الوضع الفاتح والداكن"
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground ring-1 ring-line transition-colors hover:bg-foreground/5"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8">
        {/* Half-filled disc: reads as "switch light/dark" in both modes. */}
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}
