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
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, []);
  const live = now == null ? items : items.filter((i) => +new Date(i.ends_at) > now);
  if (live.length === 0) return null;
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-bold">⚡ عروض الفلاش</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {live.map((f) => (
          <Link key={f.id} href={`/g/${f.org.slug}`} className="min-w-64 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500/25 to-pink-500/20 p-5 ring-1 ring-orange-400/40 hover:ring-orange-300">
            <div className="flex items-center justify-between text-xs">
              <span className="rounded-full bg-orange-500 px-2 py-0.5 font-bold text-white">{f.discount ? `خصم ${f.discount}%` : f.price ?? "عرض"}</span>
              <span className="font-mono text-orange-200" dir="ltr">{now == null ? "--:--:--" : left(+new Date(f.ends_at) - now)}</span>
            </div>
            <h3 className="mt-2 font-bold">{f.title}</h3>
            {f.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{f.description}</p>}
            <p className="mt-2 text-xs text-muted">{f.org.name} · {f.org.city}{f.discount && f.price ? ` · ${f.price}` : ""}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
