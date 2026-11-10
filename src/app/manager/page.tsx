import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL, dateAr } from "@/lib/format";
import { managerSetStatus } from "./actions";

export const metadata: Metadata = { title: "إدارة السوق", robots: { index: false } };

const STATUS = { draft: "مسودة", pending: "بانتظار المراجعة", published: "منشور", suspended: "موقوف" } as const;
const TONE = { draft: "bg-white/10 text-muted", pending: "bg-yellow-400/15 text-yellow-200", published: "bg-accent/15 text-accent", suspended: "bg-red-400/15 text-red-200" } as const;
const FILTERS = [["pending", "بانتظار المراجعة"], ["draft", "مسودات"], ["published", "منشور"], ["suspended", "موقوف"]] as const;

export default async function Manager({ searchParams }: { searchParams: Promise<{ status?: string; c?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data: mine } = await supabase.from("country_managers").select("country_code");
  const codes = (mine ?? []).map((m) => m.country_code);
  if (codes.length === 0) notFound();
  const { data: countries } = await supabase.from("countries").select("code,name_ar,market_name,is_active").in("code", codes);
  const market = codes.includes(sp.c ?? "") ? sp.c! : codes[0];
  const status = FILTERS.some(([k]) => k === sp.status) ? (sp.status as keyof typeof STATUS) : "pending";

  const [{ data: orgs }, { data: all }] = await Promise.all([
    supabase.from("organizations").select("id,name_ar,slug,type,status,city,area,phone,created_at").eq("country_code", market).eq("status", status).order("created_at", { ascending: false }).limit(200),
    supabase.from("organizations").select("status").eq("country_code", market).limit(10000),
  ]);
  const countOf = (s: string) => (all ?? []).filter((o) => o.status === s).length;
  const current = (countries ?? []).find((c) => c.code === market);
  const href = (s: string, c = market) => `/manager?c=${c}&status=${s}`;
  const btn = "inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-surface">
        <div className="p-5 sm:p-7">
          <p className="text-xs font-bold tracking-widest text-accent" dir="ltr">{current?.market_name}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">إدارة سوق {current?.name_ar}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">راجع المنشآت الجديدة واعتمدها أو أوقفها. صلاحيتك محصورة بهذا السوق.</p>
          {!current?.is_active && <p className="mt-3 rounded-xl bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">السوق لسا مطفي: المنشآت المنشورة ما بتظهر للزوار إلا بعد التفعيل.</p>}
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
          {FILTERS.map(([k, label]) => (
            <Link key={k} href={href(k)} aria-current={k === status ? "page" : undefined} className={`border-white/10 p-4 transition-colors hover:bg-white/5 sm:border-s sm:first:border-s-0 ${k === status ? "bg-accent/10" : ""}`}>
              <p className="text-xs text-muted">{label}</p>
              <p className={`mt-1 text-2xl font-extrabold tabular-nums ${k === status ? "text-accent" : ""}`}>{countOf(k)}</p>
            </Link>
          ))}
        </div>
      </header>

      {codes.length > 1 && (
        <nav aria-label="الأسواق" className="mb-5 flex flex-wrap gap-2">
          {(countries ?? []).map((c) => (
            <Link key={c.code} href={href(status, c.code)} className={`${btn} ring-1 ring-white/10 ${c.code === market ? "bg-accent text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{c.name_ar}</Link>
          ))}
        </nav>
      )}

      {(orgs ?? []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-surface/60 px-6 py-12 text-center">
          <p className="text-lg font-extrabold">ما في منشآت {STATUS[status]} حالياً</p>
          <p className="mt-2 text-sm text-muted">لما صاحب منشأة يبعت صفحته للمراجعة، بتلاقيها هون.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {(orgs ?? []).map((o) => (
            <li key={o.id} className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">{o.name_ar}</h2>
                  <p className="mt-1 text-sm text-muted">{ORG_TYPE_LABEL[o.type]} · {[o.city, o.area].filter(Boolean).join("، ")} · {dateAr(o.created_at)}</p>
                  {o.phone && <p className="mt-1 text-sm text-muted" dir="ltr">{o.phone}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE[o.status]}`}>{STATUS[o.status]}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.status !== "published" && <form action={managerSetStatus.bind(null, o.id, "published")}><button className={`${btn} bg-accent text-accent-foreground hover:brightness-110`}>اعتماد ونشر</button></form>}
                {o.status === "pending" && <form action={managerSetStatus.bind(null, o.id, "draft")}><button className={`${btn} ring-1 ring-white/15 hover:bg-white/5`}>إرجاع لصاحبها</button></form>}
                {o.status !== "suspended" && <form action={managerSetStatus.bind(null, o.id, "suspended")}><button className={`${btn} text-red-200 ring-1 ring-red-300/30 hover:bg-red-400/10`}>إيقاف</button></form>}
                {o.status === "published" && <Link href={`/g/${o.slug}`} className={`${btn} ring-1 ring-white/15 hover:bg-white/5`}>شوف الصفحة</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
