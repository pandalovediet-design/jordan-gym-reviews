import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { signout } from "@/app/login/actions";

export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false } };
const STATUS = { draft: "مسودة", pending: "بانتظار المراجعة", published: "منشور", suspended: "موقوف" } as const;

export default async function Dashboard() {
  const { supabase, user } = await requireUser();
  const { data: orgs } = await supabase
    .from("organizations").select("id,name_ar,type,status,city,slug").order("created_at", { ascending: false });
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold">أنشطتي</h1><p className="text-sm text-muted" dir="ltr">{user.email}</p></div>
        <form action={signout}><button className="text-sm text-muted underline">تسجيل الخروج</button></form>
      </div>
      {(orgs ?? []).length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-muted">ما عندك أنشطة بعد.</p>
      ) : (
        <ul className="space-y-3">{orgs!.map((o) => (
          <li key={o.id}><Link href={`/dashboard/${o.id}/overview`} className="flex items-center justify-between rounded-2xl bg-surface p-5 ring-1 ring-white/10 hover:ring-accent/60">
            <div><p className="font-bold">{o.name_ar}</p><p className="text-sm text-muted">{ORG_TYPE_LABEL[o.type]} · {o.city}</p></div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{STATUS[o.status]}</span></Link></li>))}</ul>
      )}
      <Link href="/dashboard/new" className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground">+ إضافة نشاط</Link>
    </div>
  );
}
