"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Audio + ayah text come from AlQuran.cloud (audio served by cdn.islamic.network). Only reciter ids are typed by hand.
// The <audio> element lives in the root layout so playback survives client-side navigation between pages.
const API = "https://api.alquran.cloud/v1";
export const RECITERS = [
  { id: "ar.alafasy", name: "مشاري العفاسي" },
  { id: "ar.husary", name: "محمود الحصري" },
  { id: "ar.abdulsamad", name: "عبدالباسط عبدالصمد" },
  { id: "ar.abdurrahmaansudais", name: "عبدالرحمن السديس" },
  { id: "ar.saoodshuraym", name: "سعود الشريم" },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي" },
] as const;
export const TIMERS = [15, 30, 45, 0] as const;
const KEY = "jgr-quran-player-v1";
const ar = (n: number) => n.toLocaleString("ar-EG");

export type SurahMeta = { number: number; name: string; numberOfAyahs: number };
export type Ayah = { numberInSurah: number; audio: string; text: string };
export type Prefs = { surah: number; reciter: string; timer: number };
const DEFAULT: Prefs = { surah: 18, reciter: RECITERS[0].id, timer: 30 };

const strip = (t: string) => t.replace(/[ً-ٰٟۖ-ۭ]/g, "").replace(/ٱ/g, "ا");
/** The API prefixes the Bismillah to ayah 1 of every surah except 1 and 9; show only the ayah itself. */
export function ayahText(a: { numberInSurah: number; text: string }, surah: number): string {
  if (a.numberInSurah !== 1 || surah === 1 || surah === 9) return a.text;
  const w = a.text.split(" ");
  return strip(w.slice(0, 4).join(" ")) === "بسم الله الرحمن الرحيم" ? w.slice(4).join(" ") : a.text;
}

type Ctx = {
  prefs: Prefs; surahs: SurahMeta[]; ayahs: Ayah[]; idx: number; curSurah: number; curReciter: string;
  playing: boolean; busy: boolean; err: string; left: number; done: boolean; active: boolean;
  setSurah: (n: number) => void; setReciter: (id: string) => void; setTimer: (m: number) => void;
  toggle: () => void; stop: () => void; step: (d: number) => void; nameOf: (n: number) => string;
};
const C = createContext<Ctx | null>(null);
export function useQuranAudio(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("QuranAudioProvider missing");
  return c;
}

export function QuranAudioProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [idx, setIdx] = useState(0);
  const [curSurah, setCurSurah] = useState(DEFAULT.surah);
  const [curReciter, setCurReciter] = useState<string>(DEFAULT.reciter);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(false);

  const audio = useRef<HTMLAudioElement | null>(null);
  const q = useRef({ ayahs: [] as Ayah[], idx: 0, surah: DEFAULT.surah, reciter: DEFAULT.reciter as string, endAt: 0, timer: DEFAULT.timer });
  const pre = useRef<{ key: string; list: Ayah[] } | null>(null); // prefetched list for the selected surah (so start() can play synchronously inside the tap)
  const surahsRef = useRef<SurahMeta[]>([]);

  const nameIn = (list: SurahMeta[], n: number) => list.find((s) => s.number === n)?.name ?? `سورة ${n}`;
  const nameOf = (n: number) => nameIn(surahs, n);

  const loadSurah = async (surah: number, reciter: string): Promise<Ayah[]> => {
    const res = await fetch(`${API}/surah/${surah}/${reciter}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const list = (j?.data?.ayahs ?? []) as Ayah[];
    if (!list.length) throw new Error("empty");
    return list;
  };

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const d = JSON.parse(localStorage.getItem(KEY) ?? "null");
        if (d && typeof d === "object") {
          setPrefs({
            surah: Number.isInteger(d.surah) && d.surah >= 1 && d.surah <= 114 ? d.surah : DEFAULT.surah,
            reciter: RECITERS.some((r) => r.id === d.reciter) ? d.reciter : DEFAULT.reciter,
            timer: (TIMERS as readonly number[]).includes(d.timer) ? d.timer : DEFAULT.timer,
          });
        }
      } catch {}
    }, 0);
    fetch(`${API}/surah`).then((r) => r.json()).then((j) => {
      const list = (j?.data ?? []) as SurahMeta[];
      if (Array.isArray(list) && list.length === 114) { surahsRef.current = list; setSurahs(list); }
    }).catch(() => {});
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} }, [prefs]);

  // prefetch the selected surah so the play tap can start audio synchronously (needed by iOS)
  useEffect(() => {
    const key = `${prefs.surah}|${prefs.reciter}`;
    let dead = false;
    loadSurah(prefs.surah, prefs.reciter).then((list) => { if (!dead) pre.current = { key, list }; }).catch(() => {});
    return () => { dead = true; };
  }, [prefs.surah, prefs.reciter]);

  // countdown display only; the real stop decision is time-based in onEnded (timers get throttled when the screen is off)
  useEffect(() => {
    if (!playing || !q.current.timer) return;
    const i = setInterval(() => setLeft(Math.max(0, Math.round((q.current.endAt - Date.now()) / 1000))), 1000);
    return () => clearInterval(i);
  }, [playing]);

  const setMedia = () => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const s = q.current;
    const a = s.ayahs[s.idx];
    if (!a) return;
    const rec = RECITERS.find((r) => r.id === s.reciter)?.name ?? "";
    navigator.mediaSession.metadata = new MediaMetadata({ title: `${nameIn(surahsRef.current, s.surah)} — آية ${a.numberInSurah}`, artist: rec, album: "Jordan Gym Reviews — روح وجسد" });
  };

  const playAt = (i: number) => {
    const el = audio.current;
    const a = q.current.ayahs[i];
    if (!el || !a) return;
    q.current.idx = i; setIdx(i); setCurSurah(q.current.surah); setCurReciter(q.current.reciter);
    el.src = a.audio;
    el.play().then(() => { setPlaying(true); setErr(""); }).catch(() => setPlaying(false));
    setMedia();
  };

  const onEnded = async () => {
    const s = q.current;
    if (s.timer && Date.now() >= s.endAt) { // time is up: finish the ayah, then stop
      setPlaying(false); setDone(true);
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
      return;
    }
    if (s.idx + 1 < s.ayahs.length) { playAt(s.idx + 1); return; }
    const ns = s.surah >= 114 ? 1 : s.surah + 1; // next surah, wraps after 114
    try {
      const list = await loadSurah(ns, s.reciter);
      s.surah = ns; s.ayahs = list; setAyahs(list);
      playAt(0);
    } catch { setPlaying(false); setErr("انقطع الاتصال. اضغط تشغيل مرة ثانية."); }
  };
  const endedRef = useRef(onEnded);
  useEffect(() => { endedRef.current = onEnded; });

  const ensureAudio = () => {
    if (audio.current) return audio.current;
    const el = new Audio();
    el.preload = "auto";
    el.addEventListener("ended", () => void endedRef.current());
    el.addEventListener("error", () => {
      if (!el.getAttribute("src")) return; // clearing the source on stop() is not a failure
      setPlaying(false); setErr("تعذّر تشغيل الصوت. جرّب قارئ ثاني أو أعد المحاولة.");
    });
    el.addEventListener("play", () => setPlaying(true));
    el.addEventListener("pause", () => setPlaying(false));
    audio.current = el;
    if ("mediaSession" in navigator) {
      const ms = navigator.mediaSession;
      ms.setActionHandler("play", () => { void audio.current?.play(); });
      ms.setActionHandler("pause", () => audio.current?.pause());
      ms.setActionHandler("previoustrack", () => { if (q.current.idx > 0) playAt(q.current.idx - 1); });
      ms.setActionHandler("nexttrack", () => { if (q.current.idx + 1 < q.current.ayahs.length) playAt(q.current.idx + 1); });
    }
    return el;
  };

  const begin = (list: Ayah[]) => {
    q.current = { ...q.current, ayahs: list, surah: prefs.surah, reciter: prefs.reciter, timer: prefs.timer, endAt: prefs.timer ? Date.now() + prefs.timer * 60_000 : 0 };
    setAyahs(list); setActive(true); setLeft(prefs.timer * 60);
    playAt(0);
  };
  const start = async () => {
    setErr(""); setDone(false);
    ensureAudio();
    const key = `${prefs.surah}|${prefs.reciter}`;
    if (pre.current?.key === key) { begin(pre.current.list); return; } // synchronous path: stays inside the user's tap
    setBusy(true);
    try { begin(await loadSurah(prefs.surah, prefs.reciter)); }
    catch { setErr("ما قدرنا نحمّل الصوت. تأكد من النت وجرّب مرة ثانية."); }
    setBusy(false);
  };

  const stop = () => {
    const el = audio.current;
    if (el) { el.pause(); el.removeAttribute("src"); el.load(); }
    q.current.ayahs = [];
    setAyahs([]); setIdx(0); setPlaying(false); setDone(false); setActive(false); setErr("");
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) navigator.mediaSession.metadata = null;
  };
  const toggle = () => {
    const el = audio.current;
    if (!el || !q.current.ayahs.length || done) return void start();
    if (el.paused) void el.play(); else el.pause();
  };
  const step = (d: number) => { const n = q.current.idx + d; if (n >= 0 && n < q.current.ayahs.length) playAt(n); };

  const setSurah = (n: number) => { if (active) stop(); setPrefs((p) => ({ ...p, surah: n })); };
  const setReciter = (id: string) => { if (active) stop(); setPrefs((p) => ({ ...p, reciter: id })); };
  const setTimer = (m: number) => setPrefs((p) => ({ ...p, timer: m }));

  return (
    <C.Provider value={{ prefs, surahs, ayahs, idx, curSurah, curReciter, playing, busy, err, left, done, active, setSurah, setReciter, setTimer, toggle: () => void toggle(), stop, step, nameOf }}>
      {children}
    </C.Provider>
  );
}

/** Small bar pinned to the bottom while something is loaded, on every page except the player's own page. */
export function QuranMiniBar() {
  const { active, playing, curSurah, ayahs, idx, nameOf, toggle, stop, step, left, prefs, done } = useQuranAudio();
  const path = usePathname();
  if (!active || path === "/rooh-w-jasad") return null;
  const a = ayahs[idx];
  const mm = `${ar(Math.floor(left / 60))}:${ar(left % 60).padStart(2, "٠")}`;
  return (
    <>
      <div className="h-20 print:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-surface/95 px-4 py-2 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/rooh-w-jasad" className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-bold">🎧 {nameOf(curSurah)}{a ? ` — آية ${ar(a.numberInSurah)}` : ""}</span>
            <span className="block text-xs text-muted">{done ? "انتهى وقت التمرين" : prefs.timer && playing ? `متبقي تقريباً ${mm}` : "افتح المشغّل"}</span>
          </Link>
          <button type="button" onClick={() => step(1)} aria-label="الآية التالية" className="size-9 rounded-full bg-white/10">⏮</button>
          <button type="button" onClick={toggle} aria-label={playing ? "إيقاف مؤقت" : "تشغيل"} className="size-11 rounded-full bg-accent font-black text-accent-foreground">{playing ? "⏸" : "▶"}</button>
          <button type="button" onClick={() => step(-1)} aria-label="الآية السابقة" className="size-9 rounded-full bg-white/10">⏭</button>
          <button type="button" onClick={stop} aria-label="إيقاف نهائي" className="size-9 rounded-full bg-white/10 text-sm">✕</button>
        </div>
      </div>
    </>
  );
}
