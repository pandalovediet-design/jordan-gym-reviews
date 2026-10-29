"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("gymjo-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", enabled);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", enabled ? "#17212b" : "#f7f9f6");
    setDark(enabled);
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next ? "#17212b" : "#f7f9f6");
    window.localStorage.setItem("gymjo-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ready ? (dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن") : "تغيير المظهر"}
      aria-pressed={dark}
      title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full border px-3 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${dark ? "border-[#405366] bg-[#212d3b] text-[#f1f5f9] hover:border-[#4fbd78] hover:bg-[#294638]" : "border-[#dce9dd] bg-white text-foreground hover:border-accent hover:bg-background"}`}
    >
      <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
      <span className="hidden text-xs font-bold sm:inline">{dark ? "فاتح" : "داكن"}</span>
    </button>
  );
}
