import type { Metadata } from "next";
import { FoodLog } from "@/components/FoodLog";

export const metadata: Metadata = {
  title: "سجل أكلي",
  description: "سجّل وجباتك اليومية بضغطة: صحي، مقبول أو أكلة حرة. بدون عدّ سعرات. مع متابعة الماء وأيام الأكل الصحي.",
  alternates: { canonical: "/food" },
};

export default function FoodPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">🥗 سجل أكلي</h1>
      <p className="mb-6 text-sm text-muted">سجّل شو أكلت بضغطة، بدون ما تعدّ سعرات. الهدف تلاحظ عاداتك مش تحاسب حالك.</p>
      <FoodLog />
    </div>
  );
}
