import type { Metadata } from "next";
import Link from "next/link";
import { ORG_TYPE_LABEL, cleanQuery } from "@/lib/format";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "سجّل ناديك أو استلم صفحتك مجاناً",
  description: "دوّر على ناديك على Jordan Gym Reviews: إذا موجود استلم صفحته مجاناً، وإذا مش موجود سجّله بدقيقة.",
};

/**
 * One link for everyone (Instagram, WhatsApp groups): the owner searches for their place.
 * Found and unclaimed → claim it. Not found → register a new one. That is how we tell new from existing.
 */
export default async function ClaimFinder({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "";
  const q = cleanQuery(raw);
  const { data } = q.length >= 2
    ? await createPublicClient().from("organizations")
        .select("id,name_ar,name_en,slug,type,city,area,is_claimed")
        .eq("status", "published")
        .or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,area.ilike.%${q}%`)
        .order("name_ar").limit(20)
    : { data: null };
  const results = data ?? [];
  const field = "w-full rounded-xl bg-background px-4 py-3 ring-1 ring-white/10 outline-none focus:ring-accent";
  const newHref = "/login?mode=signup&next=%2Fdashboard%2Fnew";
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-extrabold">ناديك على <span className="text-accent">Jordan Gym Reviews</span></h1>
        <p className="mt-2 text-muted">دوّر على اسم ناديك أو نشاطك. إذا لقيته استلم صفحته مجاناً، وإذا مش موجود سجّله جديد.</p>
      </div>

      <form className="flex gap-2" role="search">
        <input name="q" defaultValue={raw} required minLength={2} placeholder="اسم النادي أو المنطقة" aria-label="اسم النادي" className={field} />
        <button className="rounded-xl bg-accent px-6 font-bold text-accent-foreground">بحث</button>
      </form>

      {q.length >= 2 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-muted">{results.length ? `لقينا ${results.length}` : "ما لقينا شي بهالاسم"}</h2>
          <ul className="space-y-2">
            {results.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-white/10">
                <div className="min-w-0">
                  <p className="font-semibold">{o.name_ar}</p>
                  <p className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]} · {[o.city, o.area].filter(Boolean).join("، ")} · <Link href={`/g/${o.slug}`} className="underline">شوف الصفحة</Link></p>
                </div>
                {o.is_claimed === false
                  ? <Link href={`/claim/${o.slug}`} className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">هذا ناديي ← استلمه</Link>
                  : <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted">مستلَم من صاحبه</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="font-bold">{q.length >= 2 ? "ما لقيت ناديك؟" : "ناديك جديد أو مش موجود؟"}</h2>
        <p className="mt-1 text-sm text-muted">سجّله بدقيقة: أنشئ حساب، اكتب الاسم والمنطقة، وكمّل الأسعار والصور. مجاناً.</p>
        <Link href={newHref} className="mt-3 inline-block rounded-xl bg-background px-5 py-2.5 font-bold ring-1 ring-accent/60 hover:bg-accent hover:text-accent-foreground">➕ سجّل نشاط جديد</Link>
      </section>
    </div>
  );
}
