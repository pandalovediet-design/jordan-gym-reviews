import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { missingForPublish } from "@/lib/completeness";
import { ORG_TYPE_LABEL, dateAr, isVerified, isoDaysFromNow, msAgo } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { ActionForm, field } from "@/components/Form";
import { saveFlashDeal } from "../../flash-actions";

export const metadata: Metadata = { title: "نظرة عامة", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const STATUS = { draft: "مسودة (غير ظاهرة للعامة)", pending: "بانتظار مراجعة الإدارة", published: "منشور", suspended: "موقوف" } as const;

export default async function Overview({ params }: PageProps<"/dashboard/[id]/overview">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,slug,name_ar,type,status,verified_at,verified_until").eq("id", id).maybeSingle();
  if (!org) notFound();
  const since30 = isoDaysFromNow(-30);
  const soon = isoDaysFromNow(7).slice(0, 10);
  const today = isoDaysFromNow(0).slice(0, 10);
  const [events, promo, missing, newInq, expiring, memberCount, offers, slots] = await Promise.all([
    supabase.from("analytics_events").select("event_type,created_at").eq("organization_id", id).gte("created_at", since30).limit(10000),
    supabase.from("org_promotions").select("featured_until").eq("organization_id", id).maybeSingle(),
    missingForPublish(supabase, id),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("organization_id", id).eq("status", "new"),
    supabase.from("org_members").select("id", { count: "exact", head: true }).eq("organization_id", id).gte("ends_on", today).lte("ends_on", soon),
    supabase.from("org_members").select("id", { count: "exact", head: true }).eq("organization_id", id).gte("ends_on", today),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("organization_id", id).eq("is_active", true).gte("ends_at", isoDaysFromNow(0)),
    supabase.from("flash_slots").select("*").eq("organization_id", id).gt("ends_at", isoDaysFromNow(0)).order("starts_at").limit(5),
  ]);
  const ev = events.data ?? [];
  const d7 = msAgo(7);
  const n = (t: string, only7 = false) => ev.filter((e) => e.event_type === t && (!only7 || +new Date(e.created_at) >= d7)).length;
  const featured = promo.data?.featured_until && +new Date(promo.data.featured_until) > msAgo(0) ? promo.data.featured_until : null;
  const base = await siteUrl();
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const showMembers = ["gym", "independent_coach", "sports_facility", "nutritionist"].includes(org.type);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link href="/dashboard" className="text-sm text-muted underline">← أنشطتي</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">{org.name_ar}</h1><p className="text-sm text-muted">{ORG_TYPE_LABEL[org.type]}{isVerified(org) && " · ✓ موثّق"}</p></div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{STATUS[org.status]}</span>
      </div>

      {org.status === "draft" && missing.length > 0 && (
        <div className={box}><p className="mb-2 font-bold">لازم تكمّل قبل الإرسال للمراجعة:</p>
          <ul className="list-disc space-y-1 pr-5 text-sm text-muted">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
          <Link href={`/dashboard/${id}`} className="mt-3 inline-block text-sm text-accent underline">أكمل البيانات</Link></div>
      )}
      {org.status === "published" && (
        <div className={`${box} space-y-3`}>
          <div>
            <p className="font-bold">رابط صفحتك</p>
            <p className="break-all text-sm text-accent" dir="ltr">{base}/g/{org.slug}</p>
            <Link href={`/g/${org.slug}`} className="mt-1 inline-block text-sm underline">فتح الصفحة العامة</Link>
          </div>
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4">
            <p className="font-bold">📲 خلّي الزوار يوصلولك بسهولة</p>
            <p className="mt-1 text-sm text-muted">نزّل رمز QR واطبعه عند المدخل أو حطه على الكاونتر — الزبون بمسحه وبوصل مباشرة لصفحتك على Jordan Gym Reviews.</p>
            <p className="mt-2 text-sm font-extrabold text-accent">زورونا ع جوردان جيم</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`/g/${org.slug}/qr?format=png&download=1`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">تنزيل QR — PNG</a>
              <a href={`/g/${org.slug}/qr?format=svg&download=1`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:border-accent">تنزيل للطباعة — SVG</a>
              <Link href={`/g/${org.slug}/qr`} target="_blank" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:border-accent">معاينة الرمز</Link>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">اختصارات سريعة</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { href: `/dashboard/${id}`, icon: "✏️", title: org.type === "gym" ? "إدارة النادي" : org.type === "sports_facility" ? "إدارة الملاعب والحجوزات" : org.type === "store" ? "إدارة المتجر والمنتجات" : org.type === "nutritionist" ? "إدارة خدمات التغذية" : org.type === "independent_coach" ? "إدارة التدريب والباقات" : org.type === "healthy_food" ? "إدارة الوجبات والباقات" : org.type === "sports_health" ? "إدارة الجلسات والعلاجات" : "تعديل صفحة النشاط", detail: org.type === "sports_facility" ? "الملاعب والأسعار والأوقات" : org.type === "store" ? "المنتجات والصور والتوفر" : org.type === "gym" ? "الاشتراكات والصور والخدمات" : "حدّث معلوماتك وأسعارك وصورك" },
            ...(showMembers ? [{ href: `/dashboard/${id}/members`, icon: "👥", title: org.type === "independent_coach" ? "العملاء والبرامج" : org.type === "nutritionist" ? "العملاء والخطط" : org.type === "sports_facility" ? "العملاء والاشتراكات" : "الأعضاء والاشتراكات", detail: "إضافة أعضاء ومتابعة الاشتراكات" }] : []),
            ...(showMembers ? [{ href: `/dashboard/${id}/attendance`, icon: "🗓️", title: "سجل الحضور", detail: "راجع سجلات حضور الأعضاء" }] : []),
            { href: `/dashboard/${id}/inquiries`, icon: "💬", title: "الرسائل والاستفسارات", detail: "تابع تواصل الزوار ورد عليهم" },
            { href: `/dashboard/${id}/stats`, icon: "📊", title: "أداء النشاط", detail: "المشاهدات ونقرات التواصل" },
            { href: `/dashboard/${id}/growth`, icon: "🚀", title: "أدوات النمو", detail: "روّج لنشاطك وزِد الوصول" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group flex min-h-28 flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <span className="text-2xl" aria-hidden="true">{item.icon}</span>
              <span>
                <span className="block font-bold group-hover:text-accent">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section><h2 className="mb-3 text-lg font-bold">آخر 7 أيام</h2>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {([["مشاهدات", "page_view"], ["واتساب", "whatsapp_click"], ["اتصال", "phone_click"], ["مسح QR", "qr_scan"]] as const).map(([l, t]) => (
            <div key={t} className={box}><p className="text-2xl font-extrabold text-accent">{n(t, true)}</p><p className="text-xs text-muted">{l}</p></div>))}
        </div>
        <p className="mt-2 text-xs text-muted">آخر 30 يوم: {n("page_view")} مشاهدة · {n("whatsapp_click")} واتساب · {n("phone_click")} اتصال · {n("qr_scan")} مسح QR</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href={`/dashboard/${id}/inquiries`} className={`${box} hover:ring-accent`}><p className="text-2xl font-extrabold text-accent">{newInq.count ?? 0}</p><p className="text-sm text-muted">استفسارات جديدة</p></Link>
        <Link href={`/dashboard/${id}`} className={`${box} hover:ring-accent`}><p className="text-2xl font-extrabold text-accent">{offers.count ?? 0}</p><p className="text-sm text-muted">عروض ودورات فعّالة</p></Link>
        {showMembers && <Link href={`/dashboard/${id}/members`} className={`${box} hover:ring-accent`}><p className="text-2xl font-extrabold text-accent">{memberCount.count ?? 0}</p><p className="text-sm text-muted">اشتراكات فعّالة ({expiring.count ?? 0} ينتهي خلال 7 أيام)</p></Link>}
        <div className={box}><p className="font-bold">التمييز بالبحث</p>
          <p className="mt-1 text-sm text-muted">{featured ? `فعّال حتى ${dateAr(featured)}` : "غير مفعّل. للتفعيل تواصل مع إدارة المنصة."}</p></div>
      </section>

      {(slots.data ?? []).map((sl) => (
        <section key={sl.id} className={`${box} space-y-3`}>
          <h2 className="font-bold">⚡ مساحة عرض فلاش</h2>
          <p className="text-xs text-muted">من {dateAr(sl.starts_at)} إلى {dateAr(sl.ends_at)}. اكتب عرضك ليظهر بالرئيسية خلال هالفترة.</p>
          <ActionForm action={saveFlashDeal.bind(null, id, sl.id)} submit="حفظ العرض">
            <input name="title_ar" required defaultValue={sl.title_ar ?? ""} placeholder="عنوان العرض" className={field} />
            <textarea name="description_ar" rows={2} defaultValue={sl.description_ar ?? ""} placeholder="تفاصيل قصيرة" className={field} />
            <div className="grid grid-cols-2 gap-3">
              <input name="discount_percent" type="number" min="1" max="90" defaultValue={sl.discount_percent ?? ""} placeholder="الخصم %" dir="ltr" className={field} />
              <input name="price_jod" type="number" step="0.01" min="0" defaultValue={sl.price_jod ?? ""} placeholder="سعر العرض (دينار)" dir="ltr" className={field} />
            </div>
          </ActionForm>
        </section>
      ))}
    </div>
  );
}
