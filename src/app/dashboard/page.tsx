import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { signout } from "@/app/login/actions";
import { OrgList } from "@/components/OrgList";

export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false } };
const STATUS = { draft: "مسودة", pending: "بانتظار المراجعة", published: "منشور", suspended: "موقوف" } as const;

export default async function Dashboard() {
  const { supabase, user } = await requireUser();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organizations(id,name_ar,type,status,city,slug,is_claimed)")
    .eq("user_id", user.id);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  const { data: managed } = await supabase.from("country_managers").select("country_code").eq("user_id", user.id).limit(1);
  const isManager = (managed ?? []).length > 0;
  const { data: myClaims } = await supabase.from("claim_requests").select("id,organizations(name_ar)").eq("user_id", user.id).eq("status", "pending");
  const { data: newInq } = await supabase.from("inquiries").select("organization_id").eq("status", "new").limit(1000);
  const newOf = (id: string) => (newInq ?? []).filter((q) => q.organization_id === id).length;
  const all = (memberships ?? []).flatMap((m) => (m.organizations ? [m.organizations] : []));
  // Listings added from public sources (not yet handed to their owners) are managed from the platform-owner panel, not mixed into "my activities".
  const orgs = all.filter((o) => o.is_claimed !== false);
  const unclaimed = all.length - orgs.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-7 overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-xl shadow-black/10">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold tracking-wide text-accent">مساحة إدارة الأنشطة</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">أنشطتي</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">تابع بيانات أنشطتك وحالة النشر واستفسارات العملاء من مكان واحد.</p>
            <p className="mt-3 break-all text-xs text-muted" dir="ltr">{user.email}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isAdmin && <Link href="/admin" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-bold transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">لوحة صاحب المنصة</Link>}
            {isManager && <Link href="/manager" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-accent/40 px-4 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">إدارة السوق</Link>}
            <Link href="/account" className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-muted transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">حسابي</Link>
            <form action={signout}><button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-muted transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">تسجيل الخروج</button></form>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-3">
          <div className="p-4 sm:px-7"><p className="text-xs text-muted">أنشطتي</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{orgs.length}</p></div>
          <div className="border-r border-white/10 p-4 sm:px-7"><p className="text-xs text-muted">استفسارات جديدة</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{orgs.reduce((sum, org) => sum + newOf(org.id), 0)}</p></div>
          <div className="col-span-2 border-t border-white/10 p-4 sm:col-span-1 sm:border-r sm:border-t-0 sm:px-7"><p className="text-xs text-muted">طلبات الاستلام المعلّقة</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{(myClaims ?? []).length}</p></div>
        </div>
      </header>

      {isAdmin && unclaimed > 0 && (
        <p className="mb-4 rounded-2xl border border-white/10 bg-surface p-4 text-sm leading-6 text-muted">
          <span className="font-bold text-foreground">{unclaimed} نادي غير مُستلَم</span> (بيانات أولية) بتلاقيهم وتدير ربطهم بأصحابهم من <Link href="/admin/orgs" className="font-bold text-accent underline underline-offset-4">لوحة صاحب المنصة</Link>.
        </p>
      )}
      {(myClaims ?? []).length > 0 && (
        <p role="status" className="mb-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-accent">
          طلب استلام «{(myClaims ?? []).map((c) => c.organizations?.name_ar).filter(Boolean).join("، ")}» قيد المراجعة. بعد الموافقة بيظهر النادي هون.
        </p>
      )}

      <section aria-labelledby="activities-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="activities-heading" className="text-xl font-extrabold">قائمة الأنشطة</h2><p className="mt-1 text-sm text-muted">إدارة بيانات النادي ومتابعة حالة ظهوره للزوار.</p></div>
          <Link href="/dashboard/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-bold text-accent-foreground shadow-lg shadow-accent/10 transition-transform hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"><span aria-hidden="true">+</span> إضافة نشاط</Link>
        </div>
        {orgs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-surface/60 px-6 py-12 text-center sm:px-10">
            <div aria-hidden="true" className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-2xl text-accent">＋</div>
            <h3 className="text-lg font-extrabold">لسّه ما أضفت أي نشاط</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">أضف ناديك حتى يتمكن الزوار من اكتشافه والتواصل معك ومعرفة معلوماته الأساسية.</p>
            <Link href="/dashboard/new" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-2.5 font-bold text-accent-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">ابدأ بإضافة نشاطك</Link>
          </div>
        ) : (
          <OrgList rows={orgs.map((o) => ({ id: o.id, name: o.name_ar, meta: `${ORG_TYPE_LABEL[o.type]} · ${o.city}`, status: STATUS[o.status], newCount: newOf(o.id) }))} />
        )}
      </section>
    </main>
  );
}
