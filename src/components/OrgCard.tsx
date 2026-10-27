import Link from "next/link";
import { FavButton } from "@/components/Favorites";
import { GLOW_LABEL, ORG_TYPE_LABEL, WOMEN_LABEL, jod, publicMediaUrl, type GlowColor } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export function OrgCard({ org }: {
  org: { slug: string; name_ar: string; type: Enums<"org_type">; city: string; area: string | null; description_ar: string | null; verified_at: string | null; is_featured?: boolean;
    category_name?: string | null; free_trial_note?: string | null; min_price_jod?: number | null; distance_km?: number; glow_color?: GlowColor | null; open_now?: boolean | null; branch_count?: number; branch_women_only?: boolean; has_mosque?: boolean; no_music?: boolean; has_kids_area?: boolean; kids_friendly?: boolean; kids_transport?: boolean; accessibility?: string[]; women_access?: "none" | "women_only" | "women_hours";
    cover?: { storage_path: string; alt_text: string | null } | null };
}) {
  const facilities = facilityBadges(org);
  return (
    <article className={`relative rounded-3xl ${org.glow_color ? `glow glow-${org.glow_color}` : ""}`}>
      <Link
        href={`/g/${org.slug}`}
        className={`group block h-full overflow-hidden rounded-3xl bg-surface shadow-lg shadow-black/10 ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none ${org.women_access === "women_only" ? "ring-pink-400/60" : "ring-white/10 hover:ring-blue-400/50"}`}
      >
        {org.women_access === "women_only" && <div className="bg-pink-600 px-4 py-1.5 text-center text-xs font-bold tracking-wide text-white">💗 {WOMEN_LABEL.women_only}</div>}
        {org.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicMediaUrl(org.cover.storage_path)} alt={org.cover.alt_text ?? org.name_ar} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none" />
        ) : (
          <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_25%_15%,rgba(54,120,246,.3),transparent_45%),linear-gradient(135deg,#243653,#111827)] text-sm text-muted"><span className="text-5xl opacity-70" aria-hidden="true">✦</span><span className="absolute bottom-3 right-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white">اكتشف المكان</span></div>
        )}
        <div className="p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{org.category_name ?? ORG_TYPE_LABEL[org.type]}</span>
            <span className="flex flex-wrap items-center gap-1.5">
              {org.women_access === "women_hours" && <span className="rounded-full bg-pink-500/15 px-2.5 py-1 font-bold text-pink-200 ring-1 ring-pink-400/30">{WOMEN_LABEL.women_hours}</span>}
              {org.is_featured && <span className="rounded-full bg-accent px-2.5 py-1 font-bold text-accent-foreground">مميّز</span>}
              {org.glow_color && <span className="rounded-full bg-black/30 px-2.5 py-1 font-bold text-foreground">{GLOW_LABEL[org.glow_color]}</span>}
              {org.verified_at && <span className="inline-flex items-center gap-1 font-bold text-accent"><span aria-hidden="true">✓</span> موثّق</span>}
            </span>
          </div>
          <h3 className="flex flex-wrap items-center gap-2 break-words text-lg font-extrabold tracking-tight transition-colors group-hover:text-cyan-100">
            {org.name_ar}
            {org.open_now === true && <span className="whitespace-nowrap rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30"><span aria-hidden="true">●</span> مفتوح هسا</span>}
            {org.open_now === false && <span className="whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-muted">مسكّر هسا</span>}
          </h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1 text-sm text-muted"><span aria-hidden="true">📍</span>{[org.area, org.city].filter(Boolean).join("، ")}</p>
          {org.description_ar && <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground/85">{org.description_ar}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {(org.branch_count ?? 1) > 1 && <span className="rounded-full bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">🏢 {org.branch_count} فروع</span>}
            {org.branch_women_only && org.women_access !== "women_only" && <span className="rounded-full bg-pink-500/15 px-2.5 py-1.5 font-bold text-pink-200 ring-1 ring-pink-400/30">💗 فرع نسائي</span>}
            {org.distance_km != null && <span className="rounded-full bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">📍 {org.distance_km < 1 ? "أقل من 1" : org.distance_km.toFixed(1)} كم</span>}
            {facilities.slice(0, 3).map((b) => <span key={b[0]} className={`rounded-full px-2.5 py-1.5 font-bold ring-1 ${b[2]}`}>{b[1]}</span>)}
            {facilities.length > 3 && <span className="rounded-full bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">+{facilities.length - 3} مزايا</span>}
            {org.min_price_jod != null && <span className="rounded-full bg-accent/10 px-2.5 py-1.5 font-bold text-accent ring-1 ring-accent/20">يبدأ من {jod(org.min_price_jod)}</span>}
            {org.free_trial_note && <span className="rounded-full bg-accent/15 px-2.5 py-1.5 font-bold text-accent">🎟 {org.free_trial_note}</span>}
          </div>
          <div className="-mx-5 mt-5 flex min-h-12 items-center justify-between border-t border-white/10 px-5 pt-3 text-sm sm:-mx-6 sm:px-6">
            <span className="font-bold text-accent transition-colors group-hover:text-cyan-200">عرض التفاصيل</span>
            <span aria-hidden="true" className="text-lg text-muted transition-transform group-hover:-translate-x-1 group-hover:text-accent motion-reduce:transform-none motion-reduce:transition-none">←</span>
          </div>
        </div>
      </Link>
      <FavButton slug={org.slug} />
    </article>
  );
}

const KID = "bg-amber-500/15 text-amber-300 ring-amber-400/30", MOSQUE = "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30", QUIET = "bg-sky-500/15 text-sky-300 ring-sky-400/30";
type Badge = [key: string, label: string, cls: string];
/** Owner-declared facility badges in display priority; the card shows the first three. */
function facilityBadges(o: { has_kids_area?: boolean; kids_friendly?: boolean; kids_transport?: boolean; accessibility?: string[]; has_mosque?: boolean; no_music?: boolean }): Badge[] {
  const out: Badge[] = [];
  if (o.has_kids_area) out.push(["kidsarea", "🧒 Kids Area", KID]);
  if (o.kids_friendly) out.push(["kids", "👶 للأطفال 5–12", KID]);
  if (o.kids_transport) out.push(["transport", "🚌 مواصلات أطفال", KID]);
  if (o.accessibility && o.accessibility.length) out.push(["access", "♿ مهيّأ", "bg-violet-500/15 text-violet-300 ring-violet-400/30"]);
  if (o.has_mosque) out.push(["mosque", "🕌 مصلى", MOSQUE]);
  if (o.no_music) out.push(["quiet", "🔇 بدون موسيقى", QUIET]);
  return out;
}
