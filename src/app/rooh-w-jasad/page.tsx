import type { Metadata } from "next";
import Link from "next/link";
import { Amiri_Quran } from "next/font/google";
import { getRestContent } from "@/lib/quran";
import { RuhTabs } from "@/components/RuhTabs";

const quran = Amiri_Quran({ subsets: ["arabic"], weight: "400", display: "swap" });

// Rendered per request: a failed Quran API call must never be frozen into a cached page (fetches themselves are cached 24h).
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "روح وجسد — مؤقت راحة قرآني ومسبحة للرياضيين",
  description: "استغل وقت الراحة بين الجولات بآية وتفسير ميسّر، وعدّ أذكارك مع العدّات بمسبحة إلكترونية مريحة لليد.",
  alternates: { canonical: "/rooh-w-jasad" },
};

export default async function RuhWJasad() {
  const content = await getRestContent();
  return (
    <div className="mx-auto max-w-2xl px-4 pb-12">
      <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-surface px-6 py-9 ring-1 ring-white/10 md:px-10">
        <span aria-hidden className="pointer-events-none absolute -top-24 start-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
        <p className="relative text-sm font-bold text-accent">🕌 للرياضي المسلم</p>
        <h1 className="relative mt-2 text-4xl font-black leading-tight md:text-5xl">روح <span className="text-accent">وجسد</span></h1>
        <p className="relative mt-3 text-lg text-muted">راحتك بين الجولات فرصة. آية وتفسير، وذكر بإيدك، وأنت بتبني جسمك.</p>
      </section>

      <RuhTabs content={content} quranClass={quran.className} />

      <section className="mt-10 space-y-2 rounded-2xl bg-surface p-4 text-xs leading-relaxed text-muted ring-1 ring-white/10">
        <p>نص الآيات بالرسم العثماني من <b>Tanzil.net</b> (Quran Academy)، والتفسير الميسر من مجمع الملك فهد، عبر واجهة <b>AlQuran.cloud</b>.</p>
        <p>التفسير مكتوب بشكل منفصل عن الآية، وهو ليس من القرآن. لو لاحظت أي خطأ أو ملاحظة، تواصل معنا.</p>
      </section>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/no-gym" className="rounded-full bg-surface px-4 py-1.5 ring-1 ring-white/10 hover:ring-accent">🏠 من غير جيم</Link>
        <Link href="/no-deprivation" className="rounded-full bg-surface px-4 py-1.5 ring-1 ring-white/10 hover:ring-accent">🥗 من غير حرمان</Link>
      </div>
    </div>
  );
}
