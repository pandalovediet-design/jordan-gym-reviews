"use client";
import { Fragment } from "react";
import Link from "next/link";
import { useKeepForm } from "@/components/Form";
import type { ReviewState } from "@/app/g/[slug]/review-actions";

const field = "w-full rounded-xl bg-background px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";
type A = (s: ReviewState, fd: FormData) => Promise<ReviewState>;
const Msg = ({ s }: { s: ReviewState }) => <>{s?.error && <p role="alert" className="text-sm text-red-300">{s.error}</p>}{s?.ok && <p className="text-sm text-accent">{s.ok}</p>}</>;

export function ReviewForm({ action, slug }: { action: A; slug: string }) {
  const { state: s, onSubmit, pending, ref } = useKeepForm(action);
  const next = encodeURIComponent(`/g/${slug}`);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
      <h3 className="font-bold">قيّم هالمكان</h3>
      <fieldset>
        <legend className="mb-1 text-xs text-muted">كم نجمة؟</legend>
        <div className="flex flex-row-reverse justify-end gap-1 text-3xl [&>input:checked~label]:text-accent [&>label:hover]:text-accent [&>label:hover~label]:text-accent">
          {[5, 4, 3, 2, 1].map((n) => (
            <Fragment key={n}>
              <input type="radio" name="rating" value={n} id={`rt-${n}`} className="sr-only" required />
              <label htmlFor={`rt-${n}`} aria-label={`${n} من 5`} className="cursor-pointer text-white/25">★</label>
            </Fragment>))}
        </div>
      </fieldset>
      <textarea name="body" rows={3} maxLength={1000} placeholder="شو رأيك؟ (اختياري) بدون روابط أو أرقام هاتف" className={field} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <Msg s={s} />
      <button disabled={pending} className="rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground disabled:opacity-60">{pending ? "لحظة..." : "إرسال التقييم"}</button>
      <p className="text-xs text-muted">لازم تكون مسجّل دخول بحساب مؤكَّد عمره 24 ساعة على الأقل، وتقييم واحد لكل مكان (لو قيّمت قبل، الجديد بيحل مكان القديم). أصحاب الأماكن ما بيقيّموا أماكنهم. <Link href={`/login?next=${next}`} className="underline">دخول</Link> · <Link href={`/login?mode=signup&next=${next}`} className="underline">حساب جديد</Link></p>
    </form>
  );
}

export function ReportReview({ action }: { action: A }) {
  const { state: s, onSubmit, pending, ref } = useKeepForm(action);
  return (
    <details className="text-xs text-muted">
      <summary className="cursor-pointer hover:text-foreground">🚩 بلّغ</summary>
      <form ref={ref} onSubmit={onSubmit} className="mt-2 flex flex-wrap items-center gap-2">
        <select name="reason" required defaultValue="" className="rounded-lg bg-background px-2 py-1.5 ring-1 ring-white/10">
          <option value="" disabled>السبب</option><option value="fake">تقييم مزيف</option><option value="spam">إعلان أو سبام</option><option value="abuse">إساءة</option><option value="other">آخر</option>
        </select>
        <button disabled={pending} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">{pending ? "..." : "إرسال"}</button>
        <Msg s={s} />
      </form>
    </details>
  );
}
