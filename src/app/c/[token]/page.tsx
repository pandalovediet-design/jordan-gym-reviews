import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dateAr } from "@/lib/format";

export const metadata: Metadata = { title: "تسجيل حضور", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Staff scans a member's QR: records attendance and shows whether the subscription is active. */
export default async function CheckIn({ params }: PageProps<"/c/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=${encodeURIComponent(`/c/${token}`)}`);
  const { data, error } = await supabase.rpc("record_checkin", { p_token: token });
  const r = data?.[0];
  if (error || !r) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-5xl">⛔</p>
        <h1 className="mt-4 text-2xl font-extrabold">ما قدرنا نسجّل الحضور</h1>
        <p className="mt-2 text-muted">الـQR غير صالح، أو حسابك ما إله صلاحية على هالنادي.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-accent underline">لوحة التحكم</Link>
      </div>
    );
  }
  const left = r.days_left;
  const tone = r.expired ? "bg-red-500/15 ring-red-400/60" : left <= 7 ? "bg-yellow-400/15 ring-yellow-300/60" : "bg-green-500/15 ring-green-400/60";
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className={`rounded-3xl p-8 ring-2 ${tone}`}>
        <p className="text-6xl">{r.expired ? "🔴" : left <= 7 ? "🟡" : "🟢"}</p>
        <h1 className="mt-4 text-3xl font-extrabold">{r.member_name}</h1>
        <p className="mt-1 text-sm text-muted">{r.org_name}</p>
        <p className="mt-5 text-xl font-bold">
          {r.expired ? `اشتراكه منتهي منذ ${Math.abs(left)} يوم` : left === 0 ? "ينتهي اشتراكه اليوم" : `اشتراك فعّال، باقي ${left} يوم`}
        </p>
        <p className="mt-1 text-sm text-muted">ينتهي {dateAr(r.ends_on)}</p>
        <p className="mt-5 text-sm">{r.duplicate ? "سُجّل حضوره قبل قليل، ما انعدّ مرة ثانية." : "✅ تم تسجيل الحضور"}</p>
        {r.expired && <p className="mt-3 rounded-xl bg-red-500/20 p-3 text-sm font-bold text-red-200">تنبيه: لازم يجدد اشتراكه</p>}
      </div>
      <Link href="/dashboard" className="mt-6 inline-block text-sm text-muted underline">لوحة التحكم</Link>
    </div>
  );
}
