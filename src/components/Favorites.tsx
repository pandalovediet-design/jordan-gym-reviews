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
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 100) : EMPTY;
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
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

export function FavButton({ slug, className = "" }: { slug: string; className?: string }) {
  const on = useFavs().includes(slug);
  return (
    <button
      type="button"
      aria-label={on ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      aria-pressed={on}
      onClick={() => toggleFav(slug)}
      className={`absolute left-2 top-2 z-10 rounded-full bg-black/55 px-2.5 py-1 text-lg leading-none backdrop-blur ${className}`}
    >
      {on ? "❤️" : "🤍"}
    </button>
  );
}
