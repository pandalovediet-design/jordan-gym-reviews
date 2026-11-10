import type { Metadata } from "next";
import Link from "next/link";
import { ChallengesPanel } from "@/components/ChallengesPanel";

export const metadata: Metadata = {
  title: "التحديات الرياضية",
  description: "تحديات أسبوعية بسيطة تساعدك على بناء عادة رياضية والاستمرار.",
  alternates: { canonical: "/challenges" },
};

export default function ChallengesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/account" className="text-sm font-bold text-accent">← حسابي</Link>
      <header className="mb-7 mt-4 rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_15%_10%,rgba(200,245,58,.16),transparent_45%),linear-gradient(135deg,#20291b,#11160f)] p-6 sm:p-8">
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">خطوة صغيرة، فرق كبير 🏆</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">اختار تحديات بسيطة، تابع تقدمك، وخلّي الاستمرارية جزءاً من يومك.</p>
      </header>
      <ChallengesPanel />
    </main>
  );
}
