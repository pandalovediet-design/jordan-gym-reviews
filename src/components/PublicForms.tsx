"use client";
import { useActionState } from "react";
import type { PublicState } from "@/app/g/[slug]/actions";

const field = "w-full rounded-xl bg-background px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";
type A = (s: PublicState, fd: FormData) => Promise<PublicState>;

function Msg({ s }: { s: PublicState }) {
  return <>{s?.error && <p role="alert" className="text-sm text-red-300">{s.error}</p>}{s?.ok && <p className="text-sm text-accent">{s.ok}</p>}</>;
}

export function InquiryForm({ action }: { action: A }) {
  const [s, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
      <h3 className="font-bold">أرسل استفسار</h3>
      <input name="sender_name" required placeholder="اسمك" className={field} />
      <input name="sender_phone" required placeholder="رقم هاتفك" dir="ltr" inputMode="tel" className={field} />
      <textarea name="message" required rows={3} maxLength={1000} placeholder="رسالتك" className={field} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <Msg s={s} />
      <button disabled={pending} className="rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground disabled:opacity-60">{pending ? "لحظة..." : "إرسال"}</button>
    </form>
  );
}

export function ReportForm({ action }: { action: A }) {
  const [s, run, pending] = useActionState(action, undefined);
  return (
    <details className="mt-6 text-sm text-muted">
      <summary className="cursor-pointer hover:text-foreground">🚩 بلّغ عن مشكلة بهالصفحة</summary>
      <form action={run} className="mt-3 space-y-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <select name="reason" required defaultValue="" className={field}>
          <option value="" disabled>سبب البلاغ</option>
          <option value="wrong_info">معلومات خاطئة (سعر، دوام، رقم)</option>
          <option value="closed">النشاط مغلق</option>
          <option value="fake">نشاط وهمي أو احتيال</option>
          <option value="inappropriate">محتوى غير لائق</option>
          <option value="other">سبب آخر</option>
        </select>
        <textarea name="details" rows={2} maxLength={500} placeholder="تفاصيل (اختياري)" className={field} />
        <input name="contact" maxLength={100} placeholder="رقمك أو بريدك لو بدنا نتواصل معك (اختياري)" dir="ltr" className={field} />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <Msg s={s} />
        <button disabled={pending} className="rounded-xl bg-white/10 px-5 py-2 font-bold text-foreground disabled:opacity-60">{pending ? "لحظة..." : "إرسال البلاغ"}</button>
      </form>
    </details>
  );
}
