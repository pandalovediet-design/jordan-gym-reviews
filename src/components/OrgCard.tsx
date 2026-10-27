import Link from "next/link";
import { FavButton } from "@/components/Favorites";
import { GLOW_LABEL, ORG_TYPE_LABEL, WOMEN_LABEL, jod, publicMediaUrl, type GlowColor } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export function OrgCard({ org }: {
  org: { slug: string; name_ar: string; type: Enums<"org_type">; city: string; area: string | null; description_ar: string | null; verified_at: string | null; is_featured?: boolean;
    category_name?: string | null; free_trial_note?: string | null; min_price_jod?: number | null; distance_km?: number; glow_color?: GlowColor | null; open_now?: boolean | null; branch_count?: number; branch_women_only?: boolean; has_mosque?: boolean; no_music?: boolean; has_kids_area?: boolean; kids_friendly?: boolean; kids_transport?: boolean; accessibility?: string[]; women_access?: "none" | "women_only" | "women_hours";
    cover?: { storage_path: string; alt_text: string | null } | null };
}) {
  return (
    <div className={`relative ${org.glow_color ? `glow glow-${org.glow_color}` : ""}`}>
    <Link href={`/g/${org.slug}`} className={`group block overflow-hidden rounded-3xl bg-surface shadow-lg shadow-black/10 ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/25 ${org.women_access === "women_only" ? "ring-pink-400/60" : "ring-white/10 hover:ring-blue-400/50"}`}>
      {org.women_access === "women_only" && <div className="bg-pink-500 px-4 py-1 text-center text-xs font-bold tracking-wide text-white">💗 {WOMEN_LABEL.women_only}</div>}
      {org.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={publicMediaUrl(org.cover.storage_path)} alt={org.cover.alt_text ?? org.name_ar} loading="lazy" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
      ) : (
        <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_25%_15%,rgba(54,120,246,.3),transparent_45%),linear-gradient(135deg,#243653,#111827)] text-sm text-muted"><span className="text-5xl opacity-70" aria-hidden>✦</span><span className="absolute bottom-3 right-4 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80">اكتشف المكان</span></div>
      )}
      <div className="p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{org.category_name ?? ORG_TYPE_LABEL[org.type]}</span>
        <span className="flex gap-2">
          {org.women_access === "women_hours" && <span className="rounded-full bg-pink-500/20 px-2 py-0.5 font-bold text-pink-300 ring-1 ring-pink-400/40">{WOMEN_LABEL.women_hours}</span>}
          {org.is_featured && <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-accent-foreground">مميّز</span>}
          {org.glow_color && <span className="rounded-full bg-black/40 px-2 py-0.5 font-bold text-foreground">{GLOW_LABEL[org.glow_color]}</span>}
          {org.verified_at && <span className="text-accent">✓ موثّق</span>}
        </span>
      </div>
      <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight transition group-hover:text-cyan-100">{org.name_ar}
        {org.open_now === true && <span className="whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/40">● مفتوح هسا</span>}
        {org.open_now === false && <span className="whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-muted">مسكّر هسا</span>}
      </h3>
      <p className="mt-1 text-sm text-muted">{[org.area, org.city].filter(Boolean).join("، ")}</p>
      {org.description_ar && <p className="mt-2 line-clamp-2 text-sm">{org.description_ar}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {(org.branch_count ?? 1) > 1 && <span className="rounded-full bg-white/10 px-2 py-0.5">🏢 {org.branch_count} فروع</span>}
        {org.branch_women_only && org.women_access !== "women_only" && <span className="rounded-full bg-pink-500/20 px-2 py-0.5 font-bold text-pink-300 ring-1 ring-pink-400/40">💗 فرع نسائي</span>}
        {org.distance_km != null && <span className="rounded-full bg-white/10 px-2 py-0.5">📍 {org.distance_km < 1 ? "أقل من 1" : org.distance_km.toFixed(1)} كم</span>}
        {facilityBadges(org).slice(0, 3).map((b) => <span key={b[0]} className={`rounded-full px-2 py-0.5 font-bold ring-1 ${b[2]}`}>{b[1]}</span>)}
        {facilityBadges(org).length > 3 && <span className="rounded-full bg-white/10 px-2 py-0.5">+{facilityBadges(org).length - 3}</span>}
        {org.min_price_jod != null && <span className="rounded-full bg-white/10 px-2 py-0.5">من {jod(org.min_price_jod)}</span>}
        {org.free_trial_note && <span className="rounded-full bg-accent/15 px-2 py-0.5 font-bold text-accent">🎟 {org.free_trial_note}</span>}
      </div>
      </div>
    </Link>
    <FavButton slug={org.slug} />
    </div>
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
