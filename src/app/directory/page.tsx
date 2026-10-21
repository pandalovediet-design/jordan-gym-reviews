import type { Metadata } from "next";
import Link from "next/link";
import { listCities } from "@/lib/queries";
import { ORG_TYPE_PLURAL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "دليل الرياضة في الأردن: نوادي ومدربون ومتاجر",
  description: "تصفّح كل الأنشطة الرياضية في الأردن حسب النوع والمدينة: نوادي، مدربون، ملاعب، متاجر، أخصائيو تغذية.",
  alternates: { canonical: "/directory" },
};

export default async function DirectoryIndex() {
  const types = Object.keys(ORG_TYPE_PLURAL) as Enums<"org_type">[];
  const rows = await Promise.all(types.map(async (t) => ({ t, cities: await listCities(t).catch(() => []) })));
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">دليل الرياضة في الأردن</h1>
      <p className="mt-2 text-muted">اختار النوع والمدينة.</p>
      <div className="mt-6 space-y-6">{rows.map(({ t, cities }) => (
        <section key={t} className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
          <h2 className="text-lg font-bold"><Link href={`/directory/${t}`} className="hover:text-accent">{ORG_TYPE_PLURAL[t]}</Link></h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {cities.length === 0 && <span className="text-muted">قريباً</span>}
            {cities.map((c) => <Link key={c.city} href={`/directory/${t}/${encodeURIComponent(c.city)}`} className="rounded-full bg-background/50 px-3 py-1 ring-1 ring-white/10 hover:ring-accent">{c.city} ({c.n})</Link>)}
          </div>
        </section>))}</div>
      <p className="mt-6 text-sm"><Link href="/pink" className="text-pink-200 underline">💗 Pink Zone</Link></p>
    </div>
  );
}
