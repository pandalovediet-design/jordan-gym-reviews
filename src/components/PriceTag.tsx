import { jod } from "@/lib/format";

/** Price with an optional struck-through old price and a discount badge. */
export function PriceTag({ price, oldPrice, className = "" }: { price: number; oldPrice?: number | null; className?: string }) {
  const off = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-accent">{jod(price)}</span>
      {off > 0 && (
        <>
          <s className="text-sm text-muted">{jod(oldPrice)}</s>
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">خصم {off}%</span>
        </>
      )}
    </span>
  );
}
