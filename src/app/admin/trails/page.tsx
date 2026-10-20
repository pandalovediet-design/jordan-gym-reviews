import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ImageInput } from "@/components/ImageInput";
import { ActionForm, field } from "@/components/Form";
import { TRAIL_DIFFICULTY, TRAIL_TYPE } from "@/lib/format";
import { addTrail, deleteTrail, setTrailPublished } from "../more-actions";

export const metadata: Metadata = { title: "المسارات", robots: { index: false } };

export default async function TrailsAdmin() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("trails").select("*").order("created_at", { ascending: false }).limit(300);
  const list = data ?? [];
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const lbl = "block space-y-1 text-sm text-muted";
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-extrabold">مسارات المشي والهايكنق ({list.length})</h1>
      <section className={box}><h2 className="mb-3 text-lg font-bold">إضافة مسار</h2>
        <ActionForm action={addTrail} submit="نشر المسار">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>الاسم<input name="name_ar" required className={field} /></label>
            <label className={lbl}>الرمز بالإنجليزي (للرابط)<input name="slug" required dir="ltr" placeholder="wadi-mujib" className={field} /></label>
            <label className={lbl}>المنطقة<input name="region" required placeholder="مثال: عجلون" className={field} /></label>
            <label className={lbl}>النوع<select name="trail_type" className={field}>{Object.entries(TRAIL_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className={lbl}>الصعوبة<select name="difficulty" className={field}>{Object.entries(TRAIL_DIFFICULTY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className={lbl}>المسافة (كم)<input name="distance_km" type="number" step="0.1" min="0" dir="ltr" className={field} /></label>
            <label className={lbl}>المدة (دقيقة)<input name="duration_min" type="number" min="0" dir="ltr" className={field} /></label>
            <label className={lbl}>الارتفاع الصاعد (م)<input name="elevation_gain_m" type="number" min="0" dir="ltr" className={field} /></label>
            <label className={`${lbl} sm:col-span-2`}>رابط قوقل ماب<input name="maps_url" dir="ltr" className={field} /></label>
            <label className={`${lbl} sm:col-span-2`}>الوصف<textarea name="description_ar" rows={3} className={field} /></label>
            <label className={`${lbl} sm:col-span-2`}>نصائح<textarea name="tips_ar" rows={2} className={field} /></label>
            <label className={`${lbl} sm:col-span-2`}>صورة (اختياري)<ImageInput name="image" accept="image/jpeg,image/png,image/webp" className={field} /></label>
          </div>
        </ActionForm>
      </section>
      <ul className="space-y-3">
        {list.map((t) => (
          <li key={t.id} className={`${box} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <p className="font-semibold">{t.name_ar} <span className={`text-xs ${t.is_published ? "text-accent" : "text-muted"}`}>{t.is_published ? "منشور" : "مخفي"}</span></p>
              <p className="text-xs text-muted">{t.region} · {TRAIL_TYPE[t.trail_type as keyof typeof TRAIL_TYPE]} · {TRAIL_DIFFICULTY[t.difficulty as keyof typeof TRAIL_DIFFICULTY]}{t.distance_km ? ` · ${t.distance_km} كم` : ""}</p>
            </div>
            <div className="flex gap-2">
              <form action={setTrailPublished.bind(null, t.id, !t.is_published)}><button className={btn}>{t.is_published ? "إخفاء" : "نشر"}</button></form>
              <form action={deleteTrail.bind(null, t.id)}><button className={`${btn} text-red-300`}>حذف</button></form>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted">لا توجد مسارات بعد.</li>}
      </ul>
    </div>
  );
}
