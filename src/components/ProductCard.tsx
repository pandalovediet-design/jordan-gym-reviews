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
    <Link href={`/p/${p.id}`} aria-label={`عرض ${p.name_ar}`} className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10 transition duration-200 hover:-translate-y-1 hover:ring-accent/60 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${out ? "opacity-75" : ""}`}>
      <div className="relative overflow-hidden bg-background/50">
        {out && <span className="absolute right-3 top-3 z-10 rounded-full border border-red-300/20 bg-red-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg">نفد المخزون</span>}
        {p.image_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicMediaUrl(p.image_path)} alt={p.name_ar} loading="lazy" decoding="async" className={`aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.035] ${out ? "grayscale" : ""}`} />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_center,rgba(98,214,232,.10),transparent_70%)] text-muted">
            <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">◇</span>
            <span className="text-xs">الصورة غير متوفرة</span>
          </div>
        )}
        {!out && <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">عرض المنتج ←</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {p.brand && <p className="mb-1 text-xs font-semibold text-cyan-200">{p.brand}</p>}
        <h3 className="line-clamp-2 font-extrabold leading-6 transition group-hover:text-cyan-100">{p.name_ar}</h3>
        {p.description_ar && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{p.description_ar}</p>}
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PriceTag price={p.price_jod} oldPrice={p.old_price_jod} />
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${out ? "bg-red-400/10 text-red-200" : "bg-emerald-400/10 text-emerald-200"}`}>{AVAILABILITY_LABEL[p.availability]}</span>
          </div>
          {store && <p className="mt-3 border-t border-white/10 pt-3 text-xs text-muted"><span aria-hidden>⌖ </span>{store}</p>}
        </div>
      </div>
    </Link>
  );
}
