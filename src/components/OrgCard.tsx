import Link from "next/link";
import { ORG_TYPE_LABEL, publicMediaUrl } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export function OrgCard({ org }: {
  org: { slug: string; name_ar: string; type: Enums<"org_type">; city: string; area: string | null; description_ar: string | null; verified_at: string | null;
    cover?: { storage_path: string; alt_text: string | null } | null };
}) {
  return (
    <Link href={`/g/${org.slug}`} className="block overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10 transition hover:ring-accent/60">
      {org.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={publicMediaUrl(org.cover.storage_path)} alt={org.cover.alt_text ?? org.name_ar} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-background/40 text-sm text-muted">بدون صورة</div>
      )}
      <div className="p-5">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{ORG_TYPE_LABEL[org.type]}</span>
        {org.verified_at && <span className="text-accent">✓ موثّق</span>}
      </div>
      <h3 className="text-lg font-bold">{org.name_ar}</h3>
      <p className="mt-1 text-sm text-muted">{[org.area, org.city].filter(Boolean).join("، ")}</p>
      {org.description_ar && <p className="mt-2 line-clamp-2 text-sm">{org.description_ar}</p>}
      </div>
    </Link>
  );
}
