import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { ImageInput } from "@/components/ImageInput";
import { MEALS, MEAL_LABEL, mealIcon, mealLabel } from "@/lib/nutrition-meta";
import { addNutritionItem, addNutritionProduct, deleteNutritionItem, deleteNutritionProduct, setNutritionActive } from "../nutrition-actions";

export const metadata: Metadata = { title: "من غير حرمان", robots: { index: false } };

export default async function NutritionAdmin() {
  const { supabase } = await requireUser();
  const [{ data: ws }, { data: ps }] = await Promise.all([
    supabase.from("nutrition_items").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("nutrition_products").select("*").order("sort_order").order("created_at").limit(1200),
  ]);
  const list = ws ?? [];
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">من غير حرمان</h1>
        <Link href="/no-deprivation" className={btn}>شوف الصفحة ↗</Link>
      </div>

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-1 text-lg font-bold">➕ وصفة أو خطة جديدة</h2>
        <p className="mb-3 text-xs text-muted">حط رابط فيديو، أو اكتب الخطة بنفسك، أو الاثنين. بالنص: سطر يبدأ بـ&quot;# &quot; عنوان، وسطر يبدأ بـ&quot;- &quot; نقطة.</p>
        <ActionForm action={addNutritionItem} submit="إضافة">
          <input name="title" required maxLength={80} placeholder="العنوان (مثال: شوفان بالموز والفول السوداني)" className={field} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="meal" required defaultValue="breakfast" className={field}>{MEALS.map((m) => <option key={m} value={m}>{mealIcon(m)} {MEAL_LABEL[m]}</option>)}</select>
            <input name="video" dir="ltr" placeholder="رابط الفيديو (اختياري)" className={field} />
          </div>
          <textarea name="body" rows={7} maxLength={6000} placeholder={"الوصفة أو الخطة (اختياري إذا في فيديو)\n# المكونات\n- 50 غ شوفان\n- موزة\n# الطريقة\nاخلط وسخّن دقيقتين"} className={field} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input name="calories" inputMode="numeric" placeholder="سعرات" className={field} />
            <input name="protein" inputMode="numeric" placeholder="بروتين g" className={field} />
            <input name="carbs" inputMode="numeric" placeholder="كارب g" className={field} />
            <input name="fat" inputMode="numeric" placeholder="دهون g" className={field} />
          </div>
          <input name="summary" maxLength={300} placeholder="جملة تعريفية (اختياري)" className={field} />
          <input name="slug" dir="ltr" placeholder="slug إنجليزي (اختياري) مثال: oats-bowl" className={field} />
          <label className="block text-sm text-muted">صورة الغلاف (اختياري)
            <ImageInput name="cover" className="mt-1 block w-full text-sm" />
          </label>
        </ActionForm>
      </section>

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-1 text-lg font-bold">🛒 منتج تحت عنصر</h2>
        <p className="mb-3 text-xs text-muted">لحد 4 منتجات للعنصر. بنحسب كل نقرة.</p>
        <ActionForm action={addNutritionProduct} submit="إضافة المنتج">
          <select name="item" required defaultValue="" className={field}>
            <option value="" disabled>اختار العنصر</option>
            {list.map((w) => <option key={w.id} value={w.id}>{w.title_ar}</option>)}
          </select>
          <input name="name" required maxLength={80} placeholder="اسم المنتج" className={field} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="store" maxLength={40} placeholder="المتجر (اختياري)" className={field} />
            <input name="price" maxLength={30} placeholder="السعر (اختياري)" className={field} />
          </div>
          <input name="url" required dir="ltr" placeholder="رابط الشراء https://..." className={field} />
          <label className="block text-sm text-muted">صورة المنتج (اختياري)
            <ImageInput name="image" className="mt-1 block w-full text-sm" />
          </label>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">العناصر ({list.length})</h2>
        <ul className="space-y-3">
          {list.map((w) => {
            const mine = (ps ?? []).filter((p) => p.item_id === w.id);
            return (
              <li key={w.id} className="rounded-2xl bg-surface p-4 ring-1 ring-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <p className={`font-semibold ${w.is_active ? "" : "text-muted line-through"}`}>{w.title_ar}</p>
                    <p className="text-xs text-muted">{mealLabel(w.meal)} · {w.kind === "video" ? "فيديو" : "خطة"}{w.calories != null ? ` · ${w.calories} سعرة` : ""}</p>
                    {w.video_url && <a href={w.video_url} target="_blank" rel="noopener noreferrer" dir="ltr" className="block truncate text-xs text-accent underline">{w.video_url}</a>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/no-deprivation/${w.slug}`} className={btn}>الصفحة</Link>
                    <Link href={`/admin/nutrition/${w.id}`} className={btn}>تعديل</Link>
                    <form action={setNutritionActive.bind(null, w.id, !w.is_active)}><button className={btn}>{w.is_active ? "إخفاء" : "إظهار"}</button></form>
                    <form action={deleteNutritionItem.bind(null, w.id)}><button className={`${btn} !bg-red-500/30`}>حذف</button></form>
                  </div>
                </div>
                {mine.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs">
                    {mine.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">🛒 {p.name_ar} <span className="text-muted">· {p.clicks} نقرة</span></span>
                        <form action={deleteNutritionProduct.bind(null, p.id)}><button className={`${btn} !bg-red-500/30`}>حذف</button></form>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          {list.length === 0 && <li className="text-muted">ما في عناصر لسا. أضف أول وصفة من فوق.</li>}
        </ul>
      </section>
    </div>
  );
}
