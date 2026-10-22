"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Passage, RestContent } from "@/lib/quran";

const DURATIONS = [30, 60, 120, 180] as const;
const PREF = "jgr-rest-prefs-v1";
const ar = (n: number) => n.toLocaleString("ar-EG");
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const label = (d: number) => (d < 60 ? `${d} ثانية` : d === 60 ? "دقيقة" : `${d / 60} دقائق`);

function ref(p: Passage) {
  return p.from === p.to ? `سورة ${p.surahName} — الآية ${ar(p.from)}` : `سورة ${p.surahName} — الآيات ${ar(p.from)}–${ar(p.to)}`;
}

export function RestTimer({ content, quranClass }: { content: RestContent; quranClass: string }) {
  const [dur, setDur] = useState<number>(60);
  const [left, setLeft] = useState<number>(60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [idx, setIdx] = useState({ short: 0, long: 0 });
  const [prefs, setPrefs] = useState({ sound: true, vibrate: true, scroll: true });
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const d = JSON.parse(localStorage.getItem(PREF) ?? "null");
        if (d && typeof d === "object") setPrefs((p) => ({ sound: d.sound !== false && p.sound, vibrate: d.vibrate !== false && p.vibrate, scroll: d.scroll !== false && p.scroll }));
      } catch {}
      setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch {}
  }, [loaded, prefs]);

  const isLong = dur >= 120;
  const pool = isLong ? content.long : content.short;
  const passage: Passage | undefined = pool.length ? pool[idx[isLong ? "long" : "short"] % pool.length] : undefined;

  const releaseLock = useCallback(() => { lockRef.current?.release().catch(() => {}); lockRef.current = null; }, []);
  const finish = useCallback(() => {
    setRunning(false); setDone(true); setLeft(0); releaseLock();
    if (prefs.vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([250, 120, 250]);
    const ctx = audioRef.current;
    if (prefs.sound && ctx) {
      try {
        [0, 0.35].forEach((off) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sine"; o.frequency.value = 660;
          g.gain.setValueAtTime(0.0001, ctx.currentTime + off);
          g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + off + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + off + 0.3);
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime + off); o.stop(ctx.currentTime + off + 0.32);
        });
      } catch {}
    }
  }, [prefs.sound, prefs.vibrate, releaseLock]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setLeft(rem);
      if (rem <= 0) finish();
    }, 250);
    return () => clearInterval(id);
  }, [running, finish]);

  // Slow auto-scroll so a long passage finishes about when the timer does.
  useEffect(() => {
    const el = boxRef.current;
    if (!running || !prefs.scroll || !isLong || !el) return;
    touched.current = false;
    el.scrollTop = 0;
    const start = Date.now(), total = dur * 1000;
    let raf = 0;
    const tick = () => {
      if (!touched.current) {
        const p = Math.min(1, (Date.now() - start) / total);
        el.scrollTop = p * Math.max(0, el.scrollHeight - el.clientHeight);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, prefs.scroll, isLong, dur]);

  useEffect(() => () => releaseLock(), [releaseLock]);

  const start = () => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC && !audioRef.current) audioRef.current = new AC();
      audioRef.current?.resume().catch(() => {});
    } catch {}
    try {
      const wl = (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
      wl?.request("screen").then((l) => { lockRef.current = l; }).catch(() => {});
    } catch {}
    setIdx((i) => ({ ...i, [isLong ? "long" : "short"]: i[isLong ? "long" : "short"] + (done || left !== dur ? 1 : 0) }));
    endRef.current = Date.now() + dur * 1000;
    setLeft(dur); setDone(false); setRunning(true);
  };
  const stop = () => { setRunning(false); setLeft(dur); setDone(false); releaseLock(); };
  const pick = (d: number) => { if (running) return; setDur(d); setLeft(d); setDone(false); };
  const other = () => setIdx((i) => ({ ...i, [isLong ? "long" : "short"]: i[isLong ? "long" : "short"] + 1 }));

  const pct = useMemo(() => (dur ? ((dur - left) / dur) * 100 : 0), [dur, left]);
  const toggle = (k: "sound" | "vibrate" | "scroll") => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  const chip = (on: boolean) => `rounded-full px-3 py-1 text-xs ring-1 ring-white/10 ${on ? "bg-accent font-bold text-accent-foreground" : "bg-background/50"}`;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
        <p className="mb-3 text-center text-sm font-bold">⏱️ مدة الراحة بين الجولات</p>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button key={d} type="button" disabled={running} onClick={() => pick(d)} aria-pressed={dur === d}
              className={`rounded-2xl px-2 py-3 text-sm ring-1 ring-white/10 transition disabled:opacity-60 ${dur === d ? "bg-accent font-extrabold text-accent-foreground" : "bg-background/50 hover:ring-accent"}`}>{label(d)}</button>
          ))}
        </div>

        <div className="mt-6 text-center" aria-live="off">
          <div className="relative mx-auto flex size-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-accent, #10b981) ${pct}%, rgba(255,255,255,0.1) 0)` }}>
            <div className="flex size-[9.5rem] items-center justify-center rounded-full bg-surface">
              <span className="text-5xl font-black tabular-nums" dir="ltr">{done ? "✓" : fmt(left)}</span>
            </div>
          </div>
          {done && <p className="mt-3 font-bold text-accent">خلصت الراحة، يلا للجولة الجاية 💪</p>}
          <div className="mt-4 flex justify-center gap-2">
            {!running ? <button type="button" onClick={start} className="rounded-xl bg-accent px-8 py-3 text-base font-extrabold text-accent-foreground hover:brightness-110">▶ ابدأ</button>
              : <button type="button" onClick={stop} className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold hover:bg-white/20">إيقاف</button>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => toggle("sound")} className={chip(prefs.sound)}>🔔 تنبيه صوتي</button>
          <button type="button" onClick={() => toggle("vibrate")} className={chip(prefs.vibrate)}>📳 اهتزاز</button>
          {isLong && <button type="button" onClick={() => toggle("scroll")} className={chip(prefs.scroll)}>⬇️ تصفح تلقائي</button>}
        </div>
      </div>

      {passage ? (
        <div className="space-y-3">
          <div className="rounded-3xl bg-gradient-to-b from-emerald-950/60 to-surface p-5 ring-1 ring-accent/30">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-accent">{ref(passage)}</p>
              <button type="button" onClick={other} disabled={running} className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20 disabled:opacity-50">{isLong ? "مقطع آخر" : "آية أخرى"}</button>
            </div>
            <div ref={boxRef} onTouchStart={() => { touched.current = true; }} onWheel={() => { touched.current = true; }}
              className={`${quranClass} ${isLong ? "max-h-72 overflow-y-auto pe-1" : ""}`} dir="rtl">
              <p className="text-center text-2xl leading-[2.4] md:text-3xl md:leading-[2.4]">
                {passage.verses.map((v) => <span key={v.n}>{v.text}{" "}<span className="text-accent">﴿{ar(v.n)}﴾</span>{" "}</span>)}
              </p>
            </div>
          </div>
          <details open={!isLong} className="rounded-2xl bg-surface p-4 ring-1 ring-white/10">
            <summary className="cursor-pointer text-sm font-bold">📖 التفسير الميسر <span className="font-normal text-muted">(تفسير وليس من القرآن)</span></summary>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted" dir="rtl">
              {passage.verses.filter((v) => v.tafsir).map((v) => <p key={v.n}>{passage.verses.length > 1 && <b className="text-foreground">({ar(v.n)}) </b>}{v.tafsir}</p>)}
            </div>
          </details>
        </div>
      ) : (
        <p className="rounded-2xl bg-surface p-4 text-center text-sm text-muted ring-1 ring-white/10">تعذّر تحميل الآيات حالياً. المؤقت شغال، وحاول تحدّث الصفحة بعد شوي.</p>
      )}
    </div>
  );
}
