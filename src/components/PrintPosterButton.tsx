"use client";

export function PrintPosterButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-xl border border-white/15 px-5 py-2.5 font-bold hover:bg-white/5">طباعة الملصق</button>;
}
