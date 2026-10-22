"use client";
import { useEffect, useRef, useState } from "react";

// Audio + ayah text come from AlQuran.cloud (audio served by cdn.islamic.network). Nothing is hand-typed except reciter ids.
const API = "https://api.alquran.cloud/v1";
const RECITERS = [
  { id: "ar.alafasy", name: "مشاري العفاسي" },
  { id: "ar.husary", name: "محمود الحصري" },
  { id: "ar.abdulsamad", name: "عبدالباسط عبدالصمد" },
  { id: "ar.abdurrahmaansudais", name: "عبدالرحمن السديس" },
  { id: "ar.saoodshuraym", name: "سعود الشريم" },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي" },
] as const;
const TIMERS = [15, 30, 45, 0] as const;
const KEY = "jgr-quran-player-v1";
const ar = (n: number) => n.toLocaleString("ar-EG");

const strip = (t: string) => t.replace(/[ً-ٰٟۖ-ۭ]/g, "").replace(/ٱ/g, "ا");
/** The API prefixes the Bismillah to ayah 1 of every surah except 1 and 9; show only the ayah itself. */
function ayahText(a: { numberInSurah: number; text: string }, surah: number): string {
  if (a.numberInSurah !== 1 || surah === 1 || surah === 9) return a.text;
  const w = a.text.split(" ");
  return strip(w.slice(0, 4).join(" ")) === "بسم الله الرحمن الرحيم" ? w.slice(4).join(" ") : a.text;
}

type SurahMeta = { number: number; name: string; numberOfAyahs: number };
type Ayah = { numberInSurah: number; audio: string; text: string };
type Prefs = { surah: number; reciter: string; timer: number };
const DEFAULT: Prefs = { surah: 18, reciter: RECITERS[0].id, timer: 30 };

export function QuranPlayer({ quranClass }: { quranClass: string }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [idx, setIdx] = useState(0);
  const [curSurah, setCurSurah] = useState(DEFAULT.surah);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(0); // seconds left on the timer (display only)
  const [done, setDone] = useState(false);

  const audio = useRef<HTMLAudioElement | null>(null);
  const q = useRef({ ayahs: [] as Ayah[], idx: 0, surah: DEFAULT.surah, reciter: DEFAULT.reciter as string, endAt: 0 });
  const surahsRef = useRef<SurahMeta[]>([]);
  const loadedKey = useRef("");

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
    return () => { clearTimeout(t); audio.current?.pause(); };
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} }, [prefs]);

  // countdown display only; the real stop decision is time-based in onEnded (timers get throttled when the screen is off)
  useEffect(() => {
    if (!playing || !prefs.timer) return;
    const i = setInterval(() => setLeft(Math.max(0, Math.round((q.current.endAt - Date.now()) / 1000))), 1000);
    return () => clearInterval(i);
  }, [playing, prefs.timer]);

  const nameIn = (list: SurahMeta[], n: number) => list.find((s) => s.number === n)?.name ?? `سورة ${n}`;
  const surahName = (n: number) => nameIn(surahsRef.current, n);

  const setMedia = () => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const a = q.current.ayahs[q.current.idx];
    if (!a) return;
    const rec = RECITERS.find((r) => r.id === q.current.reciter)?.name ?? "";
    navigator.mediaSession.metadata = new MediaMetadata({ title: `${surahName(q.current.surah)} — آية ${a.numberInSurah}`, artist: rec, album: "Jordan Gym Reviews — روح وجسد" });
  };

  const playAt = (i: number) => {
    const el = audio.current;
    const a = q.current.ayahs[i];
    if (!el || !a) return;
    q.current.idx = i; setIdx(i); setCurSurah(q.current.surah);
    el.src = a.audio;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    setMedia();
  };

  const loadSurah = async (surah: number, reciter: string): Promise<Ayah[]> => {
    const res = await fetch(`${API}/surah/${surah}/${reciter}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const list = (j?.data?.ayahs ?? []) as Ayah[];
    if (!list.length) throw new Error("empty");
    return list;
  };

  const onEnded = async () => {
    const s = q.current;
    if (prefs.timer && Date.now() >= s.endAt) { // time is up: finish the ayah, then stop
      setPlaying(false); setDone(true);
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
      return;
    }
    if (s.idx + 1 < s.ayahs.length) { playAt(s.idx + 1); return; }
    // next surah (wraps after 114)
    const ns = s.surah >= 114 ? 1 : s.surah + 1;
    try {
      const list = await loadSurah(ns, s.reciter);
      s.surah = ns; s.ayahs = list; setAyahs(list); setPrefs((p) => ({ ...p, surah: ns })); loadedKey.current = `${ns}|${s.reciter}`;
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
    el.addEventListener("error", () => { setPlaying(false); setErr("تعذّر تشغيل الصوت. جرّب قارئ ثاني أو أعد المحاولة."); });
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

  const start = async () => {
    setErr(""); setDone(false); setBusy(true);
    const el = ensureAudio();
    el.src = ""; // keep the user gesture alive on iOS: touch the element synchronously
    try {
      const key = `${prefs.surah}|${prefs.reciter}`;
      let list = q.current.ayahs;
      if (loadedKey.current !== key || !list.length) { list = await loadSurah(prefs.surah, prefs.reciter); loadedKey.current = key; }
      q.current = { ...q.current, ayahs: list, surah: prefs.surah, reciter: prefs.reciter, endAt: prefs.timer ? Date.now() + prefs.timer * 60_000 : 0 };
      setAyahs(list); setLeft(prefs.timer * 60);
      playAt(0);
    } catch { setErr("ما قدرنا نحمّل الصوت. تأكد من النت وجرّب مرة ثانية."); }
    setBusy(false);
  };
  const toggle = () => {
    const el = audio.current;
    if (!el || !q.current.ayahs.length) return void start();
    if (el.paused) { if (done) return void start(); void el.play(); } else el.pause();
  };
  const stop = () => { audio.current?.pause(); if (audio.current) audio.current.removeAttribute("src"); q.current.ayahs = []; loadedKey.current = ""; setAyahs([]); setIdx(0); setPlaying(false); setDone(false); };
  const step = (d: number) => { const n = q.current.idx + d; if (n >= 0 && n < q.current.ayahs.length) playAt(n); };

  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm ring-1 ring-white/10 ${on ? "bg-accent font-bold text-accent-foreground" : "bg-background/50 hover:ring-accent"}`;
  const cur = ayahs[idx];
  const mm = (s: number) => `${ar(Math.floor(s / 60))}:${ar(s % 60).padStart(2, "٠")}`;
  const active = ayahs.length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
        <p className="mb-3 text-center text-sm font-bold">🎧 استمع وأنت بتتمرن</p>

        <label className="block text-xs text-muted">السورة
          <select value={prefs.surah} onChange={(e) => { stop(); setPrefs((p) => ({ ...p, surah: Number(e.target.value) })); }}
            className="mt-1 w-full rounded-xl bg-background px-3 py-2.5 text-base text-foreground ring-1 ring-white/10 outline-none focus:ring-accent">
            {(surahs.length ? surahs : Array.from({ length: 114 }, (_, i) => ({ number: i + 1, name: `سورة ${i + 1}`, numberOfAyahs: 0 }))).map((s) => (
              <option key={s.number} value={s.number}>{ar(s.number)}. {s.name}</option>
            ))}
          </select>
        </label>

        <p className="mt-4 mb-2 text-xs text-muted">القارئ</p>
        <div className="flex flex-wrap gap-2">
          {RECITERS.map((r) => <button key={r.id} type="button" aria-pressed={prefs.reciter === r.id} onClick={() => { stop(); setPrefs((p) => ({ ...p, reciter: r.id })); }} className={chip(prefs.reciter === r.id)}>{r.name}</button>)}
        </div>

        <p className="mt-4 mb-2 text-xs text-muted">مدة التمرين (بعدها بنوقف عند نهاية الآية)</p>
        <div className="flex flex-wrap gap-2">
          {TIMERS.map((t) => <button key={t} type="button" aria-pressed={prefs.timer === t} onClick={() => setPrefs((p) => ({ ...p, timer: t }))} className={chip(prefs.timer === t)}>{t === 0 ? "بدون توقف" : `${ar(t)} دقيقة`}</button>)}
        </div>

        <div className="mt-6 rounded-2xl bg-background p-4 text-center ring-1 ring-white/10">
          {cur ? (
            <>
              <p className="text-xs text-muted">{nameIn(surahs, curSurah)} — آية {ar(cur.numberInSurah)} من {ar(ayahs.length)}</p>
              <p className={`${quranClass} mt-3 text-2xl leading-loose`} dir="rtl">{ayahText(cur, curSurah)}</p>
            </>
          ) : <p className="text-sm text-muted">{done ? "انتهى وقت التمرين. تقبّل الله منك 🤍" : "اختار السورة والقارئ ودوس تشغيل."}</p>}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" onClick={() => step(1)} disabled={!active} aria-label="الآية التالية" className="size-11 rounded-full bg-white/10 text-lg disabled:opacity-30">⏮</button>
          <button type="button" onClick={toggle} disabled={busy} aria-label={playing ? "إيقاف مؤقت" : "تشغيل"} className="size-16 rounded-full bg-accent text-2xl font-black text-accent-foreground ring-4 ring-accent/30 transition active:scale-95 disabled:opacity-50">{busy ? "…" : playing ? "⏸" : "▶"}</button>
          <button type="button" onClick={() => step(-1)} disabled={!active} aria-label="الآية السابقة" className="size-11 rounded-full bg-white/10 text-lg disabled:opacity-30">⏭</button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted">
          {prefs.timer > 0 && active && !done && <span>متبقي تقريباً {mm(left)}</span>}
          {active && <button type="button" onClick={stop} className="underline">إيقاف نهائي</button>}
        </div>
        {err && <p role="alert" className="mt-3 text-center text-sm text-red-300">{err}</p>}
      </div>

      <div className="rounded-2xl bg-surface p-4 text-xs leading-relaxed text-muted ring-1 ring-white/10">
        <p>🔒 بيكمّل الصوت لما تطفي الشاشة، وبيطلع تحكم (تشغيل/إيقاف/السابق/التالي) على شاشة القفل. بعض المتصفحات والأجهزة بتختلف بهالشي، خصوصاً مع وضع توفير الطاقة.</p>
        <p className="mt-2">التلاوات من <b>AlQuran.cloud</b> (Islamic Network)، وحقوقها لقرّائها. إذا لاحظت أي مشكلة بتسجيل، تواصل معنا ونزيله فوراً.</p>
      </div>
    </div>
  );
}
