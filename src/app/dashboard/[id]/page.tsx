import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { BILLING_LABEL, WEEKDAYS, hhmm, jod } from "@/lib/format";
import { addService, deleteService, saveHours, submitForReview, updateProfile } from "../actions";

export const metadata: Metadata = { title: "تعديل النشاط", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const STATUS = { draft: "مسودة (غير ظاهرة للعامة)", pending: "بانتظار مراجعة الإدارة", published: "منشور", suspended: "موقوف" } as const;

export default async function EditOrg({ params }: PageProps<"/dashboard/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const [{ data: org }, { data: services }, { data: hours }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", id).maybeSingle(),
    supabase.from("organization_services").select("*").eq("organization_id", id).order("sort_order").order("created_at"),
    supabase.from("organization_hours").select("*").eq("organization_id", id),
  ]);
  if (!org) notFound();
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const lbl = "block space-y-1 text-sm text-muted";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href="/dashboard" className="text-sm text-muted underline">← أنشطتي</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{org.name_ar}</h1>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{STATUS[org.status]}</span>
      </div>

      {org.status === "draft" && (
        <form action={submitForReview.bind(null, id)} className={`${box} flex items-center justify-between gap-3`}>
          <p className="text-sm">لما تخلص البيانات، أرسله للمراجعة عشان يظهر للعامة.</p>
          <button className="rounded-xl bg-accent px-5 py-2 font-bold text-accent-foreground">إرسال للمراجعة</button>
        </form>
      )}
      {org.status === "published" && <Link href={`/g/${org.slug}`} className="text-accent underline">عرض الصفحة العامة</Link>}

      <section className={box}><h2 className="mb-3 text-lg font-bold">البيانات الأساسية</h2>
        <ActionForm action={updateProfile.bind(null, id)}>
          <label className={lbl}>الاسم<input name="name_ar" required defaultValue={org.name_ar} className={field} /></label>
          <label className={lbl}>الاسم بالإنجليزي<input name="name_en" defaultValue={org.name_en ?? ""} dir="ltr" className={field} /></label>
          <label className={lbl}>الوصف<textarea name="description_ar" rows={4} defaultValue={org.description_ar ?? ""} className={field} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>المدينة<input name="city" required defaultValue={org.city} className={field} /></label>
            <label className={lbl}>المنطقة<input name="area" defaultValue={org.area ?? ""} className={field} /></label>
          </div>
          <label className={lbl}>العنوان<input name="address" defaultValue={org.address ?? ""} className={field} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>الهاتف<input name="phone" defaultValue={org.phone ?? ""} dir="ltr" placeholder="0791234567" className={field} /></label>
            <label className={lbl}>واتساب<input name="whatsapp" defaultValue={org.whatsapp ?? ""} dir="ltr" placeholder="0791234567" className={field} /></label>
            <label className={lbl}>انستغرام (بدون @)<input name="instagram" defaultValue={org.instagram ?? ""} dir="ltr" className={field} /></label>
            <label className={lbl}>الموقع الإلكتروني<input name="website" defaultValue={org.website ?? ""} dir="ltr" placeholder="https://" className={field} /></label>
            <label className={lbl}>خط العرض<input name="latitude" type="number" step="any" defaultValue={org.latitude ?? ""} dir="ltr" className={field} /></label>
            <label className={lbl}>خط الطول<input name="longitude" type="number" step="any" defaultValue={org.longitude ?? ""} dir="ltr" className={field} /></label>
          </div>
        </ActionForm>
      </section>

      <section className={box}><h2 className="mb-3 text-lg font-bold">الأسعار والخدمات</h2>
        <ul className="mb-4 space-y-2">{(services ?? []).map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
            <span>{s.name_ar} — <span className="text-accent">{jod(s.price_jod)}</span> {s.billing_period && BILLING_LABEL[s.billing_period]}</span>
            <form action={deleteService.bind(null, id, s.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
          {(services ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت خدمات بعد.</li>}</ul>
        <ActionForm action={addService.bind(null, id)} submit="إضافة" className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-start">
          <input name="name_ar" required placeholder="مثال: اشتراك شهري" className={field} />
          <input name="price_jod" type="number" step="0.01" min="0" placeholder="السعر (د.أ)" className={field} />
          <select name="billing_period" className={field}><option value="">—</option>{Object.entries(BILLING_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </ActionForm>
      </section>

      <section className={box}><h2 className="mb-3 text-lg font-bold">ساعات الدوام</h2>
        <ActionForm action={saveHours.bind(null, id)}>
          {WEEKDAYS.map((name, d) => {
            const h = hours?.find((x) => x.weekday === d);
            return (<div key={d} className="grid grid-cols-[5rem_1fr_1fr_auto] items-center gap-2 text-sm">
              <span>{name}</span>
              <input name={`open_${d}`} type="time" defaultValue={hhmm(h?.opens_at ?? null)} className={field} dir="ltr" />
              <input name={`close_${d}`} type="time" defaultValue={hhmm(h?.closes_at ?? null)} className={field} dir="ltr" />
              <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name={`closed_${d}`} defaultChecked={!!h?.is_closed} />مغلق</label></div>);
          })}
        </ActionForm>
      </section>
    </div>
  );
}
