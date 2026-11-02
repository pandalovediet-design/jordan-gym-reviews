import type { Metadata } from "next";
import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { searchOrgs } from "@/lib/queries";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Pink Zone — أماكن رياضية خاصة بالنساء في الأردن",
  description: "نوادي نسائية بالكامل، أوقات نسائية، مدربات، وأخصائيات تغذية وعلاج رياضي في الأردن. أسعار ودوام وموقع وتواصل مباشر.",
  alternates: { canonical: "/pink" },
};

const empty = { total: 0, items: [] };

export default async function PinkZone() {
  const [only, hours, coaches, health] = await Promise.all([
    searchOrgs({ women: "only", page: 1 }).catch(() => empty),
    searchOrgs({ women: "any", type: "gym", page: 1 }).catch(() => empty),
    searchOrgs({ women: "any", type: "independent_coach", page: 1 }).catch(() => empty),
    searchOrgs({ women: "any", type: "nutritionist", page: 1 }).catch(() => empty),
  ]);
  const onlyIds = new Set(only.items.map((o) => o.id));
  const hoursOnly = hours.items.filter((o) => !onlyIds.has(o.id));
  const grid = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
  const block = (title: string, hint: string, items: typeof only.items, href: string) => items.length === 0 ? null : (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="text-xl font-bold text-pink-200">{title}</h2><p className="text-sm text-muted">{hint}</p></div>
        <Link href={href} className="text-sm text-pink-200 underline">عرض الكل</Link>
      </div>
      <div className={grid}>{items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
    </section>
  );
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="rounded-3xl bg-gradient-to-br from-pink-500/30 via-pink-500/10 to-transparent p-8 text-center ring-1 ring-pink-400/40">
        <p className="text-5xl">💗</p>
        <h1 className="mt-3 text-4xl font-extrabold text-pink-100">Pink Zone</h1>
        <p className="mx-auto mt-3 max-w-xl text-pink-100/80">مساحة رياضية خاصة بالنساء: نوادي نسائية، أوقات نسائية، مدربات، وأخصائيات. كل مكان بيعلن عن نفسه، والإدارة بتراجع وبتشيل الشارة عند أي مخالفة.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/search?women=only" className="rounded-full bg-pink-500 px-5 py-2 font-bold text-white">كل الأماكن النسائية</Link>
          <Link href="/search?women=any" className="rounded-full bg-pink-500/20 px-5 py-2 font-bold text-pink-100 ring-1 ring-pink-400/50">تشمل الأوقات النسائية</Link>
        </div>
      </header>
      {block("💗 نسائي بالكامل", "أماكن كلها للنساء فقط", only.items, "/search?women=only")}
      {block("🕒 أوقات نسائية", "نوادي فيها ساعات مخصصة للنساء", hoursOnly, "/search?women=any&type=gym")}
      {block("🏋️‍♀️ مدربات ومدربون للنساء", "مدربون مستقلون بتدريب نسائي", coaches.items, "/search?women=any&type=independent_coach")}
      {block("🥗 أخصائيات تغذية", "متابعة تغذية للنساء", health.items, "/search?women=any&type=nutritionist")}
      {only.items.length + hoursOnly.length + coaches.items.length + health.items.length === 0 && (
        <p className="mt-10 text-center text-muted">لسا ما في أماكن مضافة. هل مكانك نسائي؟ <Link href="/join" className="text-pink-200 underline">اطلبي إضافته مجاناً</Link>.</p>
      )}
      <section className="mt-12 rounded-2xl bg-surface p-6 ring-1 ring-pink-400/30">
        <h2 className="text-lg font-bold">عندك نادي أو بتدرّبي نساء؟</h2>
        <p className="mt-1 text-sm text-muted">فعّلي «خاص بالنساء» أو «أوقات نسائية» من لوحة التحكم وبتظهري هون مباشرة.</p>
        <Link href="/join" className="mt-3 inline-block rounded-xl bg-pink-500 px-5 py-2 font-bold text-white">اطلبي إضافة مكانك</Link>
      </section>
    </div>
  );
}
