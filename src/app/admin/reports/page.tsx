import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { REPORT_REASON, dateAr } from "@/lib/format";
import { setReportHandled } from "../actions";

export const metadata: Metadata = { title: "البلاغات", robots: { index: false } };

export default async function ReportsAdmin() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("listing_reports").select("*,organizations(id,slug,name_ar)").order("status").order("created_at", { ascending: false }).limit(200);
  const list = data ?? [];
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">البلاغات ({list.filter((r) => r.status === "new").length} جديد)</h1>
      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className={`${box} flex flex-wrap items-start justify-between gap-3 ${r.status === "handled" ? "opacity-60" : ""}`}>
            <div className="min-w-0 space-y-1">
              <p className="font-semibold">{r.organizations?.name_ar ?? "نشاط محذوف"} <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-200">{REPORT_REASON[r.reason as keyof typeof REPORT_REASON]}</span></p>
              {r.details && <p className="text-sm">{r.details}</p>}
              <p className="text-xs text-muted">{dateAr(r.created_at)}{r.contact && <> · للتواصل: <span dir="ltr">{r.contact}</span></>}</p>
            </div>
            <div className="flex gap-2 text-xs">
              {r.organizations && <Link href={`/g/${r.organizations.slug}`} className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">الصفحة</Link>}
              {r.organizations && <Link href={`/admin/orgs?q=${encodeURIComponent(r.organizations.name_ar)}`} className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">إدارة</Link>}
              <form action={setReportHandled.bind(null, r.id, r.status !== "handled")}><button className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">{r.status === "handled" ? "إعادة فتح" : "تم الحل"}</button></form>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted">لا توجد بلاغات.</li>}
      </ul>
    </div>
  );
}
