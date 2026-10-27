import type { Metadata } from "next";
import { ActionForm } from "@/components/Form";
import { requireUser } from "@/lib/auth";
import { HOME_BLOCKS, NAV_CATALOG, normalizeSettings } from "@/lib/site-settings";
import { saveSiteSettings } from "./actions";

export const metadata: Metadata = { title: "إعدادات الموقع", robots: { index: false } };

export default async function SiteSettingsPage() {
  const { supabase } = await requireUser();
  // Read fresh (not the 5-minute cache) so the form always shows what is saved.
  const { data, error } = await supabase.from("site_settings").select("data,updated_at").eq("id", 1).maybeSingle();
  const s = normalizeSettings(data?.data);
  const pos = (href: string) => { const i = s.nav.indexOf(href); return i === -1 ? "" : String(i + 1); };
  const box = "space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const fld = "w-full rounded-xl bg-background px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold">⚙️ إعدادات الموقع</h1>
        <p className="mt-1 text-sm text-muted">من هون بتتحكم بشو بيظهر بالهيدر وبالصفحة الرئيسية. {data?.updated_at ? `آخر حفظ: ${data.updated_at.slice(0, 16).replace("T", " ")}` : "لسا ما في إعدادات محفوظة، والموقع شغّال على الإعدادات الافتراضية."}</p>
        {error && <p className="mt-2 rounded-xl bg-yellow-500/10 p-3 text-sm text-yellow-200">جدول الإعدادات لسا مش موجود بقاعدة البيانات، فالحفظ ما رح يشتغل لحد ما ينضاف.</p>}
      </div>
      <ActionForm action={saveSiteSettings} submit="حفظ الإعدادات" className="space-y-6">
        <section className={box}>
          <h2 className="text-lg font-bold">تبويبات الهيدر</h2>
          <p className="text-sm text-muted">علّم الأقسام اللي بدك إياها بشريط الهيدر، واكتب ترتيبها (1 أول واحد). اللي ما بتعلّمه بيضل موجود بصفحة «كل الأقسام». أنصح بـ6 لـ8 تبويبات.</p>
          <ul className="divide-y divide-white/10">
            {NAV_CATALOG.map((n, i) => (
              <li key={n.href} className="flex items-center gap-3 py-2">
                <input id={`nav_on_${i}`} type="checkbox" name={`nav_on:${n.href}`} defaultChecked={s.nav.includes(n.href)} className="size-5 accent-accent" />
                <label htmlFor={`nav_on_${i}`} className="flex-1">{n.label}</label>
                <input type="number" min={1} max={30} name={`nav_order:${n.href}`} defaultValue={pos(n.href)} placeholder="ترتيب" aria-label={`ترتيب ${n.label}`} className="w-20 rounded-lg bg-background px-2 py-1.5 text-center ring-1 ring-white/10" />
              </li>
            ))}
          </ul>
        </section>

        <section className={box}>
          <h2 className="text-lg font-bold">أجزاء الصفحة الرئيسية</h2>
          <ul className="space-y-2">
            {HOME_BLOCKS.map((b) => (
              <li key={b.key} className="flex items-center gap-3">
                <input id={`home_${b.key}`} type="checkbox" name={`home:${b.key}`} defaultChecked={s.home[b.key]} className="size-5 accent-accent" />
                <label htmlFor={`home_${b.key}`}>{b.label}</label>
              </li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-muted" htmlFor="perSection">عدد الكروت بكل قسم
              <select id="perSection" name="perSection" defaultValue={String(s.perSection)} className={`${fld} mt-1`}>
                {[3, 6, 9, 12].map((n) => <option key={n} value={n}>{n}</option>)}<option value="0">الكل (بيطوّل الصفحة)</option>
              </select>
            </label>
            <label className="block text-sm text-muted" htmlFor="maxSections">عدد أقسام الأنشطة بالرئيسية
              <select id="maxSections" name="maxSections" defaultValue={String(s.maxSections)} className={`${fld} mt-1`}>
                {[3, 6, 9, 12].map((n) => <option key={n} value={n}>{n} (الأكبر أول)</option>)}<option value="0">كل الأقسام</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-muted">الأقسام الزيادة بتطلع كأزرار صغيرة «تصفّح حسب القسم»، وكل قسم إله رابط «عرض الكل».</p>
        </section>

        <section className={box}>
          <h2 className="text-lg font-bold">نص الواجهة</h2>
          <label className="block text-sm text-muted" htmlFor="heroTitle">العنوان
            <input id="heroTitle" name="heroTitle" defaultValue={s.heroTitle} maxLength={120} className={`${fld} mt-1`} />
          </label>
          <label className="block text-sm text-muted" htmlFor="heroAccent">الجزء الملوّن من العنوان (اختياري)
            <input id="heroAccent" name="heroAccent" defaultValue={s.heroAccent} maxLength={80} className={`${fld} mt-1`} />
          </label>
          <label className="block text-sm text-muted" htmlFor="heroSubtitle">السطر تحت العنوان
            <textarea id="heroSubtitle" name="heroSubtitle" defaultValue={s.heroSubtitle} maxLength={300} rows={2} className={`${fld} mt-1`} />
          </label>
        </section>
      </ActionForm>
    </div>
  );
}
