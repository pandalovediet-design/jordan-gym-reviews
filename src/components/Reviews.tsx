import { createPublicClient } from "@/lib/supabase/public";
import { dateAr } from "@/lib/format";
import { ReportReview, ReviewForm } from "@/components/ReviewForms";
import { reportReview, saveReview } from "@/app/g/[slug]/review-actions";

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
const ar = (n: number) => n.toLocaleString("ar-EG");
/** Only the first name is shown publicly. */
const firstName = (n: string) => n.trim().split(/\s+/)[0] || "مستخدم";

export async function Reviews({ orgId, slug }: { orgId: string; slug: string }) {
  const db = createPublicClient();
  const [rating, list] = await Promise.all([
    db.from("organization_ratings").select("review_count,average_rating").eq("organization_id", orgId).maybeSingle(),
    db.from("reviews").select("id,rating,body,author_name,created_at").eq("organization_id", orgId).eq("status", "published").order("created_at", { ascending: false }).limit(20),
  ]);
  const reviews = list.data ?? [];
  const ids = reviews.map((r) => r.id);
  const { data: replies } = ids.length ? await db.from("review_responses").select("review_id,body").in("review_id", ids) : { data: [] };
  const replyOf = (id: string) => (replies ?? []).find((x) => x.review_id === id)?.body;
  const count = rating.data?.review_count ?? 0, avg = Number(rating.data?.average_rating ?? 0);

  return (
    <section className="mt-8" aria-labelledby="reviews-h">
      <h2 id="reviews-h" className="mb-3 text-xl font-bold">التقييمات</h2>
      {count > 0 ? (
        <p className="mb-4 flex flex-wrap items-baseline gap-2"><span className="text-3xl font-extrabold text-accent">{ar(Number(avg.toFixed(1)))}</span>
          <span className="text-accent" aria-hidden>{stars(Math.round(avg))}</span><span className="text-sm text-muted">من {ar(count)} {count === 1 ? "تقييم" : "تقييمات"}</span></p>
      ) : <p className="mb-4 text-sm text-muted">ما في تقييمات لسا. كون أول واحد يقيّم.</p>}
      <p className="mb-3 text-xs text-muted">التقييمات من مستخدمين مسجّلين على المنصة، وما بنتحقق إنهم زاروا المكان. إذا لاحظت تقييم مزيف بلّغ عنه.</p>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl bg-surface p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span><span className="text-accent" role="img" aria-label={`${r.rating} من 5`}>{stars(r.rating)}</span> <b className="mr-1">{firstName(r.author_name)}</b></span>
              <span className="text-xs text-muted">{dateAr(r.created_at)}</span>
            </div>
            {r.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{r.body}</p>}
            {replyOf(r.id) && <p className="mt-3 rounded-xl bg-background p-3 text-sm"><b className="text-accent">رد صاحب المكان: </b>{replyOf(r.id)}</p>}
            <div className="mt-2"><ReportReview action={reportReview.bind(null, r.id, slug)} /></div>
          </li>))}
      </ul>
      <div className="mt-4"><ReviewForm action={saveReview.bind(null, orgId, slug)} slug={slug} /></div>
    </section>
  );
}
