import type { Metadata } from "next";
import Link from "next/link";
import { listHomeWorkouts } from "@/lib/home-workouts";
import { JsonLd } from "@/lib/jsonld";
import { baseUrl } from "@/lib/base-url";
import { SAFETY_NOTE } from "@/lib/exercise-meta";
import { HomeExplorer } from "@/components/HomeExplorer";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "من غير جيم — تمارين منزلية بالعربي بحبال المقاومة وأدوات البيت",
  description: "تمارين منزلية بالفيديو والخطوات: بدون أدوات، بحبال مقاومة، بدمبل منزلي أو كرسي. اختار أداتك وعضلتك وابدأ من بيتك.",
  alternates: { canonical: "/no-gym" },
};

export default async function NoGym() {
  const items = await listHomeWorkouts();
  const steps = [["🎬", "شوف الفيديو"], ["🪢", "جهّز أداتك"], ["💪", "كرّر وارتاح"]];
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "من غير جيم — تمارين منزلية", inLanguage: "ar", itemListElement: items.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.title, url: `${baseUrl()}/no-gym/${e.slug}` })) }} />
      <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-surface px-6 py-10 ring-1 ring-white/10 md:px-12 md:py-14">
        <span aria-hidden className="pointer-events-none absolute -top-24 start-1/2 size-80 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 end-0 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <p className="relative text-sm font-bold text-accent">🏠 تمارين المنزل</p>
        <h1 className="relative mt-2 text-4xl font-black leading-tight md:text-6xl">من غير <span className="text-accent">جيم</span></h1>
        <p className="relative mt-3 max-w-xl text-lg text-muted">جسمك ما بيستنى اشتراك. تمارين بالفيديو من بيتك، بحبال مقاومة وأدوات بسيطة، بشرح بالأردني.</p>
        <ol className="relative mt-6 flex flex-wrap gap-2 text-sm">
          {steps.map(([i, t], k) => <li key={t} className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 ring-1 ring-white/10"><span>{i}</span>{k + 1}. {t}</li>)}
        </ol>
      </section>

      {items.length > 0 ? <HomeExplorer items={items} /> : (
        <p className="mt-10 rounded-2xl bg-surface p-8 text-center text-muted ring-1 ring-white/10">التمارين جاية قريباً، ارجع بعد شوي 💪</p>
      )}

      <section className="mt-12 grid gap-3 md:grid-cols-2">
        <Link href="/directory" className="rounded-2xl bg-accent p-5 text-accent-foreground transition hover:brightness-110">
          <p className="text-lg font-extrabold">جاهز تنقل لمستوى ثاني؟</p>
          <p className="text-sm opacity-80">شوف النوادي والكباتن القريبين منك وقارن الأسعار ←</p>
        </Link>
        <Link href="/exercises" className="rounded-2xl bg-surface p-5 ring-1 ring-white/10 transition hover:ring-accent">
          <p className="text-lg font-extrabold">دليل التمارين بالعضلة</p>
          <p className="text-sm text-muted">اختار العضلة على الجسم وشوف شرح من كباتن أردنيين ←</p>
        </Link>
      </section>
      <p className="mt-8 text-xs text-muted">⚠️ {SAFETY_NOTE}</p>
    </div>
  );
}
