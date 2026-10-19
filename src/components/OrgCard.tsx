import Link from "next/link";
import { FavButton } from "@/components/Favorites";
import { ORG_TYPE_LABEL, WOMEN_LABEL, jod, publicMediaUrl } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export function OrgCard({ org }: {
  org: { slug: string; name_ar: string; type: Enums<"org_type">; city: string; area: string | null; description_ar: string | null; verified_at: string | null; is_featured?: boolean;
    category_name?: string | null; free_trial_note?: string | null; min_price_jod?: number | null; distance_km?: number; women_access?: "none" | "women_only" | "women_hours";
    cover?: { storage_path: string; alt_text: string | null } | null };
}) {
  return (
    <div className="relative">
    <Link href={`/g/${org.slug}`} className={`block overflow-hidden rounded-2xl bg-surface ring-1 transition hover:ring-accent/60 ${org.women_access === "women_only" ? "ring-pink-400/60" : "ring-white/10"}`}>
      {org.women_access === "women_only" && <div className="bg-pink-500 px-4 py-1 text-center text-xs font-bold tracking-wide text-white">💗 {WOMEN_LABEL.women_only}</div>}
      {org.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={publicMediaUrl(org.cover.storage_path)} alt={org.cover.alt_text ?? org.name_ar} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-background/40 text-sm text-muted">بدون صورة</div>
      )}
      <div className="p-5">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{org.category_name ?? ORG_TYPE_LABEL[org.type]}</span>
        <span className="flex gap-2">
          {org.women_access === "women_hours" && <span className="rounded-full bg-pink-500/20 px-2 py-0.5 font-bold text-pink-300 ring-1 ring-pink-400/40">{WOMEN_LABEL.women_hours}</span>}
          {org.is_featured && <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-accent-foreground">مميّز</span>}
          {org.verified_at && <span className="text-accent">✓ موثّق</span>}
        </span>
      </div>
      <h3 className="text-lg font-bold">{org.name_ar}</h3>
      <p className="mt-1 text-sm text-muted">{[org.area, org.city].filter(Boolean).join("، ")}</p>
      {org.description_ar && <p className="mt-2 line-clamp-2 text-sm">{org.description_ar}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {org.distance_km != null && <span className="rounded-full bg-white/10 px-2 py-0.5">📍 {org.distance_km < 1 ? "أقل من 1" : org.distance_km.toFixed(1)} كم</span>}
        {org.min_price_jod != null && <span className="rounded-full bg-white/10 px-2 py-0.5">من {jod(org.min_price_jod)}</span>}
        {org.free_trial_note && <span className="rounded-full bg-accent/15 px-2 py-0.5 font-bold text-accent">🎟 {org.free_trial_note}</span>}
      </div>
      </div>
    </Link>
    <FavButton slug={org.slug} />
    </div>
  );
}
