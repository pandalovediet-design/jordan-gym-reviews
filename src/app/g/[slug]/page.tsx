import { baseUrl } from "@/lib/base-url";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { PageView, TrackedLink } from "@/components/Track";
import { InquiryForm } from "@/components/PublicForms";
import { sendInquiry } from "./actions";
import { getOrgBySlug } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { BILLING_LABEL, ORG_TYPE_LABEL, WEEKDAYS, WOMEN_LABEL, dateAr, hhmm, jod, publicMediaUrl, waNumber } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

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
    <ul className="space-y-2">{items.map((s) => (
      <li key={s.id} className={`${card} flex items-start justify-between gap-4`}>
        <div><p className="font-semibold">{s.name_ar}</p>{s.description_ar && <p className="text-sm text-muted">{s.description_ar}</p>}</div>
        <p className="shrink-0 text-accent">{jod(s.price_jod)}{s.billing_period && <span className="text-xs text-muted"> {BILLING_LABEL[s.billing_period]}</span>}</p>
      </li>))}</ul>
  );
}
function Hours({ items }: { items: Tables<"organization_hours">[] }) {
  if (!items.length) return <p className="text-sm text-muted">الدوام غير محدد.</p>;
  return (
    <ul className={`${card} space-y-1 text-sm`}>{items.map((h) => (
      <li key={h.id} className="flex justify-between"><span>{WEEKDAYS[h.weekday]}</span>
        <span className="text-muted">{h.is_closed ? "مغلق" : `${hhmm(h.opens_at)} – ${hhmm(h.closes_at)}`}</span></li>))}</ul>
  );
}
function Offers({ items }: { items: Tables<"offers">[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">{items.map((o) => (
      <div key={o.id} className={card}><h3 className="font-bold text-accent">{o.kind === "course" ? "🎓 " : ""}{o.title_ar}</h3>
        {o.description_ar && <p className="text-sm">{o.description_ar}</p>}
        <p className="mt-1 text-xs text-muted">{o.offer_price_jod != null && `${jod(o.offer_price_jod)} · `}{o.discount_percent != null && `خصم ${o.discount_percent}% · `}حتى {dateAr(o.ends_at)}</p></div>))}</div>
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
function Trainers({ items }: { items: Tables<"org_trainers">[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">{items.map((t) => (
      <div key={t.id} className={`${card} flex gap-4`}>
        {t.photo_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicMediaUrl(t.photo_path)} alt={t.name_ar} loading="lazy" className="size-20 shrink-0 rounded-full object-cover" />
        ) : <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-background/40 text-2xl">🏋️</div>}
        <div className="min-w-0">
          <h3 className="font-bold">{t.name_ar}</h3>
          <p className="text-sm text-accent">{[t.title_ar, t.experience_years != null ? `${t.experience_years} سنة خبرة` : null].filter(Boolean).join(" · ")}</p>
          {t.specialties && <p className="mt-1 text-xs text-muted">{t.specialties}</p>}
          {t.bio_ar && <p className="mt-2 whitespace-pre-line text-sm leading-6">{t.bio_ar}</p>}
        </div>
      </div>))}</div>
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
  const { org, hours, services, media, offers, products, classes, branches, trainers } = d;
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
  const msg = (extra = "") => encodeURIComponent(`مرحبا، شفت ${org.name_ar}${extra} على Jordan Gym Reviews وبدي أستفسر.`);
  const trialMsg = encodeURIComponent(`مرحبا، شفت ${org.name_ar} على Jordan Gym Reviews وبدي أحجز يوم تجريبي.`);
  const shareHref = `https://wa.me/?text=${encodeURIComponent(`${org.name_ar} — ${baseUrl()}/g/${org.slug}`)}`;
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
  const shared = <T extends { branch_id: string | null }>(xs: T[]) => xs.filter((x) => x.branch_id == null);
  const own = <T extends { branch_id: string | null }>(xs: T[], id: string) => xs.filter((x) => x.branch_id === id);
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
    return (
      <>
        {n && <TrackedLink orgId={org.id} event="whatsapp_click" external href={`https://wa.me/${n}?text=${msg(multi ? ` (${v.name})` : "")}`} className="rounded-xl bg-accent px-5 py-2.5 font-bold text-accent-foreground">واتساب</TrackedLink>}
        {v.phone && <TrackedLink orgId={org.id} event="phone_click" href={`tel:${v.phone}`} className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">اتصال</TrackedLink>}
        {v.mapsHref && <a href={v.mapsHref} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">الموقع على الخريطة</a>}
      </>
    );
  };
  const contact = (v: BV) => <div className="mt-3 flex flex-wrap gap-3">{contactButtons(v)}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageView orgId={org.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, "\\u003c") }} />
      {!multi && womenBanner(views[0])}
      <p className="text-sm text-muted">{category ?? ORG_TYPE_LABEL[org.type]}{org.verified_at && <span className="text-accent"> · ✓ موثّق</span>}{multi && <span> · {views.length} فروع</span>}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{org.name_ar}</h1>
      {!multi && <p className="mt-1 text-muted">{[org.address, org.area, org.city].filter(Boolean).join("، ")}</p>}
      {multi && (
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {views.map((v) => <a key={v.id} href={`#b-${v.id}`} className="rounded-full bg-surface px-4 py-1.5 ring-1 ring-white/10 hover:ring-accent">{v.name} — {v.city}{v.women_access === "women_only" && " 💗"}</a>)}
        </nav>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!multi && contactButtons(views[0])}
        {wa && org.free_trial_note && <TrackedLink orgId={org.id} event="whatsapp_click" external href={`https://wa.me/${wa}?text=${trialMsg}`} className="rounded-xl bg-accent/15 px-5 py-2.5 font-bold text-accent ring-1 ring-accent/50">🎟 {org.free_trial_note}</TrackedLink>}
        <a href={shareHref} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">شارك على واتساب</a>
      </div>

      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <figure key={m.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicMediaUrl(m.storage_path)} alt={m.alt_text ?? org.name_ar} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
              {m.alt_text && <figcaption className="mt-1 px-1 text-sm text-muted">{m.alt_text}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {org.type === "nutritionist" && (
        <div className="mt-6 rounded-2xl bg-surface p-4 text-sm ring-1 ring-white/10">
          {org.license_number && <p>الترخيص: <span dir="ltr">{org.license_number}</span>{org.license_authority && ` — ${org.license_authority}`}{!org.verified_at && <span className="text-muted"> (لم تتم مراجعته بعد)</span>}</p>}
          <p className="mt-1 text-muted">المعلومات المعروضة لأغراض التعريف فقط وليست بديلاً عن الاستشارة الطبية.</p>
        </div>
      )}

      {org.description_ar && <p className="mt-6 whitespace-pre-line leading-8">{org.description_ar}</p>}

      {!multi ? (
        <>
          {offers.length > 0 && <Section title="العروض"><Offers items={offers} /></Section>}
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section><h2 className="mb-3 text-xl font-bold">الأسعار والخدمات</h2>
              {services.length === 0 ? <p className="text-muted">لم تُضف الأسعار بعد.</p> : <Services items={services} />}</section>
            <section><h2 className="mb-3 text-xl font-bold">ساعات الدوام</h2><Hours items={hours} /></section>
          </div>
          {classes.length > 0 && <Section title="جدول الحصص"><Classes items={classes} /></Section>}
          {showTrainers && trainers.length > 0 && <Section title="المدربون"><Trainers items={trainers} /></Section>}
          {org.type === "store" && <Section title="المنتجات"><Products items={products} /></Section>}
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
          {showTrainers && shared(trainers).length > 0 && <Section title="المدربون"><Trainers items={shared(trainers)} /></Section>}
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
                {showTrainers && tr.length > 0 && <Section title="مدربو الفرع"><Trainers items={tr} /></Section>}
                {org.type === "store" && pr.length > 0 && <Section title="منتجات الفرع"><Products items={pr} /></Section>}
              </section>
            );
          })}
        </>
      )}

      <section className="mt-8"><InquiryForm action={sendInquiry.bind(null, org.id, org.slug)} /></section>
    </div>
  );
}
