import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { dateAr, msAgo } from "@/lib/format";
import { createFlashSlot, deleteFlashSlot, renewFlashSlot } from "../more-actions";

export const metadata: Metadata = { title: "مساحات الفلاش", robots: { index: false } };

export default async function FlashAdmin() {
  const { supabase } = await requireUser();
  const [s, orgs] = await Promise.all([
    supabase.from("flash_slots").select("*,organizations(name_ar)").order("starts_at", { ascending: false }).limit(100),
    supabase.from("organizations").select("id,name_ar").eq("status", "published").order("name_ar").limit(300),
  ]);
  const list = s.data ?? [];
  const now = msAgo(0);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const lbl = "block space-y-1 text-sm text-muted";
  const st = (x: (typeof list)[number]) => (+new Date(x.ends_at) < now ? ["منتهي", "text-muted"] : +new Date(x.starts_at) > now ? ["مجدول", "text-yellow-300"] : ["شغّال", "text-accent"]);
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-extrabold">مساحات عروض الفلاش</h1>
      <p className="text-sm text-muted">مساحة إعلانية مدفوعة، حد أقصى 48 ساعة، وستة بنفس الوقت. بتفعّل المساحة وصاحب النشاط بيعبي العرض من لوحته.</p>
      <section className={box}><h2 className="mb-3 text-lg font-bold">تفعيل مساحة</h2>
        <ActionForm action={createFlashSlot} submit="تفعيل">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={lbl}>النشاط<select name="organization_id" required className={field}>{(orgs.data ?? []).map((o) => <option key={o.id} value={o.id}>{o.name_ar}</option>)}</select></label>
            <label className={lbl}>البداية<input name="starts_at" type="datetime-local" required dir="ltr" className={field} /></label>
            <label className={lbl}>المدة (ساعة، حتى 48)<input name="hours" type="number" min="1" max="48" defaultValue={24} dir="ltr" className={field} /></label>
          </div>
        </ActionForm>
      </section>
      <ul className="space-y-3">
        {list.map((x) => { const t = st(x); return (
          <li key={x.id} className={`${box} flex flex-wrap items-center justify-between gap-3`}>
            <div><p className="font-semibold">{x.organizations?.name_ar} <span className={`text-xs ${t[1]}`}>{t[0]}</span></p>
              <p className="text-xs text-muted">{dateAr(x.starts_at)} ← {dateAr(x.ends_at)} · المدة {Math.round((+new Date(x.ends_at) - +new Date(x.starts_at)) / 3_600_000)} ساعة · {x.title_ar ? `العرض: ${x.title_ar}` : "لسا ما عبّى العرض"}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={renewFlashSlot.bind(null, x.id)} className="flex items-center gap-1">
                <input name="hours" type="number" min="1" max="48" defaultValue={Math.round((+new Date(x.ends_at) - +new Date(x.starts_at)) / 3_600_000)} dir="ltr" aria-label="ساعات" className="w-16 rounded-lg bg-background px-2 py-1 text-xs ring-1 ring-white/10" />
                <button className="rounded-lg bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">تجديد من الآن</button>
              </form>
              <form action={deleteFlashSlot.bind(null, x.id)}><button className="rounded-lg bg-white/10 px-3 py-1 text-xs text-red-300 hover:bg-white/20">حذف</button></form></div>
          </li>); })}
        {list.length === 0 && <li className="text-muted">لا توجد مساحات.</li>}
      </ul>
    </div>
  );
}
