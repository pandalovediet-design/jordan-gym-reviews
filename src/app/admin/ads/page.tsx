import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { adImageUrl } from "@/lib/ads";
import { dateAr, jod, msAgo } from "@/lib/format";
import { createAd, deleteAd, setAdActive } from "../actions";

export const metadata: Metadata = { title: "الإعلانات", robots: { index: false } };

export default async function AdsAdmin() {
  const { supabase } = await requireUser();
  const [ads, acc, orgs] = await Promise.all([
    supabase.from("ads").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("ad_accounting").select("*"),
    supabase.from("organizations").select("id,name_ar").eq("status", "published").order("name_ar").limit(300),
  ]);
  const list = ads.data ?? [];
  const accOf = (id: string) => (acc.data ?? []).find((a) => a.ad_id === id);
  const now = msAgo(0);
  const state = (a: (typeof list)[number]) =>
    !a.is_active ? ["متوقف", "text-muted"] : +new Date(a.starts_at) > now ? ["مجدول", "text-yellow-300"] : +new Date(a.ends_at) < now ? ["منتهي", "text-red-300"] : ["شغّال", "text-accent"];
  const revenue = (acc.data ?? []).reduce((s, a) => s + Number(a.price_jod ?? 0), 0);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const lbl = "block space-y-1 text-sm text-muted";
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">الإعلانات ({list.length})</h1>
        <p className="text-sm text-muted">مجموع المبيعات المسجلة: <span className="font-bold text-accent">{jod(revenue)}</span></p>
      </div>

      <section className={box}><h2 className="mb-3 text-lg font-bold">إضافة إعلان</h2>
        <ActionForm action={createAd} submit="حفظ الإعلان">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>المكان<select name="placement" className={field}><option value="banner">بانر كبير بأعلى الرئيسية</option><option value="sponsored">كرت «ممول»</option></select></label>
            <label className={lbl}>العنوان<input name="title" required className={field} /></label>
            <label className={`${lbl} sm:col-span-2`}>وصف قصير<input name="subtitle" className={field} /></label>
            <label className={lbl}>رابط الإعلان (https://...)<input name="link_url" dir="ltr" placeholder="أو اختر نشاط من اليمين" className={field} /></label>
            <label className={lbl}>أو نشاط على المنصة<select name="organization_id" className={field}><option value="">بدون</option>{(orgs.data ?? []).map((o) => <option key={o.id} value={o.id}>{o.name_ar}</option>)}</select></label>
            <label className={lbl}>من تاريخ<input name="starts_at" type="date" required dir="ltr" className={field} /></label>
            <label className={lbl}>إلى تاريخ<input name="ends_at" type="date" required dir="ltr" className={field} /></label>
            <label className={`${lbl} sm:col-span-2`}>الصورة (JPG / PNG / WebP، أقل من 4MB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={field} /></label>
          </div>
          <p className="pt-2 text-sm font-bold">بيانات المعلن (خاصة فيك)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="advertiser_name" placeholder="اسم المعلن" className={field} />
            <input name="advertiser_phone" placeholder="رقمه" dir="ltr" className={field} />
            <input name="price_jod" type="number" step="0.01" min="0" placeholder="السعر (دينار)" className={field} />
          </div>
          <textarea name="notes" rows={2} placeholder="ملاحظات" className={field} />
        </ActionForm>
      </section>

      <section><ul className="space-y-3">{list.map((a) => {
        const s = state(a), ac = accOf(a.id);
        return (
          <li key={a.id} className={`${box} flex flex-wrap gap-4`}>
            {a.image_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adImageUrl(a.image_path)!} alt="" className="h-20 w-32 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold">{a.title} <span className={`text-xs ${s[1]}`}>{s[0]}</span></p>
              <p className="text-xs text-muted">{a.placement === "banner" ? "بانر" : "ممول"} · {dateAr(a.starts_at)} ← {dateAr(a.ends_at)} · {a.clicks} نقرة</p>
              <p className="truncate text-xs text-muted" dir="ltr">{a.link_url}</p>
              {ac && <p className="text-xs text-muted">{[ac.advertiser_name, ac.advertiser_phone, ac.price_jod != null && jod(ac.price_jod)].filter(Boolean).join(" · ")}{ac.notes && ` — ${ac.notes}`}</p>}
            </div>
            <div className="flex items-start gap-2">
              <form action={setAdActive.bind(null, a.id, !a.is_active)}><button className={btn}>{a.is_active ? "إيقاف" : "تشغيل"}</button></form>
              <form action={deleteAd.bind(null, a.id)}><button className={`${btn} text-red-300`}>حذف</button></form>
            </div>
          </li>);
      })}
        {list.length === 0 && <li className="text-muted">لا توجد إعلانات بعد.</li>}</ul>
        <p className="mt-3 text-xs text-muted">عدّاد النقرات بيشتغل بعد إضافة SUPABASE_SERVICE_ROLE_KEY على فيرسل. صفحة الرئيسية بتحدّث الإعلانات خلال 5 دقائق.</p>
      </section>
    </div>
  );
}
