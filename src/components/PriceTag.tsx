import { jod } from "@/lib/format";

/** Price with an optional struck-through old price and a discount badge. */
export function PriceTag({ price, oldPrice, className = "" }: { price: number; oldPrice?: number | null; className?: string }) {
  const hasDiscount = typeof oldPrice === "number" && oldPrice > price;
  const off = hasDiscount ? Math.round((1 - price / oldPrice) * 100) : 0;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}
      role="group"
      aria-label={hasDiscount ? `السعر الحالي ${jod(price)}، السعر السابق ${jod(oldPrice)}، خصم ${off} بالمئة` : `السعر ${jod(price)}`}
    >
      <span className="font-extrabold tabular-nums text-accent">
        {jod(price)}
      </span>
      {hasDiscount && (
        <>
          <del className="text-sm tabular-nums text-muted">
            {jod(oldPrice)}
          </del>
          <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-500 ring-1 ring-inset ring-red-500/25">
            خصم {off}%
          </span>
        </>
      )}
    </span>
  );
}
