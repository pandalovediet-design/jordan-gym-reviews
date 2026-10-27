"use client";
import { useEffect, useRef, useState } from "react";

export type GalleryItem = { src: string; alt: string; caption?: string | null };

/** Photo grid with a full-screen viewer, swipe and keyboard navigation. */
export function Gallery({ items, start = 0 }: { items: GalleryItem[]; start?: number }) {
  const [i, setI] = useState<number | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const x0 = useRef<number | null>(null);
  const go = (d: number) => setI((v) => v == null || items.length < 2 ? v : (v + d + items.length) % items.length);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (i != null && !dlg.open) dlg.showModal();
    if (i == null && dlg.open) dlg.close();
  }, [i]);

  const shown = items.slice(Math.max(0, start));
  if (shown.length === 0) return null;

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {shown.map((m, k) => (
          <figure key={m.src} className="min-w-0">
            <button
              type="button"
              onClick={() => setI(Math.max(0, start) + k)}
              className="group block w-full overflow-hidden rounded-xl bg-surface ring-1 ring-white/10 outline-none transition hover:ring-accent focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
              aria-label={`عرض الصورة: ${m.alt}`}
              aria-haspopup="dialog"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
            </button>
            {m.caption && <figcaption className="mt-2 break-words px-1 text-sm leading-relaxed text-muted">{m.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <dialog
        ref={ref}
        aria-label="عارض الصور"
        onClose={() => setI(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); go(1); }
          if (e.key === "ArrowRight") { e.preventDefault(); go(-1); }
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
        onTouchStart={(e) => { x0.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          if (x0.current == null) return;
          const dx = e.changedTouches[0].clientX - x0.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          x0.current = null;
        }}
      >
        {i != null && items[i] && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 p-3 text-sm sm:p-4">
              <span className="text-white/70" aria-live="polite" aria-atomic="true">{i + 1} من {items.length}</span>
              <button type="button" autoFocus onClick={() => setI(null)} className="min-h-11 rounded-full bg-white/10 px-4 py-2 font-bold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none">✕ إغلاق</button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={items[i].src} alt={items[i].alt} decoding="async" className="max-h-full max-w-full object-contain" />
              {items.length > 1 && <>
                <button type="button" onClick={() => go(-1)} aria-label="الصورة السابقة" className="absolute right-2 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 px-4 py-3 text-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none">›</button>
                <button type="button" onClick={() => go(1)} aria-label="الصورة التالية" className="absolute left-2 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 px-4 py-3 text-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none">‹</button>
              </>}
            </div>
            {items[i].caption && <p className="shrink-0 px-4 pb-4 pt-2 text-center text-sm leading-relaxed text-white/80">{items[i].caption}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
