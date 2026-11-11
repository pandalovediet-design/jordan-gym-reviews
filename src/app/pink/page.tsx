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
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-muted">{hint}</p></div>
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-pink-600 underline-offset-4 hover:underline">عرض الكل</Link>
      </div>
      <div className={grid}>{items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
    </section>
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* The one page where pink replaces ink as the loud block. */}
      <header className="rounded-3xl bg-pink-600 p-6 text-white sm:p-10">
        <h1 className="text-5xl font-extrabold sm:text-7xl">Pink Zone</h1>
        <p className="mt-4 max-w-2xl leading-8 text-white/90">نوادي نسائية بالكامل، أوقات نسائية، مدربات وأخصائيات. كل مكان بيعلن عن نفسه، والإدارة بتشيل الشارة عند أي مخالفة.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/search?women=only" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-pink-700">نسائي بالكامل</Link>
          <Link href="/search?women=any" className="inline-flex min-h-12 items-center rounded-full px-6 font-semibold ring-1 ring-white/60 hover:bg-white/10">مع الأوقات النسائية</Link>
        </div>
      </header>
      {block("نسائي بالكامل", "أماكن كلها للنساء فقط", only.items, "/search?women=only")}
      {block("أوقات نسائية", "نوادي فيها ساعات مخصصة للنساء", hoursOnly, "/search?women=any&type=gym")}
      {block("مدربات ومدربون للنساء", "مدربون مستقلون بتدريب نسائي", coaches.items, "/search?women=any&type=independent_coach")}
      {block("أخصائيات تغذية", "متابعة تغذية للنساء", health.items, "/search?women=any&type=nutritionist")}
      {only.items.length + hoursOnly.length + coaches.items.length + health.items.length === 0 && (
        <p className="mt-10 text-center text-muted">لسا ما في أماكن مضافة.</p>
      )}
      <section className="mt-14 flex flex-col gap-4 rounded-2xl bg-surface p-6 ring-1 ring-pink-500/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">عندك نادي أو بتدرّبي نساء؟</h2>
          <p className="mt-1 text-sm text-muted">فعّلي «خاص بالنساء» أو «أوقات نسائية» من لوحة التحكم وبتظهري هون مباشرة.</p>
        </div>
        <Link href="/join" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-pink-600 px-6 font-semibold text-white">اطلبي إضافة مكانك</Link>
      </section>
    </div>
  );
}
