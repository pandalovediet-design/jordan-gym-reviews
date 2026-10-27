import Link from "next/link";
import QRCode from "qrcode";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { PrintPosterButton } from "@/components/PrintPosterButton";

export const metadata: Metadata = { title: "ملصق QR للنشاط", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function ActivityQr({ params }: PageProps<"/dashboard/[id]/qr">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireUser();
  const [{ data: org }, { data: auth }, { data: isAdmin }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name_ar,type,slug,status")
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
    supabase.rpc("is_platform_admin"),
  ]);

  if (!org || org.status !== "published" || !auth.user) notFound();

  // A public listing may be readable to any visitor, but its private tools
  // must only be available to a member of this organization or a platform admin.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!membership && !isAdmin) notFound();

  const base = await siteUrl();
  const publicUrl = `${base}/g/${org.slug}?utm_source=qr&utm_medium=print`;
  const qr = await QRCode.toDataURL(publicUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 720,
    color: { dark: "#111827", light: "#FFFFFF" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href={`/dashboard/${id}/overview`} className="text-sm text-muted underline">← لوحة النشاط</Link>
          <h1 className="mt-2 text-2xl font-extrabold">ملصق QR جاهز للطباعة</h1>
          <p className="mt-1 text-sm text-muted">اطبعه وعلّقه على باب النادي أو عند الاستقبال، ليصل الزوار إلى صفحتك على Jordan Gym Reviews.</p>
        </div>
        <a href={qr} download={`jordan-gym-reviews-${org.slug}-qr.png`} className="rounded-xl bg-accent px-4 py-2.5 font-bold text-accent-foreground">تنزيل QR كصورة</a>
      </div>

      <section className="poster mx-auto overflow-hidden rounded-3xl bg-[#101114] text-white shadow-2xl">
        <div className="relative border-b-4 border-[#e32636] px-6 py-8 text-center sm:px-12">
          <div className="absolute inset-x-0 top-0 h-2 bg-[#e32636]" />
          <p className="text-sm font-black tracking-[.22em] text-[#ff4655]">JORDAN</p>
          <p className="text-3xl font-black tracking-[.12em] sm:text-4xl">GYM REVIEWS</p>
          <p className="mt-2 text-sm text-white/65">دليلك للرياضة واللياقة في الأردن</p>
        </div>
        <div className="px-6 py-8 text-center sm:px-12 sm:py-10">
          <p className="text-lg font-bold text-[#ff5967]">أهلاً وسهلاً في</p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{org.name_ar}</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-8 text-white/80 sm:text-lg">امسح الرمز واكتشف تفاصيل النادي والأسعار والخدمات على Jordan Gym Reviews</p>
          <div className="mx-auto mt-7 w-fit rounded-3xl bg-white p-3 shadow-[0_0_0_5px_rgba(227,38,54,.28)] sm:p-4">
            {/* QR is generated from this activity's public profile URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`رمز QR لصفحة ${org.name_ar}`} className="h-52 w-52 sm:h-64 sm:w-64" />
          </div>
          <p className="mt-6 inline-flex rounded-full bg-[#e32636] px-6 py-3 text-base font-extrabold sm:text-lg">امسح الرمز لزيارتنا</p>
          <p className="mt-5 break-all text-xs text-white/50" dir="ltr">{base}/g/{org.slug}</p>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10 bg-white/[.04] text-center">
          <div className="px-2 py-4"><p className="text-lg">🏋️</p><p className="mt-1 text-xs font-bold sm:text-sm">اكتشف خدماتنا</p></div>
          <div className="border-x border-white/10 px-2 py-4"><p className="text-lg">📍</p><p className="mt-1 text-xs font-bold sm:text-sm">اعرف موقعنا</p></div>
          <div className="px-2 py-4"><p className="text-lg">⭐</p><p className="mt-1 text-xs font-bold sm:text-sm">قيّم تجربتك</p></div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="max-w-xl text-xs leading-6 text-muted">نصيحة: اطبع على ورق A4، واختبر مسح الرمز بهاتفك قبل تعليق الملصق. تأكد من أن صفحة النشاط منشورة.</p>
        <PrintPosterButton />
      </div>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white !important; color: black !important; }
          body * { visibility: hidden; }
          .poster, .poster * { visibility: visible; }
          .poster { position: absolute; inset: 0; width: 100%; margin: 0; border-radius: 0 !important; box-shadow: none !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}
