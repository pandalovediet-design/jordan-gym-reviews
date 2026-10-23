"use client";
import { useEffect, useRef, useState } from "react";

export type GalleryItem = { src: string; alt: string; caption?: string | null };

/** Photo grid that opens a full-screen viewer (swipe/arrow keys/buttons to move, Esc or ✕ to close). */
export function Gallery({ items, start = 0 }: { items: GalleryItem[]; start?: number }) {
  const [i, setI] = useState<number | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const x0 = useRef<number | null>(null);
  const go = (d: number) => setI((v) => (v == null ? v : (v + d + items.length) % items.length));
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (i != null && !dlg.open) dlg.showModal();
    if (i == null && dlg.open) dlg.close();
  }, [i]);
  const shown = items.slice(start);
  if (shown.length === 0) return null;
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((m, k) => (
          <figure key={m.src}>
            <button type="button" onClick={() => setI(start + k)} className="block w-full overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-accent" aria-label={`عرض الصورة: ${m.alt}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.alt} loading="lazy" className="aspect-[4/3] w-full object-cover transition hover:scale-[1.03]" />
            </button>
            {m.caption && <figcaption className="mt-1 px-1 text-sm text-muted">{m.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <dialog ref={ref} onClose={() => setI(null)} onKeyDown={(e) => { if (e.key === "ArrowLeft") go(1); if (e.key === "ArrowRight") go(-1); }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
        onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (x0.current == null) return; const dx = e.changedTouches[0].clientX - x0.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); x0.current = null; }}>
        {i != null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-3 text-sm">
              <span className="text-white/70">{i + 1} / {items.length}</span>
              <button type="button" onClick={() => setI(null)} className="rounded-full bg-white/10 px-4 py-2 font-bold">✕ إغلاق</button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={items[i].src} alt={items[i].alt} className="max-h-full max-w-full object-contain" />
              {items.length > 1 && <>
                <button type="button" onClick={() => go(-1)} aria-label="السابقة" className="absolute right-2 rounded-full bg-white/10 px-4 py-3 text-xl">›</button>
                <button type="button" onClick={() => go(1)} aria-label="التالية" className="absolute left-2 rounded-full bg-white/10 px-4 py-3 text-xl">‹</button>
              </>}
            </div>
            {items[i].caption && <p className="p-4 text-center text-sm text-white/80">{items[i].caption}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
