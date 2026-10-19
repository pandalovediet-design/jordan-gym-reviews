import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { AVAILABILITY_LABEL, BILLING_LABEL, publicMediaUrl, WEEKDAYS, hhmm, jod } from "@/lib/format";
import { missingForPublish } from "@/lib/completeness";
import { addOffer, addProduct, deleteMedia, deleteOffer, deleteProduct, setProductImage, uploadMedia, addService, deleteService, saveHours, submitForReview, updateProfile } from "../actions";

export const metadata: Metadata = { title: "تعديل النشاط", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const STATUS = { draft: "مسودة (غير ظاهرة للعامة)", pending: "بانتظار مراجعة الإدارة", published: "منشور", suspended: "موقوف" } as const;

export default async function EditOrg({ params }: PageProps<"/dashboard/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const [{ data: org }, { data: services }, { data: hours }, { data: media }, { data: offers }, { data: products }, { data: cats }, { data: orgCats }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", id).maybeSingle(),
    supabase.from("organization_services").select("*").eq("organization_id", id).order("sort_order").order("created_at"),
    supabase.from("organization_hours").select("*").eq("organization_id", id),
    supabase.from("organization_media").select("*").eq("organization_id", id).order("sort_order"),
    supabase.from("offers").select("*").eq("organization_id", id).order("ends_at", { ascending: false }),
    supabase.from("products").select("id,name_ar,price_jod,availability,moderation_status,image_path").eq("organization_id", id).order("created_at", { ascending: false }),
    supabase.from("product_categories").select("id,name_ar").order("sort_order"),
    supabase.from("org_categories").select("id,org_type,name_ar").eq("is_active", true).order("sort_order"),
  ]);
  if (!org) notFound();
  const missing = org.status === "draft" ? await missingForPublish(supabase, id) : [];
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const lbl = "block space-y-1 text-sm text-muted";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{org.name_ar}</h1>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{STATUS[org.status]}</span>
      </div>

      {org.status === "draft" && (
        <form action={submitForReview.bind(null, id)} className={`${box} flex items-center justify-between gap-3`}>
          <p className="text-sm">لما تخلص البيانات، أرسله للمراجعة عشان يظهر للعامة.</p>
          <button disabled={missing.length > 0} className="rounded-xl bg-accent px-5 py-2 font-bold text-accent-foreground disabled:opacity-40">إرسال للمراجعة</button>
        </form>
      )}
      {org.status === "draft" && missing.length > 0 && <p className="rounded-xl bg-yellow-400/10 p-3 text-sm text-yellow-200">ناقص قبل الإرسال: {missing.join("، ")}.</p>}
      {org.status === "published" && <Link href={`/g/${org.slug}`} className="text-accent underline">عرض الصفحة العامة</Link>}

      <section className={box}><h2 className="mb-3 text-lg font-bold">البيانات الأساسية</h2>
        <ActionForm action={updateProfile.bind(null, id)}>
          <label className={lbl}>الاسم<input name="name_ar" required defaultValue={org.name_ar} className={field} /></label>
          <label className={lbl}>الاسم بالإنجليزي<input name="name_en" defaultValue={org.name_en ?? ""} dir="ltr" className={field} /></label>
          <label className={lbl}>الوصف<textarea name="description_ar" rows={4} defaultValue={org.description_ar ?? ""} className={field} /></label>
          <label className={lbl}>التصنيف
            <select name="category_id" defaultValue={org.category_id ?? ""} className={field}>
              <option value="">بدون تصنيف</option>
              {(orgCats ?? []).filter((c) => c.org_type === org.type).map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </label>
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
          </div>
          <label className={lbl}>رابط الموقع على قوقل ماب (اختياري)
            <input name="maps_url" defaultValue={org.maps_url ?? ""} dir="ltr" placeholder="https://maps.app.goo.gl/..." className={field} />
            <span className="block text-xs">افتح قوقل ماب، دوّر على مكانك، اضغط «مشاركة» ثم «نسخ الرابط» والصقه هون.</span>
          </label>
          <div className="space-y-2 rounded-xl border border-pink-400/30 bg-pink-500/5 p-3">
            <label className={lbl}>💗 Pink Zone (للنساء)
              <select name="women_access" defaultValue={org.women_access} className={field}>
                <option value="none">عادي (للجميع)</option>
                <option value="women_only">خاص بالنساء بالكامل — Pink Zone</option>
                <option value="women_hours">فيه أوقات أو قسم نسائي</option>
              </select>
            </label>
            <label className={lbl}>أوقات القسم النسائي (إذا اخترت «أوقات نسائية»)
              <input name="women_hours_note" defaultValue={org.women_hours_note ?? ""} maxLength={200} placeholder="مثال: الأحد والثلاثاء من 4 إلى 8 مساءً" className={field} />
            </label>
            <p className="text-xs text-muted">اختار «خاص بالنساء بالكامل» فقط إذا النشاط كله للنساء. الإدارة بتراجع وبتقدر تشيل الشارة عند أي إساءة.</p>
          </div>
          {org.type === "nutritionist" && (
            <div className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-2">
              <label className={lbl}>رقم الترخيص<input name="license_number" defaultValue={org.license_number ?? ""} dir="ltr" className={field} /></label>
              <label className={lbl}>الجهة المرخِّصة<input name="license_authority" defaultValue={org.license_authority ?? ""} className={field} /></label>
              <p className="text-xs text-muted sm:col-span-2">بنراجع الترخيص قبل ما نعطي علامة «موثّق». كتابة الترخيص لحاله ما بتعني توثيق.</p>
            </div>
          )}
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
      <section className={box}><h2 className="mb-3 text-lg font-bold">الصور</h2>
        <div className="mb-4 grid grid-cols-3 gap-3">{(media ?? []).map((m) => (
          <div key={m.id} className="space-y-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicMediaUrl(m.storage_path)} alt={m.alt_text ?? ""} className="aspect-[4/3] w-full rounded-lg object-cover" />
            <form action={deleteMedia.bind(null, id, m.id)}><button className="text-xs text-red-300 underline">حذف</button></form></div>))}
          {(media ?? []).length === 0 && <p className="col-span-3 text-sm text-muted">ما رفعت صور بعد.</p>}</div>
        <ActionForm action={uploadMedia.bind(null, id)} submit="رفع">
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
          <input name="alt_text" placeholder="وصف الصورة (اختياري)" className={field} />
          <p className="text-xs text-muted">JPG / PNG / WebP، حتى 4MB، وحد أقصى 12 صورة.</p>
        </ActionForm>
      </section>

      {org.type === "store" && (
        <section className={box}><h2 className="mb-3 text-lg font-bold">المنتجات</h2>
          <ul className="mb-4 space-y-3">{(products ?? []).map((p) => (
            <li key={p.id} className="flex items-start gap-3 text-sm">
              {p.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicMediaUrl(p.image_path)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
              ) : <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-background/40 text-xs text-muted">بلا صورة</div>}
              <div className="flex-1 space-y-1">
                <p>{p.name_ar} — <span className="text-accent">{jod(p.price_jod)}</span> · {AVAILABILITY_LABEL[p.availability]}{p.moderation_status !== "approved" && <span className="text-muted"> · {p.moderation_status === "pending" ? "بانتظار الموافقة" : "مرفوض"}</span>}</p>
                <ActionForm action={setProductImage.bind(null, id, p.id)} submit={p.image_path ? "تغيير الصورة" : "رفع صورة"} className="flex flex-wrap items-center gap-2">
                  <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="text-xs" />
                </ActionForm>
              </div>
              <form action={deleteProduct.bind(null, id, p.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
            {(products ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت منتجات بعد.</li>}</ul>
          <ActionForm action={addProduct.bind(null, id)} submit="إضافة منتج">
            <input name="name_ar" required placeholder="اسم المنتج" className={field} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="brand" placeholder="الماركة" className={field} />
              <select name="category_id" required className={field}><option value="">الفئة</option>{(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select>
              <input name="price_jod" type="number" step="0.01" min="0" required placeholder="السعر (د.أ)" className={field} />
              <select name="availability" className={field}>{Object.entries(AVAILABILITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <label className={lbl}>صورة المنتج<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" /></label>
            <textarea name="description_ar" rows={3} placeholder="شرح المنتج (يظهر تحت الصورة)" className={field} />
            <textarea name="ingredients" rows={2} placeholder="المكونات (للمكملات)" className={field} />
          </ActionForm>
        </section>
      )}

      <section className={box}><h2 className="mb-3 text-lg font-bold">العروض</h2>
        <ul className="mb-4 space-y-2">{(offers ?? []).map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 text-sm"><span>{o.kind === "course" ? "🎓 " : ""}{o.title_ar} <span className="text-muted">حتى {o.ends_at.slice(0, 10)}</span></span>
            <form action={deleteOffer.bind(null, id, o.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
          {(offers ?? []).length === 0 && <li className="text-sm text-muted">لا توجد عروض.</li>}</ul>
        <ActionForm action={addOffer.bind(null, id)} submit="إضافة عرض">
          <input name="title_ar" required placeholder="عنوان العرض" className={field} />
          <textarea name="description_ar" rows={2} placeholder="تفاصيل" className={field} />
          <select name="kind" className={field}><option value="offer">عرض</option><option value="course">دورة / برنامج</option></select>
          <div className="grid gap-3 sm:grid-cols-4">
            <input name="discount_percent" type="number" min="1" max="90" placeholder="نسبة الخصم %" className={field} />
            <input name="offer_price_jod" type="number" step="0.01" min="0" placeholder="سعر العرض" className={field} />
            <input name="starts_at" type="date" required className={field} dir="ltr" />
            <input name="ends_at" type="date" required className={field} dir="ltr" />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
