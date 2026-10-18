"use client";
export function PrintButton() {
  return <button onClick={() => window.print()} className="rounded-xl bg-accent px-5 py-2.5 font-bold text-accent-foreground">طباعة الستكر</button>;
}
