/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { parseVideoUrl, PLATFORM_LABEL } from "@/lib/video";
import { equipGradient, equipIcon } from "@/lib/home-meta";

export function HomePlayer({ url, title, cover, equipment, icon, gradient }: { url: string; title: string; cover: string | null; equipment?: string; icon?: string; gradient?: string }) {
  const [play, setPlay] = useState(false);
  const v = parseVideoUrl(url);
  return (
    <div>
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/15">
        {play && v?.embed ? (
          <iframe src={v.embed} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 size-full border-0" />
        ) : (
          <button type="button" disabled={!v?.embed} onClick={() => setPlay(true)} aria-label={`تشغيل ${title}`} className="group absolute inset-0 flex items-center justify-center">
            {cover ? <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
              : <span className={`absolute inset-0 bg-gradient-to-br ${gradient ?? equipGradient(equipment ?? "none")}`}><span className="absolute inset-0 flex items-center justify-center text-8xl opacity-50">{icon ?? equipIcon(equipment ?? "none")}</span></span>}
            <span className="absolute inset-0 bg-black/30 transition group-hover:bg-black/10" />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground shadow-lg transition group-hover:scale-110">▶</span>
            {v && <span className="absolute start-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs backdrop-blur">{PLATFORM_LABEL[v.platform]}</span>}
          </button>
        )}
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent underline">افتح الفيديو على {v ? PLATFORM_LABEL[v.platform] : "المنصة"} ↗</a>
    </div>
  );
}
