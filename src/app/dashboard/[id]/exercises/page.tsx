import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { MUSCLE_LABEL, SAFETY_NOTE, type Muscle } from "@/lib/exercise-meta";
import { deleteExplanation, saveExplanation } from "../../actions";

export const metadata: Metadata = { title: "شروحات التمارين", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const STATUS: Record<string, string> = { pending: "بانتظار موافقة الإدارة", approved: "ظاهر للعامة", rejected: "مرفوض" };

export default async function CoachExercises({ params }: PageProps<"/dashboard/[id]/exercises">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,name_ar,type").eq("id", id).maybeSingle();
  if (!org) notFound();
  const [{ data: exercises }, { data: mine }] = await Promise.all([
    supabase.from("exercises").select("id,slug,name_ar,muscle_group").eq("is_active", true).order("muscle_group").order("sort_order"),
    supabase.from("exercise_explanations").select("id,exercise_id,video_url,steps_ar,mistake_ar,status").eq("organization_id", id).order("created_at", { ascending: false }),
  ]);
  const byEx = new Map((exercises ?? []).map((e) => [e.id, e]));
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const bind = saveExplanation.bind(null, id);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href={`/dashboard/${id}`} className="text-sm text-accent hover:underline">← لوحة {org.name_ar}</Link>
      <h1 className="text-2xl font-extrabold">🏋️ شروحات التمارين</h1>
      {org.type !== "independent_coach" ? (
        <p className={box}>الشروحات متاحة للمدربين المستقلين فقط.</p>
      ) : (
        <>
          <section className={box}>
            <h2 className="mb-1 text-lg font-bold">أضف أو عدّل شرح</h2>
            <p className="mb-3 text-xs text-muted">اختر تمرين من قائمة المنصة. إذا عندك شرح قديم لنفس التمرين بينحفظ مكانه. أي تعديل بيرجع للمراجعة. ({(mine ?? []).length}/20)</p>
            <ActionForm action={bind} submit="إرسال للمراجعة">
              <select name="exercise_id" required className={field} defaultValue="">
                <option value="" disabled>اختر التمرين</option>
                {(exercises ?? []).map((e) => <option key={e.id} value={e.id}>{MUSCLE_LABEL[e.muscle_group as Muscle]} — {e.name_ar}</option>)}
              </select>
              <input name="video_url" dir="ltr" placeholder="رابط فيديو الشرح (اختياري: يوتيوب / إنستغرام / تيك توك / فيسبوك)" className={field} />
              <textarea name="steps" required rows={5} placeholder={"الخطوات، كل خطوة بسطر (من 2 إلى 8):\nاستلقِ على البنش وثبّت قدميك\nنزّل الدمبل ببطء حتى مستوى الصدر"} className={field} />
              <input name="mistake" maxLength={200} placeholder="الخطأ الشائع (اختياري)" className={field} />
            </ActionForm>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-bold">شروحاتي</h2>
            <ul className="space-y-3">
              {(mine ?? []).map((m) => (
                <li key={m.id} className={`${box} flex flex-wrap items-start justify-between gap-3`}>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">{byEx.get(m.exercise_id)?.name_ar ?? "تمرين"} <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{STATUS[m.status]}</span></p>
                    <p className="mt-1 text-xs text-muted">{m.steps_ar.length} خطوات{m.video_url ? " · مع فيديو" : ""}</p>
                  </div>
                  <form action={deleteExplanation.bind(null, id, m.id)}><button className="rounded-lg bg-red-500/30 px-3 py-1 text-xs hover:bg-red-500/40">حذف</button></form>
                </li>
              ))}
              {(mine ?? []).length === 0 && <li className="text-muted">ما أضفت شروحات بعد.</li>}
            </ul>
          </section>
          <p className="text-xs text-muted">⚠️ {SAFETY_NOTE}</p>
        </>
      )}
    </div>
  );
}
