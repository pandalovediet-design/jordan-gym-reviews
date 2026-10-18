import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { dateAr } from "@/lib/format";

export const metadata: Metadata = { title: "المستخدمون", robots: { index: false } };

export default async function Users({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.toLowerCase().trim() ?? "";
  const { supabase } = await requireUser();
  const [{ data, error }, memberships] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.from("organization_members").select("user_id,organizations(id,name_ar,status)"),
  ]);
  const orgsOf = (uid: string) => (memberships.data ?? []).filter((m) => m.user_id === uid).flatMap((m) => (m.organizations ? [m.organizations] : []));
  const all = data ?? [];
  const users = q ? all.filter((u) => u.email.toLowerCase().includes(q) || (u.display_name ?? "").toLowerCase().includes(q)) : all;
  const box = "rounded-2xl bg-surface ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">المستخدمون ({all.length})</h1>
        <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="ابحث بالإيميل أو الاسم" className="rounded-xl bg-surface px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-accent" />
          <button className="rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground">بحث</button></form>
      </div>
      {error && <p className="rounded-xl bg-red-400/15 p-3 text-sm text-red-200">تعذّر تحميل المستخدمين.</p>}
      <div className={`${box} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-muted"><tr className="text-right"><th className="p-3">الإيميل</th><th className="p-3">الاسم</th><th className="p-3">التسجيل</th><th className="p-3">آخر دخول</th><th className="p-3">الأنشطة</th><th className="p-3">الحالة</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-t border-white/10">
              <td className="p-3" dir="ltr">{u.email}</td><td className="p-3">{u.display_name ?? "—"}</td>
              <td className="p-3">{dateAr(u.created_at)}</td><td className="p-3">{u.last_sign_in_at ? dateAr(u.last_sign_in_at) : "—"}</td>
              <td className="p-3">{orgsOf(u.id).length === 0 ? "—" : (
                <ul className="space-y-1">{orgsOf(u.id).map((o) => <li key={o.id}><Link href={`/dashboard/${o.id}/overview`} className="text-accent underline">{o.name_ar}</Link></li>)}</ul>)}</td>
              <td className="p-3">{u.is_admin && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">أدمن</span>}
                {u.email_confirmed ? <span className="text-xs text-accent">مؤكد</span> : <span className="text-xs text-yellow-300">غير مؤكد</span>}</td>
            </tr>))}
            {users.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">لا يوجد مستخدمون.</td></tr>}
          </tbody></table></div>
    </div>
  );
}
