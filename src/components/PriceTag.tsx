import { jod } from "@/lib/format";

/** Price with an optional struck-through old price and a discount badge. */
export function PriceTag({ price, oldPrice, className = "" }: { price: number; oldPrice?: number | null; className?: string }) {
  const hasDiscount = typeof oldPrice === "number" && oldPrice > price;
  const off = hasDiscount ? Math.round((1 - price / oldPrice) * 100) : 0;

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span className="font-extrabold tabular-nums text-accent" aria-label={`السعر ${jod(price)}`}>
        {jod(price)}
      </span>
      {hasDiscount && (
        <>
          <s className="text-sm tabular-nums text-muted" aria-label={`السعر السابق ${jod(oldPrice)}`}>
            {jod(oldPrice)}
          </s>
          <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-500 ring-1 ring-inset ring-red-500/25" aria-label={`خصم ${off} بالمئة`}>
            خصم {off}%
          </span>
        </>
      )}
    </span>
  );
}
