"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export type FlashItem = {
  id: string; title: string; description: string | null; discount: number | null; price: string | null;
  ends_at: string; org: { slug: string; name: string; city: string };
};

function left(ms: number) {
  if (ms <= 0) return "انتهى";
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(sec)}`;
}

export function FlashStrip({ items }: { items: FlashItem[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
  const live = now == null ? items : items.filter((i) => Number.isFinite(+new Date(i.ends_at)) && +new Date(i.ends_at) > now);
  if (live.length === 0) return null;
  return (
    <section className="mb-12" aria-labelledby="flash-offers-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="mb-1 text-xs font-bold tracking-wide text-orange-300">لفترة محدودة</p>
          <h2 id="flash-offers-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">⚡ عروض الفلاش</h2>
        </div>
        <span className="text-xs text-muted">العروض تنتهي مع العدّاد</span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:gap-4 sm:px-0" aria-label="العروض المتاحة">
        {live.map((f) => (
          <Link key={f.id} href={`/g/${f.org.slug}`} aria-label={`${f.title} لدى ${f.org.name}، عرض محدود المدة`} className="group min-w-[min(80vw,19rem)] max-w-sm shrink-0 snap-start rounded-2xl bg-gradient-to-br from-orange-500/20 via-surface to-pink-500/15 p-4 ring-1 ring-orange-400/30 transition-colors hover:ring-orange-300/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="rounded-full bg-orange-500 px-3 py-1.5 font-extrabold text-white">{f.discount ? `خصم ${f.discount}%` : f.price ?? "عرض خاص"}</span>
              <span className="rounded-lg bg-black/20 px-2 py-1 font-mono font-bold text-orange-200" dir="ltr" aria-label="الوقت المتبقي">{now == null ? "--:--:--" : left(+new Date(f.ends_at) - now)}</span>
            </div>
            <h3 className="mt-3 break-words text-base font-extrabold leading-6 transition-colors group-hover:text-orange-100">{f.title}</h3>
            {f.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{f.description}</p>}
            <p className="mt-3 flex flex-wrap items-center gap-x-1 text-xs leading-5 text-muted"><span aria-hidden="true">📍</span>{f.org.name} · {f.org.city}{f.discount && f.price ? ` · ${f.price}` : ""}</p>
            <span className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-orange-300">اكتشف العرض <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">←</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
