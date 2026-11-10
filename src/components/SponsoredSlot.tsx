import { adImageUrl, getSponsoredSlot } from "@/lib/ads";
import { AdImpressions } from "@/components/AdImpressions";

/** A clearly labelled paid placement above search results or a directory section. Renders nothing when no ad is live. */
export async function SponsoredSlot({ placement, type, className = "" }: { placement: "search" | "category"; type?: string; className?: string }) {
  const ad = await getSponsoredSlot(placement, type).catch(() => null);
  if (!ad) return null;
  const img = adImageUrl(ad.image_path);
  return (
    <aside aria-label="إعلان مموّل" className={className}>
      <a href={`/a/${ad.id}`} rel="sponsored noopener" className="flex items-center gap-4 overflow-hidden rounded-2xl bg-surface p-3 ring-1 ring-accent/30 transition hover:ring-accent/70">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" className="size-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-40" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-accent">{placement === "category" ? "برعاية" : "مموّل"}</p>
          <p className="mt-0.5 truncate text-base font-extrabold sm:text-lg">{ad.title}</p>
          {ad.subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{ad.subtitle}</p>}
        </div>
        <span aria-hidden className="hidden shrink-0 pe-2 text-xl text-accent sm:block">←</span>
      </a>
      <AdImpressions ids={[ad.id]} />
    </aside>
  );
}
