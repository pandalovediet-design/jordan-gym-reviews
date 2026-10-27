import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL, dateAr } from "@/lib/format";
import { setOrgStatus } from "./actions";

export const metadata: Metadata = { title: "لوحة الإدارة", robots: { index: false } };
type Stats = {
  users_total: number; users_confirmed: number; users_7d: number;
  orgs_by_status: Record<string, number>; orgs_by_type: Record<string, number>;
  featured_now: number; events_7d: Record<string, number>; events_30d: Record<string, number>;
  inquiries_new: number; members_total: number; products_pending: number;
};
const STATUS_LABEL: Record<string, string> = { draft: "مسودة", pending: "بانتظار المراجعة", published: "منشور", suspended: "موقوف" };

export default async function AdminHome() {
  const { supabase } = await requireUser();
  const [statsRes, topRes, usersRes, pendingRes] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase.rpc("admin_top_orgs", { p_days: 30 }),
    supabase.rpc("admin_list_users"),
    supabase.from("organizations").select("id,name_ar,type,city,created_at").eq("status", "pending").order("created_at").limit(20),
  ]);
  const s = (statsRes.data ?? {}) as Stats;
  const top = topRes.data ?? [];
  const recent = (usersRes.data ?? []).slice(0, 5);
  const pending = pendingRes.data ?? [];
  const e7 = s.events_7d ?? {}, e30 = s.events_30d ?? {};
  const byStatus = s.orgs_by_status ?? {}, byType = s.orgs_by_type ?? {};
  const orgsTotal = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const kpi = (label: string, value: number | string, sub?: string, href?: string) => {
    const inner = (<><p className="text-3xl font-extrabold text-accent">{value}</p><p className="text-sm">{label}</p>{sub && <p className="text-xs text-muted">{sub}</p>}</>);
    return href ? <Link key={label} href={href} className={`${box} hover:ring-accent`}>{inner}</Link> : <div key={label} className={box}>{inner}</div>;
  };
  const max = Math.max(1, ...Object.values(byType));
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-extrabold">لوحة الإدارة</h1>
      <nav className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" aria-label="اختصارات">
        <Link href="/admin/orgs" className="rounded-xl bg-accent px-4 py-3 text-center font-bold text-accent-foreground">📋 راجع الأنشطة</Link>
        <Link href="/dashboard/new" className="rounded-xl bg-surface px-4 py-3 text-center font-semibold ring-1 ring-white/10 hover:ring-accent">➕ أضف نشاط</Link>
        <Link href="/admin/ads" className="rounded-xl bg-surface px-4 py-3 text-center font-semibold ring-1 ring-white/10 hover:ring-accent">📣 الإعلانات</Link>
        <Link href="/admin/settings" className="rounded-xl bg-surface px-4 py-3 text-center font-semibold ring-1 ring-white/10 hover:ring-accent">⚙️ إعدادات الموقع</Link>
      </nav>
      {(statsRes.error || topRes.error) && <p className="rounded-xl bg-red-400/15 p-3 text-sm text-red-200">تعذّر تحميل بعض الإحصائيات.</p>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi("الأنشطة", orgsTotal, `${byStatus.published ?? 0} منشور · ${byStatus.pending ?? 0} بالانتظار`, "/admin/orgs")}
        {kpi("استفسارات جديدة", s.inquiries_new ?? 0)}
        {kpi("مشاهدات (7 أيام)", e7.page_view ?? 0, `${e30.page_view ?? 0} آخر 30 يوم`)}
        {kpi("نقرات واتساب (7 أيام)", e7.whatsapp_click ?? 0, `${e30.whatsapp_click ?? 0} آخر 30 يوم`)}
      </section>
      <details className="rounded-2xl bg-surface/50 p-4 ring-1 ring-white/10">
        <summary className="cursor-pointer font-semibold text-muted">📊 أرقام أكثر</summary>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpi("المستخدمون المسجلون", s.users_total ?? 0, `${s.users_confirmed ?? 0} مؤكد · ${s.users_7d ?? 0} جديد آخر 7 أيام`, "/admin/users")}
          {kpi("مميّز حالياً", s.featured_now ?? 0, "بالبحث", "/admin/orgs")}
          {kpi("الأعضاء بالأنشطة", s.members_total ?? 0)}
          {kpi("مسح QR (7 أيام)", e7.qr_scan ?? 0, `${e30.qr_scan ?? 0} آخر 30 يوم`)}
        </div>
      </details>

      {(pending.length > 0 || (s.products_pending ?? 0) > 0) && (
        <section><h2 className="mb-3 text-lg font-bold">يحتاج إجراء</h2>
          <ul className="space-y-2">
            {pending.map((o) => (
              <li key={o.id} className={`${box} flex flex-wrap items-center justify-between gap-3`}>
                <span><span className="font-semibold">{o.name_ar}</span> <span className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]} · {o.city} · أُرسل {dateAr(o.created_at)}</span></span>
                <span className="flex gap-2"><Link href={`/admin/orgs?q=${encodeURIComponent(o.name_ar)}`} className={btn}>فتح</Link>
                  <form action={setOrgStatus.bind(null, o.id, "published")}><button className={`${btn} !bg-accent text-accent-foreground`}>نشر</button></form></span>
              </li>))}
            {(s.products_pending ?? 0) > 0 && <li className={box}><Link href="/admin/products" className="underline">{s.products_pending} منتج بانتظار الاعتماد</Link></li>}
          </ul></section>
      )}

      <details className="rounded-2xl bg-surface/50 p-4 ring-1 ring-white/10">
        <summary className="cursor-pointer font-semibold text-muted">📈 تقارير (الأنواع، آخر المسجلين، أكثر الأنشطة نشاطاً)</summary>
        <div className="mt-4 space-y-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className={box}><h2 className="mb-3 font-bold">الأنشطة حسب النوع</h2>
          <ul className="space-y-2 text-sm">{Object.entries(ORG_TYPE_LABEL).map(([k, v]) => (
            <li key={k}><div className="flex justify-between"><span>{v}</span><span className="text-muted">{byType[k] ?? 0}</span></div>
              <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-accent" style={{ width: `${((byType[k] ?? 0) / max) * 100}%` }} /></div></li>))}</ul>
          <p className="mt-3 text-xs text-muted">{Object.entries(byStatus).map(([k, v]) => `${STATUS_LABEL[k] ?? k}: ${v}`).join(" · ")}</p></div>
        <div className={box}><h2 className="mb-3 font-bold">آخر المسجلين</h2>
          <ul className="space-y-2 text-sm">{recent.map((u) => (
            <li key={u.id} className="flex justify-between gap-2"><span className="truncate" dir="ltr">{u.email}</span><span className="shrink-0 text-xs text-muted">{dateAr(u.created_at)}{!u.email_confirmed && " · غير مؤكد"}</span></li>))}
            {recent.length === 0 && <li className="text-muted">لا يوجد.</li>}</ul>
          <Link href="/admin/users" className="mt-3 inline-block text-sm text-accent underline">كل المستخدمين</Link></div>
      </section>

      <section><h2 className="mb-3 text-lg font-bold">أكثر الأنشطة نشاطاً (آخر 30 يوم)</h2>
        <div className="overflow-x-auto"><table className={`${box} w-full text-sm`}>
          <thead className="text-muted"><tr className="text-right"><th className="p-2">النشاط</th><th className="p-2">مشاهدات</th><th className="p-2">واتساب</th><th className="p-2">اتصال</th><th className="p-2">QR</th></tr></thead>
          <tbody>{top.map((t) => (
            <tr key={t.organization_id} className="border-t border-white/10"><td className="p-2"><Link href={`/g/${t.slug}`} className="underline">{t.name_ar}</Link></td>
              <td className="p-2">{t.views}</td><td className="p-2">{t.whatsapp}</td><td className="p-2">{t.phone}</td><td className="p-2">{t.qr}</td></tr>))}
            {top.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted">لا توجد بيانات بعد. تظهر الأرقام بعد إضافة مفتاح service role على فيرسل.</td></tr>}
          </tbody></table></div></section>
        </div>
      </details>
    </div>
  );
}
