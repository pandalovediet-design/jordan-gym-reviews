import { baseUrl } from "@/lib/base-url";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { PageView, TrackedLink } from "@/components/Track";
import { InquiryForm } from "@/components/PublicForms";
import { sendInquiry } from "./actions";
import { getOrgBySlug } from "@/lib/queries";
import { BILLING_LABEL, ORG_TYPE_LABEL, WEEKDAYS, dateAr, hhmm, jod, publicMediaUrl, waNumber } from "@/lib/format";

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

export default async function OrgPage({ params }: PageProps<"/g/[slug]">) {
  const { slug } = await params;
  const d = await load(decodeURIComponent(slug));
  if (!d) notFound();
  const { org, hours, services, media, offers, products } = d;
  const wa = waNumber(org.whatsapp);
  const msg = encodeURIComponent(`مرحبا، شفت ${org.name_ar} على Jordan Gym Reviews وبدي أستفسر.`);
  const card = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
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
    openingHoursSpecification: hours.filter((h) => !h.is_closed && h.opens_at && h.closes_at).map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][h.weekday],
      opens: hhmm(h.opens_at), closes: hhmm(h.closes_at),
    })),
    makesOffer: services.filter((s) => s.price_jod != null).slice(0, 20).map((s) => ({
      "@type": "Offer", name: s.name_ar, price: s.price_jod, priceCurrency: "JOD",
    })),
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageView orgId={org.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, "\\u003c") }} />
      <p className="text-sm text-muted">{ORG_TYPE_LABEL[org.type]}{org.verified_at && <span className="text-accent"> · ✓ موثّق</span>}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{org.name_ar}</h1>
      <p className="mt-1 text-muted">{[org.address, org.area, org.city].filter(Boolean).join("، ")}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        {wa && <TrackedLink orgId={org.id} event="whatsapp_click" external href={`https://wa.me/${wa}?text=${msg}`} className="rounded-xl bg-accent px-5 py-2.5 font-bold text-accent-foreground">واتساب</TrackedLink>}
        {org.phone && <TrackedLink orgId={org.id} event="phone_click" href={`tel:${org.phone}`} className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">اتصال</TrackedLink>}
        {org.latitude != null && org.longitude != null && (
          <a href={`https://www.google.com/maps?q=${org.latitude},${org.longitude}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-surface px-5 py-2.5 ring-1 ring-white/10">الموقع على الخريطة</a>
        )}
      </div>

      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.id} src={publicMediaUrl(m.storage_path)} alt={m.alt_text ?? org.name_ar} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
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

      {offers.length > 0 && (
        <section className="mt-8"><h2 className="mb-3 text-xl font-bold">العروض</h2>
          <div className="grid gap-3 sm:grid-cols-2">{offers.map((o) => (
            <div key={o.id} className={card}><h3 className="font-bold text-accent">{o.kind === "course" ? "🎓 " : ""}{o.title_ar}</h3>
              {o.description_ar && <p className="text-sm">{o.description_ar}</p>}
              <p className="mt-1 text-xs text-muted">{o.offer_price_jod != null && `${jod(o.offer_price_jod)} · `}{o.discount_percent != null && `خصم ${o.discount_percent}% · `}حتى {dateAr(o.ends_at)}</p></div>))}</div></section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section><h2 className="mb-3 text-xl font-bold">الأسعار والخدمات</h2>
          {services.length === 0 ? <p className="text-muted">لم تُضف الأسعار بعد.</p> : (
            <ul className="space-y-2">{services.map((s) => (
              <li key={s.id} className={`${card} flex items-start justify-between gap-4`}>
                <div><p className="font-semibold">{s.name_ar}</p>{s.description_ar && <p className="text-sm text-muted">{s.description_ar}</p>}</div>
                <p className="shrink-0 text-accent">{jod(s.price_jod)}{s.billing_period && <span className="text-xs text-muted"> {BILLING_LABEL[s.billing_period]}</span>}</p>
              </li>))}</ul>)}
        </section>
        <section><h2 className="mb-3 text-xl font-bold">ساعات الدوام</h2>
          {hours.length === 0 ? <p className="text-muted">غير محدد.</p> : (
            <ul className={`${card} space-y-1 text-sm`}>{hours.map((h) => (
              <li key={h.id} className="flex justify-between"><span>{WEEKDAYS[h.weekday]}</span>
                <span className="text-muted">{h.is_closed ? "مغلق" : `${hhmm(h.opens_at)} – ${hhmm(h.closes_at)}`}</span></li>))}</ul>)}
        </section>
      </div>

      {org.type === "store" && (
        <section className="mt-8"><h2 className="mb-3 text-xl font-bold">المنتجات</h2>
          {products.length === 0 ? <p className="text-muted">لا توجد منتجات منشورة.</p> : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>)}
        </section>
      )}

      <section className="mt-8"><InquiryForm action={sendInquiry.bind(null, org.id, org.slug)} /></section>
    </div>
  );
}
