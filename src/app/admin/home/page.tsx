import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { ImageInput } from "@/components/ImageInput";
import { EQUIPMENT, EQUIPMENT_LABEL, FOCUS, FOCUS_LABEL, equipLabel, focusLabel } from "@/lib/home-meta";
import { LEVEL_LABEL } from "@/lib/exercise-meta";
import { addHomeProduct, addHomeWorkout, deleteHomeProduct, deleteHomeWorkout, setHomeWorkoutActive } from "../home-actions";

export const metadata: Metadata = { title: "من غير جيم", robots: { index: false } };

export default async function HomeAdmin() {
  const { supabase } = await requireUser();
  const [{ data: ws }, { data: ps }] = await Promise.all([
    supabase.from("home_workouts").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("home_workout_products").select("*").order("sort_order").order("created_at").limit(1200),
  ]);
  const list = ws ?? [];
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">من غير جيم</h1>
        <Link href="/no-gym" className={btn}>شوف الصفحة ↗</Link>
      </div>

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-lg font-bold">➕ تمرين جديد</h2>
        <ActionForm action={addHomeWorkout} submit="إضافة التمرين">
          <input name="title" required maxLength={80} placeholder="اسم التمرين (مثال: سحب الظهر بحبل المقاومة)" className={field} />
          <input name="video" required dir="ltr" placeholder="رابط الفيديو من صفحتك (يوتيوب / إنستغرام / تيك توك / فيسبوك)" className={field} />
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="equipment" required defaultValue="bands" className={field}>{EQUIPMENT.map((e) => <option key={e} value={e}>{EQUIPMENT_LABEL[e]}</option>)}</select>
            <select name="focus" required defaultValue="full_body" className={field}>{FOCUS.map((f) => <option key={f} value={f}>{FOCUS_LABEL[f]}</option>)}</select>
            <select name="level" defaultValue="beginner" className={field}>{Object.entries(LEVEL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </div>
          <textarea name="steps" required rows={5} placeholder={"الخطوات، كل خطوة بسطر (من 1 لـ8)\nثبّت الحبل بباب الغرفة\nاسحب بمرفقيك لورا"} className={field} />
          <input name="mistake" maxLength={200} placeholder="الخطأ الشائع (اختياري)" className={field} />
          <input name="sets" maxLength={40} placeholder="العدّات (اختياري) مثال: 3 × 12" className={field} />
          <input name="summary" maxLength={300} placeholder="جملة تعريفية (اختياري)" className={field} />
          <input name="slug" dir="ltr" placeholder="slug إنجليزي (اختياري) مثال: band-row — إذا فاضي بيتولّد لحاله" className={field} />
          <label className="block text-sm text-muted">صورة الغلاف (اختياري، بتظهر على الكرت)
            <ImageInput name="cover" className="mt-1 block w-full text-sm" />
          </label>
        </ActionForm>
      </section>

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-1 text-lg font-bold">🛒 منتج تحت تمرين</h2>
        <p className="mb-3 text-xs text-muted">لحد 4 منتجات للتمرين. حط رابط الشراء (رابط شراكة أو رابط محل) وبنحسب كل نقرة.</p>
        <ActionForm action={addHomeProduct} submit="إضافة المنتج">
          <select name="workout" required defaultValue="" className={field}>
            <option value="" disabled>اختار التمرين</option>
            {list.map((w) => <option key={w.id} value={w.id}>{w.title_ar}</option>)}
          </select>
          <input name="name" required maxLength={80} placeholder="اسم المنتج (مثال: طقم حبال مقاومة 5 مستويات)" className={field} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="store" maxLength={40} placeholder="المتجر (اختياري)" className={field} />
            <input name="price" maxLength={30} placeholder="السعر (اختياري) مثال: 12 د.أ" className={field} />
          </div>
          <input name="url" required dir="ltr" placeholder="رابط الشراء https://..." className={field} />
          <label className="block text-sm text-muted">صورة المنتج (اختياري)
            <ImageInput name="image" className="mt-1 block w-full text-sm" />
          </label>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">التمارين ({list.length})</h2>
        <ul className="space-y-3">
          {list.map((w) => {
            const mine = (ps ?? []).filter((p) => p.workout_id === w.id);
            return (
              <li key={w.id} className="rounded-2xl bg-surface p-4 ring-1 ring-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <p className={`font-semibold ${w.is_active ? "" : "text-muted line-through"}`}>{w.title_ar}</p>
                    <p className="text-xs text-muted">{equipLabel(w.equipment)} · {focusLabel(w.focus)} · {LEVEL_LABEL[w.level]}{w.sets_ar ? ` · ${w.sets_ar}` : ""}</p>
                    <a href={w.video_url} target="_blank" rel="noopener noreferrer" dir="ltr" className="block truncate text-xs text-accent underline">{w.video_url}</a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/no-gym/${w.slug}`} className={btn}>الصفحة</Link>
                    <Link href={`/admin/home/${w.id}`} className={btn}>تعديل</Link>
                    <form action={setHomeWorkoutActive.bind(null, w.id, !w.is_active)}><button className={btn}>{w.is_active ? "إخفاء" : "إظهار"}</button></form>
                    <form action={deleteHomeWorkout.bind(null, w.id)}><button className={`${btn} !bg-red-500/30`}>حذف</button></form>
                  </div>
                </div>
                {mine.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs">
                    {mine.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">🛒 {p.name_ar} <span className="text-muted">· {p.clicks} نقرة</span></span>
                        <form action={deleteHomeProduct.bind(null, p.id)}><button className={`${btn} !bg-red-500/30`}>حذف</button></form>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          {list.length === 0 && <li className="text-muted">ما في تمارين لسا. أضف أول فيديو من فوق.</li>}
        </ul>
      </section>
    </div>
  );
}
