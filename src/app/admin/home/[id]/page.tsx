import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { ImageInput } from "@/components/ImageInput";
import { EQUIPMENT, EQUIPMENT_LABEL, FOCUS, FOCUS_LABEL } from "@/lib/home-meta";
import { LEVEL_LABEL } from "@/lib/exercise-meta";
import { updateHomeWorkout } from "../../home-actions";

export const metadata: Metadata = { title: "تعديل تمرين", robots: { index: false } };

export default async function EditHome({ params }: PageProps<"/admin/home/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: w } = await supabase.from("home_workouts").select("*").eq("id", id).maybeSingle();
  if (!w) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Link href="/admin/home" className="text-sm text-accent hover:underline">← من غير جيم</Link>
      <h1 className="text-2xl font-extrabold">تعديل: {w.title_ar}</h1>
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <ActionForm action={updateHomeWorkout.bind(null, id)} submit="حفظ التعديل">
          <input name="title" required maxLength={80} defaultValue={w.title_ar} className={field} />
          <input name="video" required dir="ltr" defaultValue={w.video_url} className={field} />
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="equipment" required defaultValue={w.equipment} className={field}>{EQUIPMENT.map((e) => <option key={e} value={e}>{EQUIPMENT_LABEL[e]}</option>)}</select>
            <select name="focus" required defaultValue={w.focus} className={field}>{FOCUS.map((f) => <option key={f} value={f}>{FOCUS_LABEL[f]}</option>)}</select>
            <select name="level" defaultValue={w.level} className={field}>{Object.entries(LEVEL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </div>
          <textarea name="steps" required rows={6} defaultValue={w.steps_ar.join("\n")} className={field} />
          <input name="mistake" maxLength={200} defaultValue={w.mistake_ar ?? ""} placeholder="الخطأ الشائع" className={field} />
          <input name="sets" maxLength={40} defaultValue={w.sets_ar ?? ""} placeholder="العدّات" className={field} />
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
