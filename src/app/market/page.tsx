import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { ReportListing } from "@/components/ReportListing";
import { EQUIP_COND as COND, jod, publicMediaUrl, waNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "سوق المعدات الرياضية — بيع وتبديل بين الأندية",
  description: "أندية ومتاجر بتبيع أو بتبدّل أجهزة ومعدات رياضية مستعملة وجديدة بالأردن.",
  alternates: { canonical: "/market" },
};

export default async function Market({ searchParams }: PageProps<"/market">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const kind = one(sp.kind) === "sale" || one(sp.kind) === "swap" ? one(sp.kind)! : "";
  const q = (one(sp.q) ?? "").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().slice(0, 40);
  let query = createPublicClient()
    .from("equipment_listings")
    .select("id,title_ar,description_ar,condition,kind,price_jod,swap_for,image_path,created_at,organizations(slug,name_ar,city,whatsapp,phone)")
    .eq("status", "active").gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(60);
  if (kind) query = query.eq("kind", kind);
  if (q) query = query.ilike("title_ar", `%${q}%`);
  const { data } = await query;
  const list = data ?? [];
  const tab = (k: string, l: string) => (
    <Link href={k ? `/market?kind=${k}` : "/market"} className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 ${kind === k ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>{l}</Link>
  );
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">🔄 سوق المعدات</h1>
      <p className="mt-2 text-muted">أندية ومتاجر بتبيع أو بتبدّل أجهزة. التواصل والاتفاق على السعر والتسليم مباشرة بين الطرفين، والمنصة بس بتعرض الإعلان. راجع الجهاز قبل ما تدفع.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tab("", "الكل")}{tab("sale", "للبيع")}{tab("swap", "للتبديل")}
        <form action="/market" className="ms-auto flex gap-2">
          {kind && <input type="hidden" name="kind" value={kind} />}
          <input name="q" defaultValue={q} placeholder="دوّر (مثال: تردميل)" className="rounded-xl bg-surface px-3 py-1.5 text-sm ring-1 ring-white/10 outline-none focus:ring-accent" />
        </form>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((l) => {
          const o = l.organizations;
          const wa = waNumber(o?.whatsapp ?? o?.phone ?? null);
          return (
            <li key={l.id} className="flex flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10">
              {l.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicMediaUrl(l.image_path)} alt={l.title_ar} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              ) : <div className="flex aspect-[4/3] items-center justify-center bg-white/5 text-4xl">🏋️</div>}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold">{l.title_ar}</h2>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs">{COND[l.condition]}</span>
                </div>
                <p className="text-accent">{l.kind === "sale" ? jod(l.price_jod) : `🔁 تبديل${l.swap_for ? ` بـ ${l.swap_for}` : ""}`}</p>
                {l.description_ar && <p className="text-sm text-muted">{l.description_ar}</p>}
                {o && <p className="text-xs text-muted"><Link href={`/g/${o.slug}`} className="text-accent hover:underline">{o.name_ar}</Link> · {o.city}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`مرحبا، شفت إعلانك «${l.title_ar}» بسوق المعدات على Jordan Gym Reviews`)}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">واتساب</a>}
                  <ReportListing id={l.id} />
                </div>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="col-span-full rounded-2xl bg-surface p-6 text-center text-muted ring-1 ring-white/10">ما في إعلانات حالياً. عندك نادي أو متجر؟ ضيف جهازك من لوحة التحكم.</li>}
      </ul>
    </div>
  );
}
