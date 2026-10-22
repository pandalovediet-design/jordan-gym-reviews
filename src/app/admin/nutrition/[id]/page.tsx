import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { ImageInput } from "@/components/ImageInput";
import { MEALS, MEAL_LABEL, mealIcon } from "@/lib/nutrition-meta";
import { updateNutritionItem } from "../../nutrition-actions";

export const metadata: Metadata = { title: "تعديل عنصر", robots: { index: false } };

export default async function EditNutrition({ params }: PageProps<"/admin/nutrition/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: w } = await supabase.from("nutrition_items").select("*").eq("id", id).maybeSingle();
  if (!w) notFound();
  const n = (x: number | null) => (x == null ? "" : String(x));
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Link href="/admin/nutrition" className="text-sm text-accent hover:underline">← من غير حرمان</Link>
      <h1 className="text-2xl font-extrabold">تعديل: {w.title_ar}</h1>
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <ActionForm action={updateNutritionItem.bind(null, id)} submit="حفظ التعديل">
          <input name="title" required maxLength={80} defaultValue={w.title_ar} className={field} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="meal" required defaultValue={w.meal} className={field}>{MEALS.map((m) => <option key={m} value={m}>{mealIcon(m)} {MEAL_LABEL[m]}</option>)}</select>
            <input name="video" dir="ltr" defaultValue={w.video_url ?? ""} placeholder="رابط الفيديو (اختياري)" className={field} />
          </div>
          <textarea name="body" rows={9} maxLength={6000} defaultValue={w.body_ar ?? ""} placeholder="الوصفة أو الخطة" className={field} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input name="calories" inputMode="numeric" defaultValue={n(w.calories)} placeholder="سعرات" className={field} />
            <input name="protein" inputMode="numeric" defaultValue={n(w.protein_g)} placeholder="بروتين g" className={field} />
            <input name="carbs" inputMode="numeric" defaultValue={n(w.carbs_g)} placeholder="كارب g" className={field} />
            <input name="fat" inputMode="numeric" defaultValue={n(w.fat_g)} placeholder="دهون g" className={field} />
          </div>
          <input name="summary" maxLength={300} defaultValue={w.summary_ar ?? ""} placeholder="جملة تعريفية" className={field} />
          <input name="slug" dir="ltr" defaultValue={w.slug} className={field} />
          <label className="block text-sm text-muted">صورة غلاف جديدة (اتركها فاضية للإبقاء على الحالية)
            <ImageInput name="cover" className="mt-1 block w-full text-sm" />
          </label>
        </ActionForm>
      </section>
    </div>
  );
}
