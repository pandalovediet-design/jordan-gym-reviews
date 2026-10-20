import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ImageInput } from "@/components/ImageInput";
import { ActionForm, field } from "@/components/Form";
import { adImageUrl } from "@/lib/ads";
import { dateAr } from "@/lib/format";
import { addPartner, deletePartner, setPartnerActive } from "../more-actions";

export const metadata: Metadata = { title: "الشركاء", robots: { index: false } };

export default async function PartnersAdmin() {
  const { supabase } = await requireUser();
  const [p, orgs] = await Promise.all([
    supabase.from("partners").select("*").order("sort_order").order("created_at", { ascending: false }).limit(100),
    supabase.from("organizations").select("id,name_ar").eq("status", "published").order("name_ar").limit(300),
  ]);
  const list = p.data ?? [];
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const lbl = "block space-y-1 text-sm text-muted";
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-extrabold">الشركاء والرعاة ({list.length})</h1>
      <section className={box}><h2 className="mb-3 text-lg font-bold">إضافة شريك</h2>
        <ActionForm action={addPartner} submit="إضافة">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>الاسم<input name="name_ar" required className={field} /></label>
            <label className={lbl}>ينتهي بتاريخ (اختياري)<input name="ends_at" type="date" dir="ltr" className={field} /></label>
            <label className={lbl}>رابط (https://...)<input name="link_url" dir="ltr" className={field} /></label>
            <label className={lbl}>أو نشاط على المنصة<select name="organization_id" className={field}><option value="">بدون</option>{(orgs.data ?? []).map((o) => <option key={o.id} value={o.id}>{o.name_ar}</option>)}</select></label>
            <label className={`${lbl} sm:col-span-2`}>الشعار (JPG / PNG / WebP)<ImageInput name="logo" required accept="image/jpeg,image/png,image/webp" className={field} /></label>
          </div>
        </ActionForm>
      </section>
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((x) => (
          <li key={x.id} className={`${box} flex items-center gap-4`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={adImageUrl(x.logo_path)!} alt="" className="h-12 w-20 rounded bg-white/5 object-contain" />
            <div className="min-w-0 flex-1"><p className="font-semibold">{x.name_ar}</p>
              <p className="text-xs text-muted">{x.is_active ? "ظاهر" : "مخفي"}{x.ends_at ? ` · حتى ${dateAr(x.ends_at)}` : ""}</p></div>
            <div className="flex gap-2">
              <form action={setPartnerActive.bind(null, x.id, !x.is_active)}><button className={btn}>{x.is_active ? "إخفاء" : "إظهار"}</button></form>
              <form action={deletePartner.bind(null, x.id)}><button className={`${btn} text-red-300`}>حذف</button></form>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted">لا يوجد شركاء بعد.</li>}
      </ul>
    </div>
  );
}
