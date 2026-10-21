import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createPublicClient } from "@/lib/supabase/public";
import { dateAr, waNumber } from "@/lib/format";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/me/[token]">): Promise<Metadata> {
  const { token } = await params;
  return { title: "عضويتي", robots: { index: false, follow: false }, manifest: `/me/${token}/manifest.webmanifest` };
}

export default async function MemberPage({ params }: PageProps<"/me/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const db = createPublicClient();
  const [{ data }, { data: programs }] = await Promise.all([
    db.rpc("get_member_by_token", { p_token: token }),
    db.rpc("get_member_programs", { p_token: token }),
  ]);
  const m = data?.[0];
  if (!m) notFound();
  const qr = await QRCode.toString(`${await siteUrl()}/c/${token}`, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#07211c", light: "#ffffff" } });
  const wa = waNumber(m.org_whatsapp);
  const left = m.days_left;
  const tone = left < 0 ? "text-red-300" : left <= 7 ? "text-yellow-300" : "text-accent";
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8">
      <div><p className="text-sm text-muted">{m.org_name}</p><h1 className="text-2xl font-extrabold">أهلاً {m.member_name}</h1></div>
      <section className={box}>
        <p className="text-sm text-muted">اشتراكك{m.plan_name ? ` · ${m.plan_name}` : ""}</p>
        <p className={`mt-1 text-xl font-bold ${tone}`}>{left < 0 ? `منتهي منذ ${Math.abs(left)} يوم` : left === 0 ? "ينتهي اليوم" : `فعّال، باقي ${left} يوم`}</p>
        <p className="text-sm text-muted">من {dateAr(m.starts_on)} إلى {dateAr(m.ends_on)}</p>
      </section>
      <section className={`${box} text-center`}>
        <p className="mb-3 text-sm font-semibold">QR الحضور الخاص فيك. وريه للموظف عند الدخول</p>
        <div className="mx-auto w-56 rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="mt-3 text-xs text-muted">لا تشاركه مع حدا، هو إلك لحالك.</p>
      </section>
      {(programs ?? []).map((p, i) => (
        <section key={i} className={box}>
          <p className="text-xs text-muted">{p.kind === "workout" ? "برنامج تمرين" : "نظام غذائي"} · {dateAr(p.created_at)}</p>
          <h2 className="mt-1 text-lg font-bold">{p.title}</h2>
          <div className="mt-3 whitespace-pre-line leading-8">{p.body}</div>
        </section>
      ))}
      {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`مرحباً، أنا ${m.member_name}`)}`} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-green-600 py-3 text-center font-bold text-white">راسل ناديك على واتساب</a>}
      <p className="text-center text-xs text-muted">ثبّت هالصفحة على جوالك: أندرويد «تثبيت»، آيفون: مشاركة ← «إضافة إلى الشاشة الرئيسية».</p>
    </div>
  );
}
