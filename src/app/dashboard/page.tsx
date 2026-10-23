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
  const { data: newInq } = await supabase.from("inquiries").select("organization_id").eq("status", "new").limit(1000);
  const newOf = (id: string) => (newInq ?? []).filter((q) => q.organization_id === id).length;
  const all = (memberships ?? []).flatMap((m) => (m.organizations ? [m.organizations] : []));
  // Listings added from public sources (not yet handed to their owners) are managed from the platform-owner panel, not mixed into "my activities".
  const orgs = all.filter((o) => o.is_claimed !== false);
  const unclaimed = all.length - orgs.length;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">أنشطتي</h1><p className="break-all text-sm text-muted" dir="ltr">{user.email}</p></div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{isAdmin && <Link href="/admin" className="rounded-lg bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">لوحة صاحب المنصة</Link>}<Link href="/account" className="text-sm text-muted underline">حسابي</Link><form action={signout}><button className="text-sm text-muted underline">تسجيل الخروج</button></form></div>
      </div>
      {isAdmin && unclaimed > 0 && (
        <p className="mb-4 rounded-xl bg-surface p-3 text-sm text-muted ring-1 ring-white/10">{unclaimed} نادي غير مُستلَم (بيانات أولية) بتلاقيهم وتدير ربطهم بأصحابهم من <Link href="/admin/orgs" className="font-bold text-accent underline">لوحة صاحب المنصة</Link>.</p>
      )}
      <Link href="/dashboard/new" className="mb-5 inline-block rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground">+ إضافة نشاط</Link>
      {orgs.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-muted">ما عندك أنشطة بعد.</p>
      ) : (
        <OrgList rows={orgs.map((o) => ({ id: o.id, name: o.name_ar, meta: `${ORG_TYPE_LABEL[o.type]} · ${o.city}`, status: STATUS[o.status], newCount: newOf(o.id) }))} />
      )}
    </div>
  );
}
