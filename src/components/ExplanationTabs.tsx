/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { parseVideoUrl, PLATFORM_LABEL } from "@/lib/video";
import { TrackedLink } from "@/components/Track";
import type { Explanation } from "@/lib/exercises";

export function ExplanationTabs({ items, exName }: { items: Explanation[]; exName: string }) {
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const t = items[Math.min(i, items.length - 1)];
  const v = t.video_url ? parseVideoUrl(t.video_url) : null;
  return (
    <div>
      {items.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {items.map((x, k) => (
            <button key={x.id} onClick={() => { setI(k); setPlay(false); }} className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 ${k === i ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>شرح {x.coach.name}</button>
          ))}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {v ? (
          <div>
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              {play && v.embed ? (
                <iframe src={v.embed} title={`شرح ${exName}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" className="absolute inset-0 size-full border-0" />
              ) : (
                <button type="button" disabled={!v.embed} onClick={() => setPlay(true)} aria-label="تشغيل" className="group absolute inset-0 flex items-center justify-center">
                  {v.thumb ? <img src={v.thumb} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : <span className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-black" />}
                  <span className="absolute inset-0 bg-black/25 group-hover:bg-black/10" />
                  <span className="relative flex size-14 items-center justify-center rounded-full bg-white/90 text-2xl text-black">▶</span>
                  <span className="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs">{PLATFORM_LABEL[v.platform]}</span>
                </button>
              )}
            </div>
            <a href={t.video_url!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent underline">افتح الفيديو ↗</a>
          </div>
        ) : (
          <div className="hidden aspect-[9/16] items-center justify-center rounded-2xl bg-surface text-sm text-muted ring-1 ring-white/10 md:flex">بدون فيديو</div>
        )}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {t.coach.photo && <img src={t.coach.photo} alt="" className="size-12 rounded-full object-cover" />}
            <div>
              <a href={`/g/${t.coach.slug}`} className="font-bold text-accent hover:underline">{t.coach.name}</a>
              <p className="text-xs text-muted">{t.coach.city}</p>
            </div>
          </div>
          <ol className="space-y-2">
            {t.steps.map((s, k) => (
              <li key={k} className="flex gap-3 rounded-xl bg-surface p-3 text-sm ring-1 ring-white/10"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{k + 1}</span><span>{s}</span></li>
            ))}
          </ol>
          {t.mistake && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/30">⚠️ <b>خطأ شائع:</b> {t.mistake}</p>}
          {t.coach.wa && <TrackedLink orgId={t.coach.id} event="whatsapp_click" external href={`https://wa.me/${t.coach.wa}?text=${encodeURIComponent(`مرحبا كابتن، شفت شرحك لتمرين ${exName} على GYMJO`)}`} className="inline-block rounded-xl bg-green-600 px-5 py-2 text-sm font-bold text-white">احكي مع الكابتن على واتساب</TrackedLink>}
        </div>
      </div>
    </div>
  );
}
