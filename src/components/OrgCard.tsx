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
  const pink = org.women_access === "women_only";
  const chip = "rounded-full px-2.5 py-1 ring-1 ring-line";
  return (
    <article className={`relative self-start rounded-2xl ${org.glow_color ? `glow glow-${org.glow_color}` : ""}`}>
      <Link
        href={`/g/${org.slug}`}
        className={`group flex flex-col overflow-hidden rounded-2xl bg-surface ring-1 transition-colors ${pink ? "ring-pink-500/50 hover:ring-pink-500" : "ring-line hover:ring-foreground"}`}
      >
        {/* Most places have no photo yet, so a card without one is a complete card, not an empty frame. */}
        {org.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicMediaUrl(org.cover.storage_path)} alt={org.cover.alt_text?.trim() || org.name_ar} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />
        )}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted ${org.cover ? "" : "pe-12"}`}>
            <span>{org.category_name ?? ORG_TYPE_LABEL[org.type]}</span>
            {org.verified_at && <span className="font-semibold text-accent">✓ موثّق</span>}
            {org.is_featured && <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">مميّز</span>}
            {org.glow_color && <span className="font-semibold text-foreground">{GLOW_LABEL[org.glow_color]}</span>}
          </p>
          <h3 className={`mt-1.5 break-words text-xl font-bold leading-7 ${org.cover ? "" : "pe-12"}`}>{org.name_ar}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span>{[org.area, org.city].filter(Boolean).join("، ")}</span>
            {org.distance_km != null && <span className="tabular-nums">{org.distance_km < 1 ? "أقل من 1" : org.distance_km.toFixed(1)} كم</span>}
          </p>
          {(pink || org.women_access === "women_hours" || (org.branch_count ?? 1) > 1 || facilities.length > 0 || org.free_trial_note || (org.branch_women_only && !pink)) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              {pink && <span className="rounded-full bg-pink-600 px-2.5 py-1 font-semibold text-white">{WOMEN_LABEL.women_only}</span>}
              {org.women_access === "women_hours" && <span className="rounded-full bg-pink-500/10 px-2.5 py-1 font-semibold text-pink-200 ring-1 ring-pink-500/30">{WOMEN_LABEL.women_hours}</span>}
              {org.branch_women_only && !pink && <span className="rounded-full bg-pink-500/10 px-2.5 py-1 font-semibold text-pink-200 ring-1 ring-pink-500/30">فرع نسائي</span>}
              {org.free_trial_note && <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">{org.free_trial_note}</span>}
              {(org.branch_count ?? 1) > 1 && <span className={chip}>{org.branch_count} فروع</span>}
              {facilities.slice(0, 3).map((b) => <span key={b[0]} className={chip}>{b[1]}</span>)}
              {facilities.length > 3 && <span className={chip}>+{facilities.length - 3}</span>}
            </div>
          )}
          {/* Bottom line: is it open, and what it costs. The two things people check first. */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
            {org.open_now === true ? <span className="inline-flex items-center gap-1.5 font-semibold text-accent"><span aria-hidden className="size-2 rounded-full bg-current" />مفتوح هسا</span>
              : org.open_now === false ? <span className="text-muted">مسكّر هسا</span>
              : <span className="text-muted">الدوام مش محدد</span>}
            {org.min_price_jod != null && <span className="text-muted">من <b className="font-display text-lg font-bold text-foreground tabular-nums">{jod(org.min_price_jod)}</b></span>}
          </div>
        </div>
      </Link>
      <FavButton slug={org.slug} />
    </article>
  );
}

type Badge = [key: string, label: string];
/** Owner-declared facility badges in display priority; the card shows the first three. */
function facilityBadges(o: { has_kids_area?: boolean; kids_friendly?: boolean; kids_transport?: boolean; accessibility?: string[]; has_mosque?: boolean; no_music?: boolean }): Badge[] {
  const out: Badge[] = [];
  if (o.has_kids_area) out.push(["kidsarea", "Kids Area"]);
  if (o.kids_friendly) out.push(["kids", "للأطفال 5–12"]);
  if (o.kids_transport) out.push(["transport", "مواصلات أطفال"]);
  if (o.accessibility && o.accessibility.length) out.push(["access", "مهيّأ لذوي الإعاقة"]);
  if (o.has_mosque) out.push(["mosque", "مصلى"]);
  if (o.no_music) out.push(["quiet", "بدون موسيقى"]);
  return out;
}
