import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateAr } from "@/lib/format";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { LEVEL_LABEL, MUSCLES, MUSCLE_LABEL, type Muscle } from "@/lib/exercise-meta";
import { addExercise, adminDeleteExplanation, setExerciseActive, setExplanationStatus } from "../actions";

export const metadata: Metadata = { title: "التمارين", robots: { index: false } };

export default async function ExercisesAdmin() {
  const { supabase } = await requireUser();
  const [{ data: ex }, { data: expl }] = await Promise.all([
    supabase.from("exercises").select("*").order("muscle_group").order("sort_order"),
    supabase.from("exercise_explanations").select("*,organizations(slug,name_ar),exercises(name_ar)").order("created_at", { ascending: false }).limit(300),
  ]);
  const list = expl ?? [];
  const pending = list.filter((x) => x.status === "pending");
  const rest = list.filter((x) => x.status !== "pending");
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const row = (x: (typeof list)[number]) => (
    <li key={x.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-semibold">{x.exercises?.name_ar} <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{x.status}</span></p>
        <p className="text-xs text-muted">{x.organizations?.name_ar} · {dateAr(x.created_at)}</p>
        {x.video_url && <a href={x.video_url} target="_blank" rel="noopener noreferrer" dir="ltr" className="block truncate text-xs text-accent underline">{x.video_url}</a>}
        <ol className="list-decimal ps-5 text-xs text-muted">{x.steps_ar.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {x.mistake_ar && <p className="text-xs text-red-200">⚠️ {x.mistake_ar}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {x.organizations && <Link href={`/g/${x.organizations.slug}`} className={btn}>الصفحة</Link>}
        {x.status !== "approved" && <form action={setExplanationStatus.bind(null, x.id, "approved")}><button className={`${btn} !bg-accent text-accent-foreground`}>موافقة</button></form>}
        {x.status === "pending" && <form action={setExplanationStatus.bind(null, x.id, "rejected")}><button className={btn}>رفض</button></form>}
        <form action={adminDeleteExplanation.bind(null, x.id)}><button className={`${btn} !bg-red-500/30`}>حذف</button></form>
      </div>
    </li>
  );
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">التمارين</h1>
      <section><h2 className="mb-3 text-lg font-bold">شروحات بانتظار الموافقة ({pending.length})</h2><ul className="space-y-3">{pending.map(row)}{pending.length === 0 && <li className="text-muted">ما في شي.</li>}</ul></section>
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-lg font-bold">➕ تمرين جديد بالقائمة</h2>
        <ActionForm action={addExercise} submit="إضافة">
          <input name="name" required maxLength={60} placeholder="اسم التمرين بالعربي" className={field} />
          <input name="slug" required dir="ltr" placeholder="slug بالإنجليزي مثال: bench-press" className={field} />
          <select name="muscle" required className={field} defaultValue="chest">{MUSCLES.map((m) => <option key={m} value={m}>{MUSCLE_LABEL[m]}</option>)}</select>
          <select name="level" className={field} defaultValue="beginner">{Object.entries(LEVEL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input name="gear" maxLength={60} placeholder="المعدات (اختياري)" className={field} />
          <input name="secondary" maxLength={80} placeholder="عضلات مساندة (اختياري)" className={field} />
          <input name="summary" maxLength={300} placeholder="جملة تعريفية (اختياري)" className={field} />
        </ActionForm>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">قائمة التمارين ({(ex ?? []).length})</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(ex ?? []).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-4 py-2 text-sm ring-1 ring-white/10">
              <span className={e.is_active ? "" : "text-muted line-through"}>{e.name_ar} <span className="text-xs text-muted">· {MUSCLE_LABEL[e.muscle_group as Muscle]}</span></span>
              <form action={setExerciseActive.bind(null, e.id, !e.is_active)}><button className={btn}>{e.is_active ? "إخفاء" : "إظهار"}</button></form>
            </li>
          ))}
        </ul>
      </section>
      <section><h2 className="mb-3 text-lg font-bold">باقي الشروحات</h2><ul className="space-y-3">{rest.map(row)}{rest.length === 0 && <li className="text-muted">ما في شروحات.</li>}</ul></section>
    </div>
  );
}
