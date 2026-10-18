import Link from "next/link";
import { ORG_TYPE_LABEL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export function Stars({ avg, count }: { avg: number | null | undefined; count?: number | null }) {
  if (!count) return <span className="text-xs text-muted">لا توجد تقييمات بعد</span>;
  return (
    <span className="text-sm">
      <span className="text-accent">★</span> {Number(avg).toFixed(1)}{" "}
      <span className="text-muted">({count})</span>
    </span>
  );
}

export function OrgCard({ org }: {
  org: { slug: string; name_ar: string; type: Enums<"org_type">; city: string; area: string | null; description_ar: string | null; verified_at: string | null;
    rating: { average_rating: number | null; review_count: number | null } | null };
}) {
  return (
    <Link href={`/g/${org.slug}`} className="block rounded-2xl bg-surface p-5 ring-1 ring-white/10 transition hover:ring-accent/60">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{ORG_TYPE_LABEL[org.type]}</span>
        {org.verified_at && <span className="text-accent">✓ موثّق</span>}
      </div>
      <h3 className="text-lg font-bold">{org.name_ar}</h3>
      <p className="mt-1 text-sm text-muted">{[org.area, org.city].filter(Boolean).join("، ")}</p>
      {org.description_ar && <p className="mt-2 line-clamp-2 text-sm">{org.description_ar}</p>}
      <div className="mt-3"><Stars avg={org.rating?.average_rating} count={org.rating?.review_count} /></div>
    </Link>
  );
}
