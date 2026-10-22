import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { mealIcon, mealLabel } from "@/lib/nutrition-meta";
import { focusLabel, equipLabel } from "@/lib/home-meta";
import { addSeries, deleteSeries, setSeriesActive } from "../series-actions";

export const metadata: Metadata = { title: "سلاسل جاهزة", robots: { index: false } };

export default async function SeriesAdmin() {
  const { supabase } = await requireUser();
  const [{ data: home }, { data: nut }, { data: ser }] = await Promise.all([
    supabase.from("home_workouts").select("id,title_ar,focus,equipment").order("sort_order").order("created_at", { ascending: false }).limit(300),
    supabase.from("nutrition_items").select("id,title_ar,meal").order("sort_order").order("created_at", { ascending: false }).limit(300),
    supabase.from("named_series").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const box = "max-h-56 space-y-1 overflow-y-auto rounded-xl bg-background p-3 text-sm ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">سلاسل جاهزة</h1>
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-1 text-lg font-bold">➕ سلسلة جديدة</h2>
        <p className="mb-3 text-xs text-muted">بتظهر للزائر فوق الفلاتر كزر &quot;سلسلة جاهزة&quot;. الترتيب بالسلسلة هو ترتيب القائمة تحت. اختار من قائمة واحدة بس حسب النوع.</p>
        <ActionForm action={addSeries} submit="إضافة السلسلة">
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="kind" required defaultValue="home" className={field}><option value="home">🏠 تمارين (من غير جيم)</option><option value="nutrition">🥗 أكل (من غير حرمان)</option></select>
            <input name="title" required maxLength={80} placeholder="اسم السلسلة (مثال: يوم حبال كامل)" className={field} />
          </div>
          <input name="description" maxLength={300} placeholder="وصف قصير (اختياري)" className={field} />
          <input name="slug" dir="ltr" placeholder="slug إنجليزي (اختياري)" className={field} />
          <div className="grid gap-3 md:grid-cols-2">
            <div><p className="mb-1 text-sm text-muted">🏠 تمارين ({home?.length ?? 0})</p>
              <div className={box}>{(home ?? []).map((w) => <label key={w.id} className="flex items-start gap-2"><input type="checkbox" name="home_items" value={w.id} className="mt-1" /><span>{w.title_ar} <span className="text-xs text-muted">· {equipLabel(w.equipment)} · {focusLabel(w.focus)}</span></span></label>)}{!home?.length && <p className="text-muted">ما في تمارين.</p>}</div></div>
            <div><p className="mb-1 text-sm text-muted">🥗 أكل ({nut?.length ?? 0})</p>
              <div className={box}>{(nut ?? []).map((w) => <label key={w.id} className="flex items-start gap-2"><input type="checkbox" name="nutrition_items" value={w.id} className="mt-1" /><span>{w.title_ar} <span className="text-xs text-muted">· {mealIcon(w.meal)} {mealLabel(w.meal)}</span></span></label>)}{!nut?.length && <p className="text-muted">ما في وصفات.</p>}</div></div>
          </div>
        </ActionForm>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">السلاسل ({ser?.length ?? 0})</h2>
        <ul className="space-y-3">
          {(ser ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-white/10">
              <div className="text-sm"><p className={`font-semibold ${s.is_active ? "" : "text-muted line-through"}`}>{s.kind === "home" ? "🏠" : "🥗"} {s.title_ar}</p><p className="text-xs text-muted">{s.item_ids.length} عناصر{s.description_ar ? ` · ${s.description_ar}` : ""}</p></div>
              <div className="flex gap-2">
                <form action={setSeriesActive.bind(null, s.id, !s.is_active)}><button className={btn}>{s.is_active ? "إخفاء" : "إظهار"}</button></form>
                <form action={deleteSeries.bind(null, s.id)}><button className={`${btn} !bg-red-500/30`}>حذف</button></form>
              </div>
            </li>
          ))}
          {!ser?.length && <li className="text-muted">ما في سلاسل لسا.</li>}
        </ul>
      </section>
    </div>
  );
}
