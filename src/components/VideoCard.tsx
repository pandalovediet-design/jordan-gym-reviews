"use client";
import { useActionState, useState } from "react";
import { countView, reportVideo } from "@/app/reels/actions";
import { PLATFORM_LABEL, parseVideoUrl, type Platform } from "@/lib/video";
import { TrackedLink } from "@/components/Track";

export type VideoItem = {
  id: string; kind: string; url: string; platform: string; title_ar: string | null; cover_url: string | null;
  org: { id: string; slug: string; name_ar: string; city: string; wa: string | null } | null;
};
const BRAND: Record<Platform, string> = {
  youtube: "from-red-700 to-red-950", instagram: "from-fuchsia-700 to-orange-700", tiktok: "from-zinc-800 to-black", facebook: "from-blue-700 to-blue-950",
};
const isPlatform = (value: string): value is Platform =>
  value === "youtube" || value === "instagram" || value === "tiktok" || value === "facebook";

function Report({ id }: { id: string }) {
  const [state, run, pending] = useActionState(reportVideo.bind(null, id), undefined);
  if (state?.ok) return <span className="text-xs text-accent" role="status" aria-live="polite">{state.ok}</span>;
  return (
    <details className="text-xs text-muted">
      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2 py-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">🚩 بلّغ عن الفيديو</summary>
      <form action={run} aria-busy={pending} className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input name="reason" maxLength={200} autoComplete="off" placeholder="السبب (اختياري)" aria-label="سبب الإبلاغ" className="min-h-11 min-w-0 flex-1 rounded-lg bg-background px-3 py-2 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-white/10 px-3 py-2 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{pending ? "جارٍ الإرسال…" : "إرسال"}</button>
      </form>
      {pending && <p role="status" aria-live="polite" className="mt-1">جارٍ إرسال البلاغ…</p>}
      {state?.error && <p role="alert" className="mt-1 text-red-300">{state.error}</p>}
    </details>
  );
}

/** One reel-style card: a fixed 9:16 frame for every platform. The player loads only after a tap. */
export function VideoCard({ v, showOrg = true }: { v: VideoItem; showOrg?: boolean }) {
  const [play, setPlay] = useState(false);
  const parsed = parseVideoUrl(v.url);
  const platform: Platform = parsed?.platform ?? (isPlatform(v.platform) ? v.platform : "youtube");
  const thumb = v.cover_url ?? parsed?.thumb ?? null;
  const wa = v.org?.wa ?? null;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
        {play && parsed?.embed ? (
          <iframe src={parsed.embed} title={v.title_ar ?? "فيديو"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 size-full border-0" />
        ) : (
          <button type="button" disabled={!parsed?.embed} onClick={() => { setPlay(true); countView(v.id).catch(() => {}); }} aria-label={`تشغيل الفيديو: ${v.title_ar ?? PLATFORM_LABEL[platform]}`} className="group absolute inset-0 flex items-center justify-center disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-accent">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            ) : <span aria-hidden="true" className={`absolute inset-0 bg-gradient-to-b ${BRAND[platform]}`} />}
            <span aria-hidden="true" className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10 motion-reduce:transition-none" />
            <span aria-hidden="true" className="relative flex size-14 items-center justify-center rounded-full bg-white/90 text-2xl text-black">▶</span>
            <span aria-hidden="true" className="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs">{PLATFORM_LABEL[platform]}</span>
            {v.kind === "review" && <span className="absolute end-2 top-2 rounded-full bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">مراجعة عبد الكريم</span>}
          </button>
        )}
      </div>
      {v.title_ar && <p className="text-sm font-semibold">{v.title_ar}</p>}
      {showOrg && v.org && <p className="text-xs text-muted"><a href={`/g/${v.org.slug}`} className="rounded-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{v.org.name_ar}</a> · {v.org.city}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {wa && v.org && <TrackedLink orgId={v.org.id} event="whatsapp_click" external href={`https://wa.me/${wa}?text=${encodeURIComponent("مرحبا، شفت فيديو لكم على Jordan Gym Reviews")}`} className="inline-flex min-h-11 items-center rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">واتساب</TrackedLink>}
        <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">افتح الفيديو ↗</a>
        <Report id={v.id} />
      </div>
    </div>
  );
}
