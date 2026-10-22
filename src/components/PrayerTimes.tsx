"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// Prayer times: AlAdhan API, method 23 = Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan.
// Location is requested ONLY when the user taps the button; until then Amman is used.
const METHOD = 23;
const AMMAN = { lat: 31.9539, lng: 35.9106, label: "عمّان" };
const KAABA = { lat: 21.4225, lng: 39.8262 };
const KEY = "jgr-prayer-loc-v1";
const ar = (n: number) => n.toLocaleString("ar-EG");

const PRAYERS = [
  { k: "Fajr", n: "الفجر", prayer: true },
  { k: "Sunrise", n: "الشروق", prayer: false },
  { k: "Dhuhr", n: "الظهر", prayer: true },
  { k: "Asr", n: "العصر", prayer: true },
  { k: "Maghrib", n: "المغرب", prayer: true },
  { k: "Isha", n: "العشاء", prayer: true },
] as const;

type Loc = { lat: number; lng: number; label: string };
type Data = { key: string; timings: Record<string, string>; hijri: string; tz: string } | { key: string; error: true };

/** Initial bearing (degrees from true north) from a point to the Kaaba. */
export function qiblaBearing(lat: number, lng: number) {
  const r = Math.PI / 180;
  const dLng = (KAABA.lng - lng) * r;
  const y = Math.sin(dLng) * Math.cos(KAABA.lat * r);
  const x = Math.cos(lat * r) * Math.sin(KAABA.lat * r) - Math.sin(lat * r) * Math.cos(KAABA.lat * r) * Math.cos(dLng);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

const hm = (t: string) => { const [h, m] = t.slice(0, 5).split(":").map(Number); return h * 60 + m; };
const to12 = (t: string) => { const [h, m] = t.slice(0, 5).split(":").map(Number); const p = h >= 12 ? "م" : "ص"; return `${ar(h % 12 === 0 ? 12 : h % 12)}:${ar(m).padStart(2, "٠")} ${p}`; };
const fmtDur = (mins: number) => { const h = Math.floor(mins / 60), m = mins % 60; return h > 0 ? `${ar(h)} س و${ar(m)} د` : `${ar(m)} دقيقة`; };

function nowInTz(tz: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value) % 24, m = Number(parts.find((p) => p.type === "minute")?.value);
    return h * 60 + m;
  } catch { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
}

export function PrayerTimes() {
  const [loc, setLoc] = useState<Loc>(AMMAN);
  const [data, setData] = useState<Data | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassMsg, setCompassMsg] = useState("");
  const stopCompass = useRef<(() => void) | null>(null);

  const today = useMemo(() => { const d = new Date(); return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`; }, []);
  const key = `${loc.lat},${loc.lng},${today}`;

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const d = JSON.parse(localStorage.getItem(KEY) ?? "null");
        if (d && Number.isFinite(d.lat) && Number.isFinite(d.lng) && Math.abs(d.lat) <= 90 && Math.abs(d.lng) <= 180) setLoc({ lat: d.lat, lng: d.lng, label: "موقعك" });
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let live = true;
    fetch(`https://api.aladhan.com/v1/timings/${today}?latitude=${loc.lat}&longitude=${loc.lng}&method=${METHOD}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!live) return;
        const tm = j?.data?.timings, h = j?.data?.date?.hijri;
        if (!tm || !PRAYERS.every((p) => typeof tm[p.k] === "string")) throw new Error("bad shape");
        setData({ key, timings: tm, hijri: h ? `${ar(Number(h.day))} ${h.month?.ar ?? ""} ${ar(Number(h.year))}هـ` : "", tz: j.data.meta?.timezone ?? "Asia/Amman" });
      })
      .catch(() => { if (live) setData({ key, error: true }); });
    return () => { live = false; };
  }, [loc.lat, loc.lng, today, key]);

  useEffect(() => { const i = setInterval(() => setTick((x) => x + 1), 20_000); return () => clearInterval(i); }, []);
  useEffect(() => () => stopCompass.current?.(), []);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) { setGeoMsg("جهازك ما بدعم تحديد الموقع."); return; }
    setGeoBusy(true); setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = Math.round(p.coords.latitude * 100) / 100, lng = Math.round(p.coords.longitude * 100) / 100;
        setLoc({ lat, lng, label: "موقعك" }); setGeoBusy(false);
        try { localStorage.setItem(KEY, JSON.stringify({ lat, lng })); } catch {}
      },
      (e) => { setGeoBusy(false); setGeoMsg(e.code === 1 ? "ما سمحت بالموقع. بنكمل على عمّان، وبتقدر تسمح من إعدادات المتصفح." : "ما قدرنا نحدد موقعك. جرّب مرة ثانية."); },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };
  const resetLoc = () => { setLoc(AMMAN); setHeading(null); stopCompass.current?.(); try { localStorage.removeItem(KEY); } catch {} };

  const ready = data && data.key === key && !("error" in data) ? data : null;
  const failed = data && data.key === key && "error" in data;
  void tick;
  const info = (() => {
    if (!ready) return null;
    const now = nowInTz(ready.tz);
    const list = PRAYERS.filter((p) => p.prayer).map((p) => ({ ...p, m: hm(ready.timings[p.k]) }));
    const next = list.find((p) => p.m > now);
    if (next) return { next, left: next.m - now, tomorrow: false };
    const f = list[0];
    return { next: f, left: f.m + 1440 - now, tomorrow: true };
  })();

  const bearing = qiblaBearing(loc.lat, loc.lng);

  const startCompass = async () => {
    setCompassMsg("");
    try {
      const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
      if (!DOE) { setCompassMsg("جهازك ما فيه حساس بوصلة. استخدم الزاوية المكتوبة."); return; }
      if (typeof DOE.requestPermission === "function") {
        const r = await DOE.requestPermission();
        if (r !== "granted") { setCompassMsg("ما سمحت بحساس الاتجاه."); return; }
      }
      stopCompass.current?.();
      let got = false;
      const onO = (e: Event) => {
        const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
        let h: number | null = null;
        if (typeof ev.webkitCompassHeading === "number") h = ev.webkitCompassHeading;
        else if (ev.absolute && typeof ev.alpha === "number") h = (360 - ev.alpha) % 360;
        if (h !== null) { got = true; setHeading(h); }
      };
      window.addEventListener("deviceorientationabsolute", onO as EventListener, true);
      window.addEventListener("deviceorientation", onO as EventListener, true);
      stopCompass.current = () => { window.removeEventListener("deviceorientationabsolute", onO as EventListener, true); window.removeEventListener("deviceorientation", onO as EventListener, true); stopCompass.current = null; };
      setTimeout(() => { if (!got) setCompassMsg("ما وصلتنا قراءة من البوصلة. استخدم الزاوية المكتوبة."); }, 2500);
    } catch { setCompassMsg("تعذّر تشغيل البوصلة."); }
  };

  const rot = heading === null ? bearing : (bearing - heading + 360) % 360;
  const aligned = heading !== null && (rot < 6 || rot > 354);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold">🕌 مواقيت الصلاة — {loc.label}</p>
          {ready?.hijri && <span className="text-xs text-muted">{ready.hijri}</span>}
        </div>
        <p className="text-xs text-muted">حسب طريقة وزارة الأوقاف الأردنية.</p>

        {info && ready && (
          <div className="mt-4 rounded-2xl bg-accent/15 p-4 text-center ring-1 ring-accent/40">
            <p className="text-xs text-muted">الصلاة الجاية{info.tomorrow ? " (بكرة)" : ""}</p>
            <p className="mt-1 text-3xl font-black text-accent">{info.next.n} <span className="text-foreground">{to12(ready.timings[info.next.k])}</span></p>
            <p className="mt-1 text-sm">بعد {fmtDur(info.left)}</p>
          </div>
        )}
        {!ready && !failed && <p className="mt-4 text-center text-sm text-muted">عم نجيب المواقيت…</p>}
        {failed && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-200">تعذّر تحميل المواقيت حالياً. تأكد من النت وحاول بعد شوي.</p>}

        {ready && (
          <ul className="mt-4 divide-y divide-white/10 text-base">
            {PRAYERS.map((p) => {
              const isNext = info && !info.tomorrow ? info.next.k === p.k : info && info.tomorrow ? p.k === "Fajr" : false;
              return (
                <li key={p.k} className={`flex items-center justify-between py-2.5 ${isNext ? "font-extrabold text-accent" : p.prayer ? "" : "text-muted"}`}>
                  <span>{p.n}</span><span className="tabular-nums">{to12(ready.timings[p.k])}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <button type="button" onClick={useMyLocation} disabled={geoBusy} className="rounded-full bg-accent px-4 py-1.5 font-bold text-accent-foreground hover:brightness-110 disabled:opacity-60">
            {geoBusy ? "عم نحدد…" : "📍 استخدم موقعي"}
          </button>
          {loc.label === "موقعك" && <button type="button" onClick={resetLoc} className="rounded-full bg-white/10 px-4 py-1.5 hover:bg-white/20">رجّعني لعمّان</button>}
        </div>
        {geoMsg && <p className="mt-2 text-xs text-amber-200">{geoMsg}</p>}
        <p className="mt-2 text-[11px] leading-relaxed text-muted">موقعك ما بنطلبه إلا لما تضغط الزر، وبنحفظه بجهازك بس (مقرّب لمنطقتك) وما بنرسله لأي سيرفر عندنا. المواقيت من AlAdhan، وللتأكد الرسمي ارجع لمسجد منطقتك أو وزارة الأوقاف.</p>
      </div>

      <div className="rounded-3xl bg-surface p-5 text-center ring-1 ring-white/10">
        <p className="text-sm font-bold">🧭 اتجاه القبلة</p>
        <p className="mt-1 text-xs text-muted">من {loc.label}: <b className="text-foreground">{ar(Math.round(bearing))}°</b> من الشمال باتجاه عقارب الساعة</p>
        <div className={`relative mx-auto mt-4 size-48 rounded-full ring-4 transition ${aligned ? "bg-accent/20 ring-accent" : "bg-background ring-white/15"}`}>
          <span className="absolute start-1/2 top-1 -translate-x-1/2 text-xs text-muted">{heading === null ? "ش" : "أمامك"}</span>
          <div className="absolute inset-0 transition-transform duration-200" style={{ transform: `rotate(${rot}deg)` }}>
            <span className="absolute start-1/2 top-3 -translate-x-1/2 text-2xl">🕋</span>
            <span className="absolute start-1/2 top-11 h-[calc(50%-2.75rem)] w-1 -translate-x-1/2 rounded-full bg-accent" />
          </div>
          <span className="absolute start-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        </div>
        {heading === null ? (
          <>
            <p className="mt-3 text-xs text-muted">الصورة فوق بتوضح الزاوية بالنسبة للشمال. شغّل البوصلة عشان تتحرك حسب اتجاه موبايلك.</p>
            <button type="button" onClick={startCompass} className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20">🧭 شغّل البوصلة</button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm">{aligned ? "✅ موبايلك صار باتجاه القبلة" : "لفّ موبايلك لحد ما السهم يصير لفوق"}</p>
            <button type="button" onClick={() => { stopCompass.current?.(); setHeading(null); }} className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20">إيقاف البوصلة</button>
          </>
        )}
        {compassMsg && <p className="mt-2 text-xs text-amber-200">{compassMsg}</p>}
        <p className="mt-3 text-[11px] leading-relaxed text-muted">حساس البوصلة بتتأثر بالمعادن والأجهزة (والجيم مليان!). ابعد عن الحديد، وحرّك الموبايل بشكل رقم 8 لمعايرته، وتأكد من اتجاه محراب أقرب مسجد.</p>
      </div>
    </div>
  );
}
