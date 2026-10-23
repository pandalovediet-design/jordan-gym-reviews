import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "سجل الحضور", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ar-JO", { timeZone: "Asia/Amman", ...o }).format(new Date(iso));

export default async function Attendance({ params }: PageProps<"/dashboard/[id]/attendance">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,name_ar,type").eq("id", id).maybeSingle();
  if (!org || !["gym", "independent_coach", "sports_facility", "nutritionist"].includes(org.type)) notFound();
  const since = new Date(new Date().getTime() - 30 * 86_400_000).toISOString();
  const [{ data: rows }, { data: members }] = await Promise.all([
    supabase.from("member_checkins").select("id,member_id,checked_in_at,was_expired").eq("organization_id", id).gte("checked_in_at", since).order("checked_in_at", { ascending: false }).limit(2000),
    supabase.from("org_members").select("id,full_name").eq("organization_id", id).limit(1000),
  ]);
  const name = new Map((members ?? []).map((m) => [m.id, m.full_name]));
  const list = rows ?? [];
  const todayKey = fmt(new Date().toISOString(), { dateStyle: "short" });
  const today = list.filter((r) => fmt(r.checked_in_at, { dateStyle: "short" }) === todayKey);
  const perMember = new Map<string, number>();
  for (const r of list) perMember.set(r.member_id, (perMember.get(r.member_id) ?? 0) + 1);
  const top = [...perMember.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <Link href={`/dashboard/${id}/members`} className="text-sm text-muted underline">← الأعضاء والاشتراكات</Link>
      <h1 className="text-2xl font-extrabold">سجل الحضور · {org.name_ar}</h1>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className={box}><p className="text-3xl font-extrabold text-accent">{today.length}</p><p className="text-xs text-muted">حضور اليوم</p></div>
        <div className={box}><p className="text-3xl font-extrabold text-accent">{list.length}</p><p className="text-xs text-muted">آخر 30 يوم</p></div>
      </div>
      <section><h2 className="mb-3 text-lg font-bold">حضور اليوم</h2>
        <ul className="space-y-2">{today.map((r) => (
          <li key={r.id} className={`${box} flex items-center justify-between text-sm`}>
            <span className="font-semibold">{name.get(r.member_id) ?? "عضو محذوف"}</span>
            <span className="text-muted">{fmt(r.checked_in_at, { timeStyle: "short" })}{r.was_expired && <span className="mr-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">اشتراك منتهي</span>}</span>
          </li>))}
          {today.length === 0 && <li className="text-sm text-muted">ما في حضور اليوم بعد.</li>}</ul></section>
      <section><h2 className="mb-3 text-lg font-bold">الأكثر التزاماً (30 يوم)</h2>
        <ul className="space-y-2">{top.map(([mid, n]) => (
          <li key={mid} className={`${box} flex justify-between text-sm`}><span>{name.get(mid) ?? "عضو محذوف"}</span><span className="text-muted">{n} مرة</span></li>))}
          {top.length === 0 && <li className="text-sm text-muted">لا توجد بيانات.</li>}</ul></section>
    </div>
  );
}
