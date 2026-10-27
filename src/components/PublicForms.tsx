"use client";
import { useKeepForm } from "@/components/Form";
import type { PublicState } from "@/app/g/[slug]/actions";

const field = "min-h-11 w-full rounded-xl bg-background px-3 py-2.5 text-foreground ring-1 ring-white/10 outline-none transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";
const label = "mb-1.5 block text-sm font-medium text-foreground";
type A = (s: PublicState, fd: FormData) => Promise<PublicState>;

function Msg({ s }: { s: PublicState }) {
  return (
    <div className="space-y-1" aria-live="polite" aria-atomic="true">
      {s?.error && <p role="alert" className="text-sm text-red-300">{s.error}</p>}
      {s?.ok && <p role="status" className="text-sm text-accent">{s.ok}</p>}
    </div>
  );
}

export function InquiryForm({ action }: { action: A }) {
  const { state: s, onSubmit, pending, ref } = useKeepForm(action);
  return (
    <form ref={ref} onSubmit={onSubmit} aria-busy={pending} className="space-y-4 rounded-2xl bg-surface p-4 sm:p-5 ring-1 ring-white/10">
      <div>
        <h3 className="font-bold">أرسل استفسار</h3>
        <p className="mt-1 text-sm text-muted">املأ بياناتك وسيتاح للنشاط الرد عليك.</p>
      </div>
      <div>
        <label htmlFor="inquiry-sender-name" className={label}>الاسم</label>
        <input id="inquiry-sender-name" name="sender_name" required autoComplete="name" maxLength={120} placeholder="مثال: أحمد محمد" className={field} />
      </div>
      <div>
        <label htmlFor="inquiry-sender-phone" className={label}>رقم الهاتف</label>
        <input id="inquiry-sender-phone" name="sender_phone" required type="tel" autoComplete="tel" placeholder="07XXXXXXXX" dir="ltr" inputMode="tel" className={field} />
      </div>
      <div>
        <label htmlFor="inquiry-message" className={label}>كيف يمكننا مساعدتك؟</label>
        <textarea id="inquiry-message" name="message" required rows={4} maxLength={1000} placeholder="اكتب استفسارك هنا..." className={field} />
        <p className="mt-1 text-xs text-muted">حتى 1000 حرف.</p>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <Msg s={s} />
      {pending && <p role="status" aria-live="polite" className="text-sm text-muted">جارٍ إرسال الاستفسار، يرجى الانتظار…</p>}
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60 sm:w-auto motion-reduce:transition-none">
        {pending ? "جارٍ الإرسال..." : "إرسال الاستفسار"}
      </button>
    </form>
  );
}

export function ReportForm({ action }: { action: A }) {
  const { state: s, onSubmit, pending, ref } = useKeepForm(action);
  return (
    <details className="mt-6 text-sm text-muted">
      <summary className="min-h-11 cursor-pointer rounded-xl py-3 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none">🚩 بلّغ عن مشكلة بهذه الصفحة</summary>
      <form ref={ref} onSubmit={onSubmit} aria-busy={pending} className="mt-3 space-y-4 rounded-2xl bg-surface p-4 sm:p-5 ring-1 ring-white/10">
        <div>
          <label htmlFor="report-reason" className={label}>سبب البلاغ</label>
          <select id="report-reason" name="reason" required defaultValue="" className={field}>
            <option value="" disabled>اختر سبب البلاغ</option>
            <option value="wrong_info">معلومات خاطئة (السعر أو الدوام أو الرقم)</option>
            <option value="closed">النشاط مغلق</option>
            <option value="fake">نشاط وهمي أو احتيال</option>
            <option value="inappropriate">محتوى غير لائق</option>
            <option value="other">سبب آخر</option>
          </select>
        </div>
        <div>
          <label htmlFor="report-details" className={label}>تفاصيل إضافية <span className="font-normal text-muted">(اختياري)</span></label>
          <textarea id="report-details" name="details" rows={3} maxLength={500} placeholder="ساعدنا على فهم المشكلة..." className={field} />
        </div>
        <div>
          <label htmlFor="report-contact" className={label}>وسيلة تواصل <span className="font-normal text-muted">(اختياري)</span></label>
          <input id="report-contact" name="contact" maxLength={100} autoComplete="off" placeholder="رقم هاتف أو بريد إلكتروني" dir="auto" className={field} />
        </div>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <Msg s={s} />
        {pending && <p role="status" aria-live="polite" className="text-sm text-muted">جارٍ إرسال البلاغ، يرجى الانتظار…</p>}
        <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-white/10 px-5 py-2 font-bold text-foreground transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">
          {pending ? "جارٍ إرسال البلاغ..." : "إرسال البلاغ"}
        </button>
      </form>
    </details>
  );
}
