import { accessLabel } from "@/lib/facilities";
import { baseUrl } from "@/lib/base-url";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { PageView, TrackedLink } from "@/components/Track";
import { ReportForm } from "@/components/PublicForms";
import { sendReport } from "./actions";
import { getOrgBySlug } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { listVideos } from "@/lib/videos";
import { VideoCard } from "@/components/VideoCard";
import { BILLING_LABEL, DELIVERY_LABEL, GLOW_LABEL, ORG_TYPE_LABEL, WEEKDAYS, WOMEN_LABEL, ammanDate, dateAr, dayLabelAr, hhmm, isVerified, jod, publicMediaUrl, waNumber } from "@/lib/format";
import type { Tables } from "@/lib/database.types";
import { themeClass } from "@/lib/themes";
import { Gallery } from "@/components/Gallery";
import { OrgSectionNav } from "@/components/OrgSectionNav";

export const revalidate = 120;
const load = cache(getOrgBySlug);

export async function generateMetadata({ params }: PageProps<"/g/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await load(decodeURIComponent(slug)).catch(() => null);
  if (!d) return { title: "غير موجود" };
  return {
    title: d.org.name_ar,
    description: d.org.description_ar?.slice(0, 160) ?? `${ORG_TYPE_LABEL[d.org.type]} في ${d.org.city}`,
    alternates: { canonical: `/g/${d.org.slug}` },
    openGraph: {
      type: "website",
      locale: "ar_JO",
      title: d.org.name_ar,
      description: d.org.description_ar?.slice(0, 160) ?? `${ORG_TYPE_LABEL[d.org.type]} في ${d.org.city}`,
      images: [d.media[0] ? publicMediaUrl(d.media[0].storage_path) : "/og-default.png"],
    },
  };
}

const card = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";

type Data = NonNullable<Awaited<ReturnType<typeof getOrgBySlug>>>;
type BV = {
  id: string; name: string; isMain: boolean; city: string; area: string | null; address: string | null; phone: string | null; whatsapp: string | null;
  mapsHref: string | null; women_access: string; women_hours_note: string | null;
};

function Services({ items }: { items: Tables<"organization_services">[] }) {
  if (!items.length) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">{items.map((s) => (
      <li key={s.id} className="group relative overflow-hidden rounded-2xl bg-surface p-5 ring-1 ring-white/10 transition duration-200 hover:-translate-y-0.5 hover:ring-accent/60">
        <div className="absolute inset-y-0 start-0 w-1 bg-accent/70" />
        <div className="flex h-full items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold leading-6">{s.name_ar}</p>
            {s.description_ar && <p className="mt-1.5 text-sm leading-6 text-muted">{s.description_ar}</p>}
          </div>
          <div className="shrink-0 rounded-xl bg-accent/10 px-3 py-2 text-end ring-1 ring-accent/20">
            <p className="font-black text-accent">{jod(s.price_jod)}</p>
            {s.billing_period && <p className="mt-0.5 text-[11px] text-muted">{BILLING_LABEL[s.billing_period]}</p>}
          </div>
        </div>
      </li>))}</ul>
  );
}
function Hours({ items }: { items: Tables<"organization_hours">[] }) {
  if (!items.length) return <p className="text-sm text-muted">الدوام غير محدد.</p>;
  return (
    <ul className="overflow-hidden rounded-2xl bg-surface p-2 ring-1 ring-white/10">{items.map((h) => (
      <li key={h.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm even:bg-white/[0.025]">
        <span className="font-semibold">{WEEKDAYS[h.weekday]}</span>
        {h.is_closed
          ? <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">مغلق</span>
          : <span className="rounded-full bg-accent/10 px-3 py-1 font-semibold text-accent" dir="ltr">{hhmm(h.opens_at)} – {hhmm(h.closes_at)}</span>}
      </li>))}</ul>
  );
}
function Offers({ items }: { items: Tables<"offers">[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">{items.map((o) => (
      <article key={o.id} className="relative overflow-hidden rounded-2xl bg-[linear-gradient(125deg,rgba(212,255,0,.13),transparent_65%)] bg-surface p-5 ring-1 ring-accent/25">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="mb-2 inline-flex rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent">{o.kind === "course" ? "دورة تدريبية" : "عرض خاص"}</span>
            <h3 className="text-lg font-black leading-7">{o.title_ar}</h3>
          </div>
          {o.discount_percent != null && <span className="shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-black text-accent-foreground">خصم {o.discount_percent}%</span>}
        </div>
        {o.description_ar && <p className="mt-2 text-sm leading-6 text-muted">{o.description_ar}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          {o.offer_price_jod != null ? <p className="text-lg font-black text-accent">{jod(o.offer_price_jod)}</p> : <span />}
          <p className="text-xs text-muted">ساري حتى {dateAr(o.ends_at)}</p>
        </div>
      </article>))}</div>
  );
}
function Classes({ items }: { items: Tables<"org_classes">[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">{WEEKDAYS.map((day, i) => {
      const list = items.filter((c) => c.weekday === i);
      return list.length === 0 ? null : (
        <div key={day} className={card}><h3 className="mb-2 font-bold text-accent">{day}</h3>
          <ul className="space-y-1 text-sm">{list.map((c) => (
            <li key={c.id} className="flex justify-between gap-3"><span>{c.title_ar}{c.women_only && " 💗"}{c.note && <span className="text-muted"> · {c.note}</span>}</span>
              <span className="shrink-0 text-muted" dir="ltr">{hhmm(c.starts_at)}{c.ends_at ? `–${hhmm(c.ends_at)}` : ""}</span></li>))}</ul></div>);
    })}</div>
  );
}
type TrainerCard = {
  key: string; name: string; role: string | null; years: number | null; education: string | null; place: string | null;
  specialties: string | null; bio: string | null; photo: string | null; head: boolean; href: string | null; licensed?: boolean; wa?: string | null;
};
const splitTags = (v: string | null) => (v ?? "").split(/[,،]/).map((x) => x.trim()).filter(Boolean).slice(0, 8);
function Trainers({ items }: { items: TrainerCard[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((t) => (
      <article key={t.key} className="group flex flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-white/10 transition duration-200 hover:-translate-y-1 hover:ring-accent/50 hover:shadow-xl hover:shadow-black/15">
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-background/40">
          {t.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicMediaUrl(t.photo)} alt={t.name} loading="lazy" decoding="async" className="size-full object-cover transition duration-500 group-hover:scale-105" />
          ) : <div className="flex size-full items-center justify-center bg-[radial-gradient(ellipse_at_75%_20%,rgba(212,255,0,.22),transparent_48%),linear-gradient(135deg,#151a0b,#283313)] text-5xl">🏋️</div>}
          {(t.head || t.licensed) && (
            <div className="absolute start-3 top-3 flex flex-col items-start gap-2">
              {t.head && <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">⭐ المدرب الرئيسي</span>}
              {t.licensed && <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">✓ مرخّص</span>}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          {t.role && <span className="w-fit rounded-full bg-accent/15 px-3 py-0.5 text-xs font-bold text-accent">{t.role}</span>}
          <h3 className="text-xl font-black tracking-tight">{t.name}</h3>
          {t.years != null && <p className="text-sm text-muted">🏅 {t.years} سنة خبرة</p>}
          {(t.education || t.place) && <p className="text-sm text-muted">🎓 {[t.education, t.place].filter(Boolean).join(" — ")}</p>}
          {splitTags(t.specialties).length > 0 && (
            <div className="flex flex-wrap gap-1.5">{splitTags(t.specialties).map((x) => <span key={x} className="rounded-full bg-background/50 px-2.5 py-0.5 text-xs ring-1 ring-white/10">{x}</span>)}</div>)}
          {t.bio && <p className="line-clamp-4 whitespace-pre-line text-sm leading-6">{t.bio}</p>}
          {t.wa && waNumber(t.wa) && <a href={`https://wa.me/${waNumber(t.wa)}?text=${encodeURIComponent("مرحبا، شفت ملفك على GymJo وبدي أحجز استشارة")}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-accent/15 px-4 py-2 text-center text-sm font-bold text-accent ring-1 ring-accent/40">احجز استشارة واتساب</a>}
          {t.href && <Link href={t.href} className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-black text-accent-foreground transition hover:brightness-105">عرض الملف الشخصي</Link>}
        </div>
      </article>))}</div>
  );
}
function Menu({ items }: { items: Tables<"menu_items">[] }) {
  if (!items.length) return <p className="text-muted">القائمة قيد الإضافة.</p>;
  const sections = [...new Set(items.map((m) => m.section ?? "الوجبات"))];
  return (
    <div className="space-y-6">{sections.map((sec) => (
      <div key={sec}><h3 className="mb-2 text-lg font-bold text-accent">{sec}</h3>
        <div className="grid gap-3 sm:grid-cols-2">{items.filter((m) => (m.section ?? "الوجبات") === sec).map((m) => (
          <div key={m.id} className={`${card} flex gap-3 ${m.is_available ? "" : "opacity-60"}`}>
            {m.image_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={publicMediaUrl(m.image_path)} alt={m.name_ar} loading="lazy" decoding="async" className={`size-20 shrink-0 rounded-xl object-cover ${m.is_available ? "" : "grayscale"}`} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2"><h4 className="font-bold">{m.name_ar}</h4><span className="shrink-0 text-accent">{jod(m.price_jod)}</span></div>
              {!m.is_available && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">خلصت</span>}
              {m.description_ar && <p className="mt-1 text-sm text-muted">{m.description_ar}</p>}
              {(m.calories != null || m.protein_g != null) && (
                <p className="mt-2 text-xs text-muted">{[m.calories != null ? `🔥 ${m.calories} سعرة` : null, m.protein_g != null ? `💪 ${m.protein_g}غ بروتين` : null, m.carbs_g != null ? `${m.carbs_g}غ كارب` : null, m.fat_g != null ? `${m.fat_g}غ دهون` : null].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          </div>))}</div></div>))}</div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-8"><h2 className="mb-3 text-xl font-bold">{title}</h2>{children}</section>;
}
function Products({ items }: { items: Data["products"] }) {
  if (!items.length) return <p className="text-muted">لا توجد منتجات منشورة.</p>;
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}

export default async function OrgPage({ params }: PageProps<"/g/[slug]">) {
  const { slug } = await params;
  const d = await load(decodeURIComponent(slug));
  if (!d) notFound();
  const { org, hours, services, media, offers, products, classes, branches, trainers, glow, menu, coaches, coachGyms, coachProfile, slots } = d;
  const mainRow = branches.find((b) => b.is_main);
  const orgMaps = org.maps_url ?? (org.latitude != null && org.longitude != null ? `https://www.google.com/maps?q=${org.latitude},${org.longitude}` : null);
  const views: BV[] = [
    { id: mainRow?.id ?? "main", name: mainRow?.name_ar ?? "الفرع الرئيسي", isMain: true, city: org.city, area: org.area, address: org.address, phone: org.phone, whatsapp: org.whatsapp, mapsHref: orgMaps, women_access: org.women_access, women_hours_note: org.women_hours_note },
    ...branches.filter((b) => !b.is_main && b.city).map((b): BV => ({
      id: b.id, name: b.name_ar, isMain: false, city: b.city!, area: b.area, address: b.address, phone: b.phone ?? org.phone, whatsapp: b.whatsapp ?? org.whatsapp,
      mapsHref: b.maps_url ?? (b.latitude != null && b.longitude != null ? `https://www.google.com/maps?q=${b.latitude},${b.longitude}` : null),
      women_access: b.women_access, women_hours_note: b.women_hours_note,
    })),
  ];
  const multi = views.length > 1;
  const wa = waNumber(org.whatsapp);
  const msg = (extra = "") => encodeURIComponent(`مرحبا، شفت ${org.name_ar}${extra} على GymJo وبدي أستفسر.`);
  const trialMsg = encodeURIComponent(`مرحبا، شفت ${org.name_ar} على GymJo وبدي أحجز يوم تجريبي.`);
  const shareHref = `https://wa.me/?text=${encodeURIComponent(`${org.name_ar} — ${baseUrl()}/g/${org.slug}`)}`;
  const orgVideos = await listVideos({ orgId: org.id, limit: 12 });
  const reviewVideos = orgVideos.filter((x) => x.kind === "review");
  const reelVideos = orgVideos.filter((x) => x.kind === "reel");
  const category = org.category_id ? (await createPublicClient().from("org_categories").select("name_ar").eq("id", org.category_id).maybeSingle()).data?.name_ar : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": org.type === "store" ? "SportingGoodsStore" : org.type === "nutritionist" ? "HealthAndBeautyBusiness" : "SportsActivityLocation",
    name: org.name_ar,
    address: { "@type": "PostalAddress", addressLocality: org.city, streetAddress: org.address ?? undefined, addressCountry: "JO" },
    telephone: org.phone ?? undefined,
    description: org.description_ar?.slice(0, 300) ?? undefined,
    url: `${baseUrl()}/g/${org.slug}`,
    image: media.slice(0, 5).map((m) => publicMediaUrl(m.storage_path)),
    geo: org.latitude != null && org.longitude != null ? { "@type": "GeoCoordinates", latitude: org.latitude, longitude: org.longitude } : undefined,
    sameAs: [org.website, org.instagram ? `https://instagram.com/${org.instagram}` : null].filter(Boolean),
    openingHoursSpecification: hours.filter((h) => h.branch_id === views[0].id && !h.is_closed && h.opens_at && h.closes_at).map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][h.weekday],
      opens: hhmm(h.opens_at), closes: hhmm(h.closes_at),
    })),
    makesOffer: services.filter((s) => s.price_jod != null).slice(0, 20).map((s) => ({
      "@type": "Offer", name: s.name_ar, price: s.price_jod, priceCurrency: "JOD",
    })),
    department: multi ? views.slice(1).map((v) => ({
      "@type": "SportsActivityLocation", name: `${org.name_ar} — ${v.name}`,
      address: { "@type": "PostalAddress", addressLocality: v.city, streetAddress: v.address ?? undefined, addressCountry: "JO" },
    })) : undefined,
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: baseUrl() },
      { "@type": "ListItem", position: 2, name: ORG_TYPE_LABEL[org.type] },
      { "@type": "ListItem", position: 3, name: org.name_ar },
    ],
  };
  const showTrainers = org.type === "gym" || org.type === "sports_facility";
  const trainerCard = (t: Tables<"org_trainers">): TrainerCard => ({
    key: t.id, name: t.name_ar, role: t.title_ar, years: t.experience_years, education: t.education, place: t.education_place,
    specialties: t.specialties, bio: t.bio_ar, photo: t.photo_path, head: t.is_head, href: null });
  const partnerCard = (c: (typeof coaches)[number]): TrainerCard => ({
    key: `c-${c.coach_slug}`, name: c.name_ar, role: c.role_label ?? (c.partner_type === "nutritionist" ? "أخصائي تغذية" : null), years: c.experience_years, education: c.education, place: c.education_place,
    specialties: c.specialties, bio: c.bio_ar, photo: c.photo_path, head: false, href: `/g/${c.coach_slug}`, licensed: c.partner_type === "nutritionist" && c.verified, wa: c.whatsapp });
  const coachCards: TrainerCard[] = coaches.filter((c) => c.partner_type !== "nutritionist").map(partnerCard);
  const nutriCards: TrainerCard[] = coaches.filter((c) => c.partner_type === "nutritionist").map(partnerCard);
  const byHead = (xs: TrainerCard[]) => [...xs].sort((a, b) => Number(b.head) - Number(a.head));
  const allCards = byHead([...trainers.map(trainerCard), ...coachCards]);
  const shared = <T extends { branch_id: string | null }>(xs: T[]) => xs.filter((x) => x.branch_id == null);
  const own = <T extends { branch_id: string | null }>(xs: T[], id: string) => xs.filter((x) => x.branch_id === id);
  const sharedCards = byHead([...shared(trainers).map(trainerCard), ...coachCards]);
  const womenBanner = (v: BV) => (
    <>
      {v.women_access === "women_only" && <div className="mb-3 rounded-xl bg-pink-500 px-4 py-2 text-center font-bold text-white">💗 {WOMEN_LABEL.women_only} — خاص بالنساء</div>}
      {v.women_access === "women_hours" && (
        <div className="mb-3 rounded-xl bg-pink-500/15 px-4 py-2 text-sm text-pink-200 ring-1 ring-pink-400/40">💗 {WOMEN_LABEL.women_hours}{v.women_hours_note ? `: ${v.women_hours_note}` : ""}</div>
      )}
    </>
  );
  const contactButtons = (v: BV) => {
    const n = waNumber(v.whatsapp);
    const actionClass = "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:transition-none";
    return (
      <>
        {n && <TrackedLink orgId={org.id} event="whatsapp_click" external href={`https://wa.me/${n}?text=${msg(multi ? ` (${v.name})` : "")}`} className={`${actionClass} bg-accent font-bold text-accent-foreground`}>واتساب</TrackedLink>}
        {v.phone && <TrackedLink orgId={org.id} event="phone_click" href={`tel:${v.phone}`} className={`${actionClass} bg-surface ring-1 ring-white/10`}>اتصال</TrackedLink>}
        {v.mapsHref && <a href={v.mapsHref} target="_blank" rel="noopener noreferrer" className={`${actionClass} bg-surface ring-1 ring-white/10`}>الموقع على الخريطة</a>}
      </>
    );
  };
  const contact = (v: BV) => <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">{contactButtons(v)}</div>;

  return (
    <div className={`min-h-[70vh] ${themeClass(org.theme)}`}>
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <PageView orgId={org.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, "\\u003c") }} />
      {!multi && womenBanner(views[0])}
      <div className="relative mb-7">
      <figure className="mb-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface shadow-2xl shadow-black/20">
        {media[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicMediaUrl(media[0].storage_path)} alt={media[0].alt_text ?? org.name_ar} fetchPriority="high" decoding="async" className="aspect-[16/9] w-full object-cover sm:aspect-[2.6/1]" />
        ) : (
          <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_80%_15%,rgba(212,255,0,.28),transparent_48%),linear-gradient(125deg,#10140a,#26320b_55%,#10140a)] sm:aspect-[2.6/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.svg" alt="" aria-hidden="true" className="size-28 rounded-3xl opacity-90 shadow-2xl sm:size-36" />
            <span className="absolute bottom-4 start-5 text-sm font-black tracking-[.2em] text-white/70 sm:bottom-6 sm:start-8 sm:text-base">GYMJO</span>
          </div>
        )}
      </figure>
      <div className={`relative z-10 mx-2 -mt-12 rounded-3xl border border-white/10 bg-surface p-5 shadow-2xl shadow-black/20 sm:mx-6 sm:-mt-16 sm:p-7 ${glow ? `glow glow-${glow}` : ""}`}>
      {glow && <p className="mb-1 text-sm font-bold">{GLOW_LABEL[glow]}</p>}
      <p className="text-sm text-muted">{category ?? ORG_TYPE_LABEL[org.type]}{isVerified(org) && <span className="text-accent"> · ✓ موثّق</span>}{multi && <span> · {views.length} فروع</span>}</p>
      {coachProfile && (coachProfile.education || coachProfile.experience_years != null) && (
        <p className="mt-1 text-sm text-muted">{[coachProfile.experience_years != null ? `🏅 ${coachProfile.experience_years} سنة خبرة` : null, coachProfile.education ? `🎓 ${[coachProfile.education, coachProfile.education_place].filter(Boolean).join(" — ")}` : null, coachProfile.session_mode ? { onsite: "حضوري", online: "أونلاين", both: "حضوري وأونلاين" }[coachProfile.session_mode] ?? null : null].filter(Boolean).join("  ·  ")}</p>)}
      {coachProfile?.certificates && <p className="mt-1 text-sm text-muted">📜 {coachProfile.certificates}</p>}
      {coachGyms.length > 0 && (
        <p className="mt-1 text-sm">{org.type === "nutritionist" ? "يتعاون مع: " : "يتدرب في: "}{coachGyms.map((g, i) => <span key={g.gym_slug}>{i > 0 && "، "}<Link href={`/g/${g.gym_slug}`} className="text-accent underline">{g.gym_name}</Link></span>)}</p>)}
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{org.name_ar}</h1>
      {org.description_ar && <p className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-7 text-muted sm:text-base">{org.description_ar}</p>}
      {!multi && <div className="mt-4 flex flex-wrap gap-2">{contactButtons(views[0])}</div>}
      {org.is_claimed === false && (
        <p className="mt-2 rounded-xl bg-white/5 p-3 text-sm text-muted ring-1 ring-white/10">
          بيانات أولية من مصادر عامة، وصاحب النادي لسا ما استلم صفحته. <Link href={`/claim/${org.slug}`} className="font-bold text-accent underline">هذا ناديي؟ استلم صفحتك مجاناً</Link>
        </p>
      )}
      {(org.has_mosque || org.no_music || org.has_kids_area || org.kids_friendly || org.kids_transport) && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {org.has_kids_area && <span className="rounded-full bg-amber-500/15 px-3 py-1 font-bold text-amber-300 ring-1 ring-amber-400/30">🧒 Kids Area</span>}
          {org.kids_friendly && <span className="rounded-full bg-amber-500/15 px-3 py-1 font-bold text-amber-300 ring-1 ring-amber-400/30">👶 مهيّأ للأطفال (5–12)</span>}
          {org.kids_transport && <span className="rounded-full bg-amber-500/15 px-3 py-1 font-bold text-amber-300 ring-1 ring-amber-400/30">🚌 مواصلات للأطفال{org.transport_note ? `: ${org.transport_note}` : ""}</span>}
          {org.has_mosque && <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-400/30">🕌 فيه مصلى</span>}
          {org.no_music && <span className="rounded-full bg-sky-500/15 px-3 py-1 font-bold text-sky-300 ring-1 ring-sky-400/30">🔇 بدون موسيقى</span>}
          <span className="text-xs text-muted">حسب صاحب النشاط</span>
        </p>
      )}
      {(org.accessibility ?? []).length > 0 && (
        <div className="mt-3 rounded-2xl bg-violet-500/10 p-4 text-sm ring-1 ring-violet-400/30">
          <p className="font-bold text-violet-200">♿ تهيئة لذوي الاحتياجات الخاصة <span className="text-xs font-normal text-muted">(حسب صاحب النشاط)</span></p>
          <ul className="mt-2 list-disc space-y-1 pr-5">{(org.accessibility ?? []).map((k: string) => <li key={k}>{accessLabel(k)}</li>)}</ul>
        </div>
      )}
      {!multi && <p className="mt-1 text-muted">{[org.address, org.area, org.city].filter(Boolean).join("، ")}</p>}
      </div>
      </div>
      {multi && (
        <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="فروع النشاط">
          {views.map((v) => <a key={v.id} href={`#b-${v.id}`} className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 ring-1 ring-white/10 transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none">{v.name} — {v.city}{v.women_access === "women_only" && " 💗"}</a>)}
        </nav>
      )}

      {!multi && <OrgSectionNav items={[
        ...(media.length > 1 ? [{ href: "#photos", label: "الصور" }] : []),
        ...(offers.length > 0 ? [{ href: "#offers", label: "العروض" }] : []),
        ...(services.length > 0 ? [{ href: "#prices", label: "الأسعار والخدمات" }] : []),
        ...(hours.length > 0 ? [{ href: "#hours", label: "الدوام" }] : []),
        ...(org.type === "sports_facility" && slots.length > 0 ? [{ href: "#slots", label: "المواعيد" }] : []),
        ...(classes.length > 0 ? [{ href: "#classes", label: "الحصص" }] : []),
        ...(showTrainers && allCards.length > 0 ? [{ href: "#trainers", label: "المدربون" }] : []),
        ...(nutriCards.length > 0 ? [{ href: "#nutrition", label: "التغذية" }] : []),
        ...(org.type === "store" && products.length > 0 ? [{ href: "#products", label: "المنتجات" }] : []),
      ]} />}
      <div className="mt-5 flex flex-wrap gap-2 sm:gap-3 [&>a]:min-h-11 [&>a]:inline-flex [&>a]:items-center [&>a]:justify-center [&>a]:text-center">
        {wa && org.free_trial_note && <TrackedLink orgId={org.id} event="whatsapp_click" external href={`https://wa.me/${wa}?text=${trialMsg}`} className="rounded-xl bg-accent/15 px-5 py-2.5 font-bold text-accent ring-1 ring-accent/50">🎟 {org.free_trial_note}</TrackedLink>}
        <a href={shareHref} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">شارك على واتساب</a>
        <a href={`/g/${org.slug}/card`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">🖼 كرت للمنشور</a>
        <a href={`/g/${org.slug}/card?s=1`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">📱 كرت للستوري</a>
      </div>
      <details className="mt-3 w-fit rounded-xl bg-surface ring-1 ring-white/10 [&[open]]:p-4">
        <summary className="min-h-11 cursor-pointer list-none rounded-xl px-5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">📲 QR للمشاركة</summary>
        <div className="mt-3 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/g/${org.slug}/qr`} alt={`رمز QR لصفحة ${org.name_ar}`} width={208} height={208} loading="lazy" className="size-52 rounded-xl bg-white p-1" />
          <p className="max-w-52 text-center text-xs text-muted">امسحه بالكاميرا بيفتح صفحة {org.name_ar}.</p>
          <div className="flex gap-2 text-sm">
            <a href={`/g/${org.slug}/qr?format=png&download=1`} className="rounded-lg bg-accent px-4 py-2 font-bold text-accent-foreground">تنزيل PNG</a>
            <a href={`/g/${org.slug}/qr?download=1`} className="rounded-lg bg-white/10 px-4 py-2">SVG</a>
          </div>
        </div>
      </details>

      {reviewVideos.length > 0 && (
        <section className="mt-6 rounded-2xl bg-accent/10 p-4 ring-1 ring-accent/30">
          <h2 className="mb-1 text-lg font-bold">🎬 مراجعة عبد الكريم</h2>
          <p className="mb-3 text-xs text-muted">زرنا المكان وصوّرنا رأينا. عبد الكريم صاحب نادي، والمراجعة بدون مقابل ما لم يُذكر غير ذلك.</p>
          <div className="grid max-w-md grid-cols-2 gap-4">{reviewVideos.map((x) => <VideoCard key={x.id} v={x} showOrg={false} />)}</div>
        </section>
      )}

      {media.length > 1 && <section id="photos" className="scroll-mt-48"><Gallery start={1} items={media.map((m) => ({ src: publicMediaUrl(m.storage_path), alt: m.alt_text ?? org.name_ar, caption: m.alt_text }))} /></section>}

      {org.video_url && (() => {
        const yt = org.video_url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        return (
          <Section title="🎬 جولة بالمكان">
            {yt ? (
              <div className="aspect-video overflow-hidden rounded-2xl ring-1 ring-white/10">
                <iframe src={`https://www.youtube-nocookie.com/embed/${yt[1]}`} title={`جولة ${org.name_ar}`} loading="lazy" allowFullScreen className="size-full" />
              </div>
            ) : <a href={org.video_url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-white/10 hover:ring-accent">شاهد الفيديو ↗</a>}
          </Section>
        );
      })()}
      {reelVideos.length > 0 && (
        <Section title="🎬 فيديوهات">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{reelVideos.map((x) => <VideoCard key={x.id} v={x} showOrg={false} />)}</div>
        </Section>
      )}
      {org.type === "nutritionist" && (
        <div className="mt-6 rounded-2xl bg-surface p-4 text-sm ring-1 ring-white/10">
          {org.license_number && <p>الترخيص: <span dir="ltr">{org.license_number}</span>{org.license_authority && ` — ${org.license_authority}`}{!isVerified(org) && <span className="text-muted"> (لم تتم مراجعته بعد)</span>}</p>}
          <p className="mt-1 text-muted">المعلومات المعروضة لأغراض التعريف فقط وليست بديلاً عن الاستشارة الطبية.</p>
        </div>
      )}


      {org.type === "healthy_food" && (
        <>
          {(org.delivery_modes.length > 0 || org.delivery_areas) && (
            <div className={`${card} mt-6`}>
              <h2 className="mb-2 font-bold">طرق التوصيل</h2>
              <div className="flex flex-wrap gap-2 text-sm">{org.delivery_modes.map((m) => <span key={m} className="rounded-full bg-accent/15 px-3 py-1 text-accent">{DELIVERY_LABEL[m as keyof typeof DELIVERY_LABEL] ?? m}</span>)}</div>
              {org.delivery_areas && <p className="mt-2 text-sm text-muted">مناطق التوصيل: {org.delivery_areas}</p>}
            </div>
          )}
          <Section title="قائمة الوجبات"><Menu items={menu} /></Section>
        </>
      )}

      {!multi ? (
        <>
          {offers.length > 0 && <div id="offers" className="scroll-mt-48"><Section title="العروض"><Offers items={offers} /></Section></div>}
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            {services.length > 0 && <section id="prices" className="scroll-mt-48"><h2 className="mb-3 text-xl font-bold">الأسعار والخدمات</h2><Services items={services} /></section>}
            {hours.length > 0 && <section id="hours" className="scroll-mt-48"><h2 className="mb-3 text-xl font-bold">ساعات الدوام</h2><Hours items={hours} /></section>}
          </div>
          {org.type === "sports_facility" && slots.length > 0 && (
            <div id="slots" className="scroll-mt-48"><Section title="المواعيد المتاحة">
              <div className="space-y-4">{[...new Set(slots.map((x) => x.slot_date))].map((day) => (
                <div key={day}><h3 className="mb-2 font-bold text-accent">{day === ammanDate(0) ? "اليوم" : dayLabelAr(day)}</h3>
                  <ul className="flex flex-wrap gap-2">{slots.filter((x) => x.slot_date === day).map((x) => {
                    const label = `${hhmm(x.starts_at)}–${hhmm(x.ends_at)}`;
                    return x.status === "booked"
                      ? <li key={x.id} className="rounded-xl bg-red-400/15 px-3 py-1.5 text-sm text-red-200 line-through" dir="ltr">{label} · محجوز</li>
                      : <li key={x.id}>{wa
                        ? <TrackedLink orgId={org.id} event="whatsapp_click" external href={`https://wa.me/${wa}?text=${encodeURIComponent(`مرحبا، بدي أحجز ${org.name_ar} يوم ${dayLabelAr(day)} الساعة ${label}`)}`} className="block rounded-xl bg-accent/15 px-3 py-1.5 text-sm font-bold text-accent ring-1 ring-accent/40" >{label} · متاح</TrackedLink>
                        : <span className="block rounded-xl bg-accent/15 px-3 py-1.5 text-sm font-bold text-accent" dir="ltr">{label} · متاح</span>}</li>;
                  })}</ul></div>))}</div>
              <p className="mt-3 text-xs text-muted">اضغط على الوقت المتاح لتحجز عبر واتساب. الحجز بيتأكد من صاحب الملعب.</p>
            </Section></div>
          )}
          {classes.length > 0 && <div id="classes" className="scroll-mt-48"><Section title="جدول الحصص"><Classes items={classes} /></Section></div>}
          {showTrainers && allCards.length > 0 && <div id="trainers" className="scroll-mt-48"><Section title="المدربون"><Trainers items={allCards} /></Section></div>}
          {nutriCards.length > 0 && <div id="nutrition" className="scroll-mt-48"><Section title="🥗 أخصائيو التغذية الشركاء"><Trainers items={nutriCards} /></Section></div>}
          {org.type === "store" && <div id="products" className="scroll-mt-48"><Section title="المنتجات"><Products items={products} /></Section></div>}
        </>
      ) : (
        <>
          {(shared(offers).length > 0 || shared(services).length > 0 || shared(classes).length > 0 || shared(products).length > 0) && (
            <div className="mt-8 rounded-2xl border border-white/10 p-5">
              <h2 className="text-xl font-bold">لكل الفروع</h2>
              {shared(offers).length > 0 && <Section title="العروض"><Offers items={shared(offers)} /></Section>}
              {shared(services).length > 0 && <Section title="الأسعار والخدمات"><Services items={shared(services)} /></Section>}
              {shared(classes).length > 0 && <Section title="جدول الحصص"><Classes items={shared(classes)} /></Section>}
              {org.type === "store" && shared(products).length > 0 && <Section title="المنتجات"><Products items={shared(products)} /></Section>}
            </div>
          )}
          {showTrainers && sharedCards.length > 0 && <Section title="المدربون"><Trainers items={sharedCards} /></Section>}
          {nutriCards.length > 0 && <Section title="🥗 أخصائيو التغذية الشركاء"><Trainers items={nutriCards} /></Section>}
          {views.map((v) => {
            const o = own(offers, v.id), sv = own(services, v.id), cl = own(classes, v.id), pr = own(products, v.id), tr = own(trainers, v.id);
            return (
              <section key={v.id} id={`b-${v.id}`} className="mt-10 scroll-mt-6 rounded-2xl bg-surface/50 p-5 ring-1 ring-white/10">
                {womenBanner(v)}
                <h2 className="text-2xl font-extrabold">{v.name}</h2>
                <p className="mt-1 text-muted">{[v.address, v.area, v.city].filter(Boolean).join("، ")}</p>
                {contact(v)}
                {o.length > 0 && <Section title="عروض الفرع"><Offers items={o} /></Section>}
                <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
                  <div>{sv.length > 0 && <><h3 className="mb-3 text-lg font-bold">الأسعار والخدمات</h3><Services items={sv} /></>}</div>
                  <div><h3 className="mb-3 text-lg font-bold">ساعات الدوام</h3><Hours items={hours.filter((h) => h.branch_id === v.id)} /></div>
                </div>
                {cl.length > 0 && <Section title="جدول الحصص"><Classes items={cl} /></Section>}
                {showTrainers && tr.length > 0 && <Section title="مدربو الفرع"><Trainers items={byHead(tr.map(trainerCard))} /></Section>}
                {org.type === "store" && pr.length > 0 && <Section title="منتجات الفرع"><Products items={pr} /></Section>}
              </section>
            );
          })}
        </>
      )}

      <section aria-label="الإبلاغ عن مشكلة" className="mt-8"><ReportForm action={sendReport.bind(null, org.id, org.slug)} /></section>
    </div>
      {!multi && (waNumber(views[0].whatsapp) || views[0].phone || views[0].mapsHref) && (
        <>
          {/* Phone: contact actions always within thumb reach. */}
          <div className="h-20 md:hidden" aria-hidden />
          <nav aria-label="تواصل سريع" className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-white/10 bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
            {waNumber(views[0].whatsapp) && <TrackedLink orgId={org.id} event="whatsapp_click" external href={`https://wa.me/${waNumber(views[0].whatsapp)}?text=${msg("")}`} className="flex-1 rounded-xl bg-accent py-3 text-center font-bold text-accent-foreground">واتساب</TrackedLink>}
            {views[0].phone && <TrackedLink orgId={org.id} event="phone_click" href={`tel:${views[0].phone}`} className="flex-1 rounded-xl bg-surface py-3 text-center font-bold ring-1 ring-white/10">اتصال</TrackedLink>}
            {views[0].mapsHref && <a href={views[0].mapsHref} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl bg-surface py-3 text-center font-bold ring-1 ring-white/10">الموقع</a>}
          </nav>
        </>
      )}
    </div>
  );
}
