import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateAr } from "@/lib/format";
import { deleteReview, setReviewReport, setReviewStatus } from "../actions";

export const metadata: Metadata = { title: "التقييمات", robots: { index: false } };
const REASON = { spam: "سبام", abuse: "إساءة", fake: "مزيف", other: "آخر" } as const;
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default async function AdminReviews() {
  const { supabase } = await requireUser();
  const [{ data: reports }, { data: recent }] = await Promise.all([
    supabase.from("review_reports").select("id,review_id,reason,details,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(50),
    supabase.from("reviews").select("id,organization_id,rating,body,author_name,status,created_at,organizations(name_ar,slug)").order("created_at", { ascending: false }).limit(40),
  ]);
  const reported = new Set((reports ?? []).map((r) => r.review_id));
  const byId = new Map((recent ?? []).map((r) => [r.id, r]));
  const box = "rounded-2xl bg-surface p-4 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">التقييمات</h1>
      <section className="space-y-2">
        <h2 className="font-bold">بلاغات مفتوحة ({(reports ?? []).length})</h2>
        {(reports ?? []).length === 0 && <p className={`${box} text-sm text-muted`}>ما في بلاغات.</p>}
        {(reports ?? []).map((rp) => {
          const rv = byId.get(rp.review_id);
          return (
            <div key={rp.id} className={`${box} space-y-2 text-sm`}>
              <p className="text-xs text-muted">{REASON[rp.reason as keyof typeof REASON] ?? rp.reason} · {dateAr(rp.created_at)}{rp.details ? ` · ${rp.details}` : ""}</p>
              {rv ? <p><span className="text-accent">{stars(rv.rating)}</span> {rv.body ?? "(بدون نص)"} <span className="text-xs text-muted">— {rv.author_name || "مستخدم"} على {rv.organizations?.name_ar}</span></p> : <p className="text-xs text-muted">التقييم مش بآخر 40 (افتحه من الأنشطة).</p>}
              <div className="flex flex-wrap gap-2">
                {rv && <form action={setReviewStatus.bind(null, rv.id, "hidden")}><button className={btn}>إخفاء التقييم</button></form>}
                <form action={setReviewReport.bind(null, rp.id, "resolved")}><button className={btn}>تم الحل</button></form>
                <form action={setReviewReport.bind(null, rp.id, "dismissed")}><button className={btn}>تجاهل البلاغ</button></form>
              </div>
            </div>);
        })}
      </section>
      <section className="space-y-2">
        <h2 className="font-bold">آخر التقييمات</h2>
        {(recent ?? []).map((r) => (
          <div key={r.id} className={`${box} space-y-2 text-sm`}>
            <p><span className="text-accent">{stars(r.rating)}</span> {r.body ?? "(بدون نص)"} {reported.has(r.id) && <span className="rounded-full bg-red-400/20 px-2 py-0.5 text-xs text-red-200">عليه بلاغ</span>} {r.status === "hidden" && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">مخفي</span>}</p>
            <p className="text-xs text-muted">{r.author_name || "مستخدم"} · {dateAr(r.created_at)} · {r.organizations ? <Link href={`/g/${r.organizations.slug}`} className="underline">{r.organizations.name_ar}</Link> : ""}</p>
            <div className="flex gap-2">
              {r.status === "published" ? <form action={setReviewStatus.bind(null, r.id, "hidden")}><button className={btn}>إخفاء</button></form> : <form action={setReviewStatus.bind(null, r.id, "published")}><button className={btn}>إظهار</button></form>}
              <form action={deleteReview.bind(null, r.id)}><button className={`${btn} text-red-200`}>حذف نهائي</button></form>
            </div>
          </div>))}
      </section>
    </div>
  );
}
