import type { Metadata } from "next";
import { WorkoutLog } from "@/components/WorkoutLog";

export const metadata: Metadata = {
  title: "سجل تمريني",
  description: "سجّل تمرينك اليومي وتابع سلسلة التزامك وهدف الأسبوع. محفوظ على جهازك فقط وبدون حساب.",
  alternates: { canonical: "/log" },
};

export default function LogPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">🔥 سجل تمريني</h1>
      <p className="mb-6 text-sm text-muted">سجّل كل يوم تتمرن فيه وشوف سلسلة التزامك. مجاني وبدون حساب.</p>
      <WorkoutLog />
    </div>
  );
}
