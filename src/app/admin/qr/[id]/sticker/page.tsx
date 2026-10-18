import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = { title: "ستكر QR", robots: { index: false } };

export default async function Sticker({ params }: PageProps<"/admin/qr/[id]/sticker">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) notFound();
  const { data: org } = await supabase.from("organizations").select("slug,name_ar,type,city,status").eq("id", id).maybeSingle();
  if (!org) notFound();
  const base = await siteUrl();
  const url = `${base}/q/${org.slug}`;
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 1, color: { dark: "#07211c", light: "#ffffff" } });
  const isTemp = /vercel\.app|localhost/.test(base);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 print:max-w-none print:p-0">
      <div className="space-y-3 print:hidden">
        <Link href="/admin" className="text-sm text-muted underline">← الإدارة</Link>
        <h1 className="text-2xl font-extrabold">ستكر QR: {org.name_ar}</h1>
        {isTemp && <p className="rounded-xl bg-yellow-400/15 p-3 text-sm text-yellow-200">تنبيه: الرابط الحالي مؤقت ({base}). هاد الستكر للتجربة فقط، لا تطبعه للنشاط قبل ربط الدومين النهائي.</p>}
        {org.status !== "published" && <p className="rounded-xl bg-red-400/15 p-3 text-sm text-red-200">النشاط غير منشور، الرابط ما رح يفتح الصفحة لحد ما تنشره.</p>}
        <p className="break-all text-sm text-muted" dir="ltr">{url}</p>
        <div className="flex flex-wrap gap-3">
          <PrintButton />
          <a href={`/admin/qr/${id}?format=svg`} className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">تنزيل SVG</a>
          <a href={`/admin/qr/${id}?format=png`} className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">تنزيل PNG</a>
        </div>
      </div>
      <div className="mx-auto w-[360px] rounded-3xl bg-[#07211c] p-8 text-center text-[#eef6f2] ring-1 ring-white/20 print:w-[10cm] print:ring-0" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <p className="text-sm text-[#b6f23a]">{ORG_TYPE_LABEL[org.type]} · {org.city}</p>
        <h2 className="mt-1 text-2xl font-extrabold">{org.name_ar}</h2>
        <div className="mx-auto mt-5 w-56 rounded-2xl bg-white p-3" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-5 text-lg font-bold">امسح لتشوف الأسعار والعروض</p>
        <p className="mt-1 text-xs text-[#9bb5ab]">Jordan <span className="text-[#b6f23a]">Gym</span> Reviews</p>
      </div>
    </div>
  );
}
