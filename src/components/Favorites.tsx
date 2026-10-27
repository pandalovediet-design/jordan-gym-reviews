"use client";
import { useSyncExternalStore } from "react";

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
export function useFavs() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
export function toggleFav(slug: string) {
  try {
    const cur = read();
    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur].slice(0, 100);
    localStorage.setItem(KEY, JSON.stringify(next));
    cache = { raw: JSON.stringify(next), list: next };
    window.dispatchEvent(new Event(EVT));
  } catch {
    // Storage can be unavailable in private browsing; the rest of the page remains usable.
  }
}

export function FavButton({ slug, className = "" }: { slug: string; className?: string }) {
  const on = useFavs().includes(slug);
  return (
    <button
      type="button"
      aria-label={on ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      aria-pressed={on}
      title={on ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      onClick={() => toggleFav(slug)}
      className={`absolute left-2 top-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-lg leading-none shadow-lg shadow-black/20 backdrop-blur transition-transform hover:scale-105 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 motion-reduce:transform-none motion-reduce:transition-none ${className}`}
    >
      <span aria-hidden="true">{on ? "❤️" : "🤍"}</span>
    </button>
  );
}
