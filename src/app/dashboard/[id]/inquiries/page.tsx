import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dateAr } from "@/lib/format";
import { setInquiryStatus } from "../../actions";

export const metadata: Metadata = { title: "الاستفسارات والإحصاءات", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function InquiriesAndStats({ params }: PageProps<"/dashboard/[id]/inquiries">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,name_ar").eq("id", id).maybeSingle();
  if (!org) notFound();
  const [{ data: inquiries }, { data: stats }] = await Promise.all([
    supabase.from("inquiries").select("*").eq("organization_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("analytics_events").select("event_type").eq("organization_id", id).limit(5000),
  ]);
  const count = (t: string) => (stats ?? []).filter((e) => e.event_type === t).length;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <Link href={`/dashboard/${id}`} className="text-sm text-muted underline">← {org.name_ar}</Link>
      <section><h2 className="mb-3 text-lg font-bold">الإحصاءات</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          {[["مشاهدات الصفحة", "page_view"], ["نقرات واتساب", "whatsapp_click"], ["نقرات الاتصال", "phone_click"], ["استفسارات", "inquiry"]].map(([l, t]) => (
            <div key={t} className={box}><p className="text-2xl font-extrabold text-accent">{count(t)}</p><p className="text-xs text-muted">{l}</p></div>))}</div></section>
      <section><h2 className="mb-3 text-lg font-bold">الاستفسارات</h2>
        <ul className="space-y-3">{(inquiries ?? []).map((q) => (
          <li key={q.id} className={box}><div className="flex justify-between text-sm"><span className="font-semibold">{q.sender_name}</span><span className="text-muted">{dateAr(q.created_at)}</span></div>
            <p className="mt-1 text-sm" dir="ltr">{q.sender_phone}</p><p className="mt-2 text-sm">{q.message}</p>
            <div className="mt-3 flex items-center gap-3 text-xs"><span className="rounded-full bg-white/10 px-2 py-0.5">{q.status === "new" ? "جديد" : q.status === "seen" ? "مقروء" : "مغلق"}</span>
              {q.status === "new" && <form action={setInquiryStatus.bind(null, id, q.id, "seen")}><button className="underline">تم الاطلاع</button></form>}
              {q.status !== "closed" && <form action={setInquiryStatus.bind(null, id, q.id, "closed")}><button className="underline">إغلاق</button></form>}</div></li>))}
          {(inquiries ?? []).length === 0 && <li className="text-sm text-muted">لا توجد استفسارات.</li>}</ul></section>
    </div>
  );
}
