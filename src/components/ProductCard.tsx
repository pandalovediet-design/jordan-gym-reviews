import Link from "next/link";
import { AVAILABILITY_LABEL, publicMediaUrl } from "@/lib/format";
import { PriceTag } from "@/components/PriceTag";
import type { Enums } from "@/lib/database.types";

export function ProductCard({ p, store }: {
  p: { id: string; name_ar: string; brand: string | null; price_jod: number; old_price_jod?: number | null; availability: Enums<"availability_status">;
    description_ar: string | null; image_path: string | null };
  store?: string | null;
}) {
  const out = p.availability === "out_of_stock";
  return (
    <Link href={`/p/${p.id}`} className={`relative block overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10 transition hover:ring-accent/60 ${out ? "opacity-70" : ""}`}>
      {out && <span className="absolute right-2 top-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">خلص</span>}
      {p.image_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={publicMediaUrl(p.image_path)} alt={p.name_ar} loading="lazy" className={`aspect-square w-full object-cover ${out ? "grayscale" : ""}`} />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-background/40 text-sm text-muted">بدون صورة</div>
      )}
      <div className="p-4">
        <h3 className="font-bold">{p.name_ar}</h3>
        {p.brand && <p className="text-sm text-muted">{p.brand}</p>}
        <p className="mt-1"><PriceTag price={p.price_jod} oldPrice={p.old_price_jod} /></p>
        {p.description_ar && <p className="mt-2 line-clamp-3 text-sm leading-6">{p.description_ar}</p>}
        <p className="mt-2 text-xs text-muted">{AVAILABILITY_LABEL[p.availability]}{store ? ` · ${store}` : ""}</p>
      </div>
    </Link>
  );
}
