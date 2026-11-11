"use client";
import { useSyncExternalStore } from "react";
import { setAccountFavorite } from "@/app/favorites/actions";

const KEY = "jgr:favs";
const EVT = "jgr:favs-change";
const EMPTY: string[] = [];
let cache: { raw: string | null; list: string[] } = { raw: null, list: EMPTY };

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.list;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed)
      ? [...new Set(parsed.filter((x): x is string => typeof x === "string" && x.length > 0))].slice(0, 100)
      : EMPTY;
    cache = { raw, list };
    return list;
  } catch {
    return EMPTY;
  }
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
}
export function replaceFavs(slugs: string[]) {
  try {
    const next = [...new Set(slugs)].slice(0, 100);
    localStorage.setItem(KEY, JSON.stringify(next));
    cache = { raw: JSON.stringify(next), list: next };
    window.dispatchEvent(new Event(EVT));
  } catch { /* Keep the UI available if storage is blocked. */ }
}
export function useFavs() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
/** Toggles locally and returns whether the place is now saved. */
export function toggleFav(slug: string): boolean {
  const cur = read();
  const saved = !cur.includes(slug);
  try {
    const next = saved ? [slug, ...cur].slice(0, 100) : cur.filter((s) => s !== slug);
    localStorage.setItem(KEY, JSON.stringify(next));
    cache = { raw: JSON.stringify(next), list: next };
    window.dispatchEvent(new Event(EVT));
  } catch {
    // Storage can be unavailable in private browsing; the rest of the page remains usable.
  }
  return saved;
}

export function FavButton({ slug, className = "" }: { slug: string; className?: string }) {
  const on = useFavs().includes(slug);
  return (
    <button
      type="button"
      aria-label={on ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      aria-pressed={on}
      title={on ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      onClick={() => { const saved = toggleFav(slug); setAccountFavorite(slug, saved).catch(() => { /* Local favorites remain saved if sync is unavailable. */ }); }}
      className={`absolute left-2 top-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface/90 text-lg leading-none ring-1 ring-line backdrop-blur transition-transform active:scale-95 motion-reduce:transform-none motion-reduce:transition-none ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-5 ${on ? "text-[#ce1126]" : "text-muted"}`} fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.500 2.8C19.500 15.400 12 20 12 20Z" /></svg>
    </button>
  );
}
