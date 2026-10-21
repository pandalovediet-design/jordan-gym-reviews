import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { dateAr, jod } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { addMember, addPlan, addProgram, deleteMember, deletePlan, deleteProgram, renewMember, setCoachNote, uploadMemberFile, deleteMemberFile } from "../../members-actions";

export const metadata: Metadata = { title: "الأعضاء والاشتراكات", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function Members({ params }: PageProps<"/dashboard/[id]/members">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,name_ar,type").eq("id", id).maybeSingle();
  if (!org || org.type === "store") notFound();
  const [{ data: plans }, { data: members }, { data: programs }, { data: files }] = await Promise.all([
    supabase.from("membership_plans").select("*").eq("organization_id", id).order("created_at"),
    supabase.from("org_members").select("*").eq("organization_id", id).order("ends_on", { ascending: true }).limit(500),
    supabase.from("member_programs").select("id,member_id,kind,title,access_token").eq("organization_id", id).order("created_at", { ascending: false }),
    supabase.from("member_files").select("id,member_id,title,size_bytes").eq("organization_id", id).order("created_at", { ascending: false }),
  ]);
  const base = await siteUrl();
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = (d: string) => Math.round((+new Date(d) - +new Date(today)) / 86_400_000);
  const wa = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const list = members ?? [];
  const sorted = [...list].sort((a, b) => a.ends_on.localeCompare(b.ends_on));
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-extrabold">الأعضاء والاشتراكات</h1>
      <p className="text-sm text-muted">بيانات الأعضاء خاصة فيك وما بتظهر للعامة. الإرسال بيتم عن طريق واتساب ويب من رقمك، وما في رسائل تلقائية.</p>

      <section className={box}><h2 className="mb-3 text-lg font-bold">الباقات</h2>
        <ul className="mb-4 space-y-2">{(plans ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between text-sm"><span>{p.name_ar} · {p.duration_days} يوم · {jod(p.price_jod)}</span>
            <form action={deletePlan.bind(null, id, p.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
          {(plans ?? []).length === 0 && <li className="text-sm text-muted">أضف باقاتك (مثلاً: شهري 30 يوم).</li>}</ul>
        <ActionForm action={addPlan.bind(null, id)} submit="إضافة باقة">
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="name_ar" required placeholder="اسم الباقة" className={field} />
            <input name="duration_days" type="number" min="1" required placeholder="المدة بالأيام" className={field} />
            <input name="price_jod" type="number" step="0.01" min="0" placeholder="السعر (اختياري)" className={field} />
          </div>
        </ActionForm>
      </section>

      <section className={box}><h2 className="mb-3 text-lg font-bold">إضافة عضو</h2>
        <ActionForm action={addMember.bind(null, id)} submit="إضافة عضو">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="full_name" required placeholder="اسم العضو" className={field} />
            <input name="phone" required placeholder="رقم الهاتف 07XXXXXXXX" dir="ltr" className={field} />
            <select name="plan_id" className={field}><option value="">بدون باقة (حدد الأيام)</option>{(plans ?? []).map((p) => <option key={p.id} value={p.id}>{p.name_ar}</option>)}</select>
            <input name="days" type="number" min="1" placeholder="عدد الأيام (إن لم تختر باقة)" className={field} />
            <input name="starts_on" type="date" defaultValue={today} dir="ltr" className={field} />
            <input name="notes" placeholder="ملاحظات" className={field} />
          </div>
        </ActionForm>
      </section>

      <section><h2 className="mb-3 text-lg font-bold">الأعضاء ({list.length})</h2>
        <ul className="space-y-3">{sorted.map((m) => {
          const left = daysLeft(m.ends_on);
          const status = left < 0 ? ["منتهي", "text-red-300"] : left <= 7 ? [`ينتهي خلال ${left} يوم`, "text-yellow-300"] : ["فعّال", "text-accent"];
          const mine = (programs ?? []).filter((p) => p.member_id === m.id);
          const remind = `مرحبا ${m.full_name}، اشتراكك في ${org.name_ar} ${left < 0 ? "انتهى" : `بنتهي بتاريخ ${dateAr(m.ends_on)}`}. بنتشرف بتجديدك معنا.`;
          return (
            <li key={m.id} className={box}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-semibold">{m.full_name}</p><p className="text-xs text-muted" dir="ltr">{m.phone}</p></div>
                <div className="text-left text-xs"><p className={status[1]}>{status[0]}</p><p className="text-muted">حتى {dateAr(m.ends_on)}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={wa(m.phone, `مرحباً ${m.full_name}، هذا رابط عضويتك في ${org.name_ar} (اشتراكك، برامجك، والـQR للحضور): ${base}/me/${m.access_token}`)} target="_blank" rel="noopener noreferrer" className={btn}>إرسال رابط العضو</a>
                <a href={wa(m.phone, remind)} target="_blank" rel="noopener noreferrer" className={`${btn} !bg-accent text-accent-foreground`}>تذكير بواتساب</a>
                <form action={renewMember.bind(null, id, m.id)}><button className={btn}>تجديد</button></form>
                <form action={deleteMember.bind(null, id, m.id)}><button className={`${btn} text-red-300`}>حذف</button></form>
              </div>
              {mine.length > 0 && <ul className="mt-3 space-y-1 text-sm">{mine.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2"><span>{p.kind === "workout" ? "🏋️" : "🥗"} {p.title}</span>
                  <span className="flex gap-2"><a href={wa(m.phone, `مرحبا ${m.full_name}، هاد ${p.kind === "workout" ? "برنامج التمرين" : "النظام الغذائي"} الخاص فيك من ${org.name_ar}: ${base}/m/${p.access_token}`)} target="_blank" rel="noopener noreferrer" className={`${btn} !bg-accent text-accent-foreground`}>إرسال بواتساب</a>
                  <form action={deleteProgram.bind(null, id, p.id)}><button className={`${btn} text-red-300`}>حذف</button></form></span></li>))}</ul>}
              <details className="mt-3"><summary className="cursor-pointer text-sm text-accent">ملفات PDF للعضو ({(files ?? []).filter((f) => f.member_id === m.id).length})</summary>
                <div className="mt-3 space-y-3">
                  <ul className="space-y-1 text-sm">{(files ?? []).filter((f) => f.member_id === m.id).map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2"><span>📄 {f.title} <span className="text-xs text-muted">({Math.max(1, Math.round(f.size_bytes / 1024))} KB)</span></span>
                      <form action={deleteMemberFile.bind(null, id, f.id)}><button className={`${btn} text-red-300`}>حذف</button></form></li>))}</ul>
                  <ActionForm action={uploadMemberFile.bind(null, id, m.id)} submit="رفع الملف">
                    <input name="title" required placeholder="عنوان الملف (مثلاً: برنامج الصدر)" className={field} />
                    <input name="file" type="file" accept="application/pdf" required className="text-sm" />
                    <p className="text-xs text-muted">PDF فقط، حتى 4MB، وحد أقصى 10 ملفات لكل عضو.</p>
                  </ActionForm></div></details>
              <details className="mt-3"><summary className="cursor-pointer text-sm text-accent">ملاحظة المدرب للعضو{m.coach_note ? " ✓" : ""}</summary>
                <form action={setCoachNote.bind(null, id, m.id)} className="mt-3 space-y-2">
                  <textarea name="coach_note" rows={3} maxLength={500} defaultValue={m.coach_note ?? ""} placeholder="مثلاً: أحسنت على التزامك! ركّز على الأوزان هالأسبوع" className={field} />
                  <button className={btn}>حفظ الملاحظة</button></form></details>
              <details className="mt-3"><summary className="cursor-pointer text-sm text-accent">إضافة برنامج تمرين / غذاء</summary>
                <div className="mt-3">
                  <ActionForm action={addProgram.bind(null, id, m.id)} submit="حفظ البرنامج">
                    <select name="kind" className={field}><option value="workout">برنامج تمرين</option><option value="nutrition">نظام غذائي</option></select>
                    <input name="title" required placeholder="عنوان البرنامج" className={field} />
                    <textarea name="body" required rows={6} placeholder="اكتب البرنامج هون..." className={field} />
                  </ActionForm></div></details>
            </li>);
        })}
          {list.length === 0 && <li className="text-sm text-muted">لا يوجد أعضاء بعد.</li>}</ul></section>
      <p className="text-xs text-muted">رابط البرنامج خاص ومخفي عن محركات البحث، وكل من يملك الرابط يقدر يشوفه.</p>
      <Link href={`/dashboard/${id}/overview`} className="text-sm text-muted underline">← نظرة عامة</Link>
    </div>
  );
}
