import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dateAr } from "@/lib/format";
import { ActionForm, field } from "@/components/Form";
import { ReportReview } from "@/components/ReviewForms";
import { reportReview } from "@/app/g/[slug]/review-actions";
import { respondReview } from "../../actions";

export const metadata: Metadata = { title: "التقييمات", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default async function ReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,slug,name_ar").eq("id", id).maybeSingle();
  if (!org) notFound();
  const [{ data: reviews }, { data: replies }] = await Promise.all([
    supabase.from("reviews").select("id,rating,body,author_name,created_at,status").eq("organization_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("review_responses").select("review_id,body").eq("organization_id", id),
  ]);
  const replyOf = (rid: string) => (replies ?? []).find((r) => r.review_id === rid)?.body ?? "";
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Link href={`/dashboard/${id}/overview`} className="text-sm text-muted underline">← نظرة عامة</Link>
      <h1 className="text-2xl font-extrabold">⭐ تقييمات {org.name_ar}</h1>
      <p className="text-xs text-muted">ردك بيظهر علناً تحت التقييم. ما بتقدر تحذف تقييم؛ إذا شفت تقييم مزيف أو مسيء بلّغ عنه وبنراجعه.</p>
      {(reviews ?? []).length === 0 && <p className={`${box} text-sm text-muted`}>ما في تقييمات لسا.</p>}
      {(reviews ?? []).map((r) => (
        <div key={r.id} className={`${box} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span><span className="text-accent">{stars(r.rating)}</span> <b className="mr-1">{r.author_name.trim().split(/\s+/)[0] || "مستخدم"}</b>{r.status === "hidden" && <span className="mr-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">مخفي</span>}</span>
            <span className="text-xs text-muted">{dateAr(r.created_at)}</span>
          </div>
          {r.body && <p className="whitespace-pre-line text-sm">{r.body}</p>}
          <ActionForm action={respondReview.bind(null, id, r.id)} submit={replyOf(r.id) ? "تحديث الرد" : "نشر الرد"} className="space-y-2">
            <textarea name="body" rows={2} maxLength={1500} defaultValue={replyOf(r.id)} placeholder="اكتب ردك (بأدب، الرد علني)" className={field} />
          </ActionForm>
          <ReportReview action={reportReview.bind(null, r.id, org.slug)} />
        </div>))}
    </div>
  );
}
