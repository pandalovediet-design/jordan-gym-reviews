"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ACTIVITY, GOALS, calc, type CalcOk, type Goal, type Sex } from "@/lib/body-calc";

const KEY = "jgr-nd-calc-v1";
const nf = (x: number) => x.toLocaleString("en");

/** Print-style report. Inline hex colours on purpose: html2canvas can't read Tailwind v4 oklch colours. */
function Report({ r, sex, goal, f, activity, innerRef }: { r: CalcOk; sex: Sex; goal: Goal; f: { age: string; height: string; weight: string }; activity: number; innerRef: React.RefObject<HTMLDivElement | null> }) {
  const box = { background: "#f3f6f5", borderRadius: 12, padding: "12px 8px", textAlign: "center" as const };
  const cell = (k: string, v: string) => <div style={box}><div style={{ fontSize: 12, color: "#5b6b66" }}>{k}</div><div style={{ fontSize: 22, fontWeight: 800, color: "#0b2a24" }}>{v}</div></div>;
  const act = ACTIVITY.find((a) => a.v === activity)?.label ?? "";
  return (
    <div ref={innerRef} dir="rtl" style={{ position: "fixed", left: -10000, top: 0, width: 794, background: "#ffffff", color: "#0b2a24", fontFamily: "system-ui, 'Segoe UI', Tahoma, sans-serif", padding: 40, boxSizing: "border-box" }} aria-hidden>
      <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: "3px solid #10b981", paddingBottom: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={64} height={64} style={{ borderRadius: 32, objectFit: "cover" }} />
        <div><div style={{ fontSize: 24, fontWeight: 900 }}>GYMJO</div><div style={{ fontSize: 13, color: "#5b6b66" }}>من غير حرمان — تقرير السعرات والماكروز</div></div>
      </div>
      <div style={{ marginTop: 18, fontSize: 14, color: "#33443f" }}>{sex === "m" ? "ذكر" : "أنثى"} · {f.age} سنة · {f.height} سم · {f.weight} كغ · {act}</div>
      <div style={{ marginTop: 16, background: "#10b981", color: "#04201a", borderRadius: 16, padding: 22, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>سعراتك اليومية — {GOALS[goal].label}</div>
        <div style={{ fontSize: 48, fontWeight: 900 }}>{nf(r.target)} سعرة</div>
        <div style={{ fontSize: 13 }}>الصيانة: {nf(r.tdee)} · الحرق الأساسي: {nf(r.bmr)}</div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>{cell("بروتين", `${r.protein}g`)}{cell("كارب", `${r.carbs}g`)}{cell("دهون", `${r.fat}g`)}</div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>{cell("الكتلة الخالية FFM", `${r.ffm} كغ`)}{cell(`كتلة الدهون (${r.bf}%)`, `${r.fm} كغ`)}{cell("FFMI", `${r.ffmi}`)}</div>
      <div style={{ marginTop: 14, textAlign: "center", fontSize: 15 }}>💧 مي: حوالي <b>{r.waterL}</b> لتر باليوم</div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>توزيع الوجبات</div>
        {r.meals.map((m) => <div key={m.key} style={{ display: "flex", justifyContent: "space-between", background: "#f3f6f5", borderRadius: 10, padding: "10px 14px", marginBottom: 8, fontSize: 14, lineHeight: 1.5 }}><span>{m.label}</span><span style={{ color: "#5b6b66" }}>{m.kcal} سعرة · {m.protein}g بروتين</span></div>)}
      </div>
      <div style={{ marginTop: 22, fontSize: 11, lineHeight: 1.7, color: "#5b6b66", borderTop: "1px solid #d5dedb", paddingTop: 12 }}>
        تقدير تقريبي وليس نصيحة طبية. الحرق الأساسي بطريقة {r.bmrMethod === "katch" ? "Katch-McArdle" : "Mifflin-St Jeor"}. إذا عندك مرض مزمن أو حمل راجع مختص قبل أي تغيير بأكلك.
        <div style={{ marginTop: 6, color: "#0b2a24", fontWeight: 700 }}>jordan-gym-reviews.vercel.app/no-deprivation</div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const n = (v: string) => (v.trim() === "" ? null : Number(v));
const Stat = ({ k, v, sub }: { k: string; v: string; sub?: string }) => (
  <div className="rounded-xl bg-background/60 p-3 text-center ring-1 ring-white/10"><p className="text-[11px] text-muted">{k}</p><p className="text-lg font-black">{v}</p>{sub && <p className="text-[10px] text-muted">{sub}</p>}</div>
);

export function NutritionCalc() {
  const [sex, setSex] = useState<Sex>("m");
  const [f, setF] = useState({ age: "25", height: "175", weight: "75", bf: "", neck: "", waist: "", hip: "" });
  const [activity, setActivity] = useState(1.375);
  const [goal, setGoal] = useState<Goal>("maintain");
  const [adv, setAdv] = useState(false);
  const repRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (d && typeof d === "object") {
        if (d.sex === "m" || d.sex === "f") setSex(d.sex);
        if (d.f && typeof d.f === "object") setF((s) => ({ ...s, ...Object.fromEntries(Object.entries(d.f).filter(([k, v]) => k in s && typeof v === "string")) }));
        if (ACTIVITY.some((a) => a.v === d.activity)) setActivity(d.activity);
        if (d.goal in GOALS) setGoal(d.goal);
      }
    } catch {}
    setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify({ sex, f, activity, goal })); } catch {}
  }, [loaded, sex, f, activity, goal]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const r = useMemo(() => calc({ sex, age: Number(f.age), height: Number(f.height), weight: Number(f.weight), activity, goal, bodyFat: n(f.bf), neck: n(f.neck), waist: n(f.waist), hip: n(f.hip) }), [sex, f, activity, goal]);
  const download = async () => {
    if (!r.ok || !repRef.current || busy) return;
    setBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(repRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const W = 210, H = 297;
      let w = W, h = (canvas.height * W) / canvas.width;
      if (h > H) { h = H; w = (canvas.width * H) / canvas.height; }
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", (W - w) / 2, 0, w, h);
      pdf.save("jordan-gym-calories.pdf");
    } catch { alert("تعذّر إنشاء الملف، جرّب مرة ثانية."); } finally { setBusy(false); }
  };
  const share = () => {
    if (!r.ok) return;
    const txt = `سعراتي اليومية (${GOALS[goal].label}): ${nf(r.target)} سعرة\nبروتين ${r.protein}g · كارب ${r.carbs}g · دهون ${r.fat}g\nFFM ${r.ffm} كغ · مي ${r.waterL} لتر\nاحسب سعراتك: ${window.location.origin}/no-deprivation`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
      <p className="mb-3 text-center text-sm font-bold">🧮 حاسبة السعرات والـFFM</p>
      <div className="mb-3 flex justify-center gap-2 text-sm">
        {([["m", "ذكر"], ["f", "أنثى"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setSex(v)} aria-pressed={sex === v} className={`rounded-full px-5 py-1 ring-1 ring-white/10 ${sex === v ? "bg-accent font-bold text-accent-foreground" : ""}`}>{l}</button>)}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <label>العمر<input inputMode="numeric" value={f.age} onChange={set("age")} className={inp} /></label>
        <label>الطول (سم)<input inputMode="decimal" value={f.height} onChange={set("height")} className={inp} /></label>
        <label>الوزن (كغ)<input inputMode="decimal" value={f.weight} onChange={set("weight")} className={inp} /></label>
      </div>
      <label className="mt-2 block text-xs">نشاطك
        <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className={inp}>{ACTIVITY.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}</select>
      </label>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {(Object.keys(GOALS) as Goal[]).map((g) => <button key={g} type="button" onClick={() => setGoal(g)} aria-pressed={goal === g} className={`rounded-xl px-2 py-1.5 text-xs ring-1 ring-white/10 ${goal === g ? "bg-white font-bold text-black" : "bg-background/50"}`}>{GOALS[g].label}</button>)}
      </div>
      <button type="button" onClick={() => setAdv((x) => !x)} aria-expanded={adv} aria-controls="nutrition-advanced-fields" className="mt-3 rounded-md text-xs text-accent underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface">{adv ? "▲ إخفاء" : "▼ دقّة أعلى: نسبة الدهون أو القياسات"}</button>
      {adv && (
        <div id="nutrition-advanced-fields" className="mt-2 space-y-2 rounded-2xl bg-background/50 p-3 text-xs">
          <label className="block">نسبة الدهون % (إذا بتعرفها)<input inputMode="decimal" value={f.bf} onChange={set("bf")} className={inp} placeholder="مثال: 18" /></label>
          <p className="text-muted">أو قياسات الجسم (سم) لتقدير نسبة الدهون بطريقة البحرية الأمريكية:</p>
          <div className="grid grid-cols-3 gap-2">
            <label>الرقبة<input inputMode="decimal" value={f.neck} onChange={set("neck")} className={inp} /></label>
            <label>الخصر (عند السرّة)<input inputMode="decimal" value={f.waist} onChange={set("waist")} className={inp} /></label>
            {sex === "f" && <label>الورك<input inputMode="decimal" value={f.hip} onChange={set("hip")} className={inp} /></label>}
          </div>
        </div>
      )}

      <div className="mt-4" aria-live="polite">
        {!r.ok ? <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-center text-xs text-red-200 ring-1 ring-red-400/30">{r.error}</p> : (
          <>
            <div className="rounded-2xl bg-accent p-4 text-center text-accent-foreground">
              <p className="text-xs font-bold opacity-80">سعراتك اليومية — {GOALS[goal].label}</p>
              <p className="text-4xl font-black">{r.target.toLocaleString("en")} <span className="text-base">سعرة</span></p>
              <p className="text-[11px] opacity-80">الصيانة: {r.tdee.toLocaleString("en")} · الحرق الأساسي: {r.bmr.toLocaleString("en")}</p>
            </div>
            {r.clamped && <p className="mt-2 rounded-xl bg-amber-500/10 p-2 text-[11px] text-amber-200 ring-1 ring-amber-400/30">رفعنا الرقم لحد أدنى آمن، العجز الكبير مش مناسب بدون إشراف مختص.</p>}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat k="بروتين" v={`${r.protein}g`} /><Stat k="كارب" v={`${r.carbs}g`} /><Stat k="دهون" v={`${r.fat}g`} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Stat k="الكتلة الخالية FFM" v={`${r.ffm} كغ`} /><Stat k="كتلة الدهون" v={`${r.fm} كغ`} sub={`${r.bf}% ${r.bfSource === "manual" ? "(مدخلة)" : r.bfSource === "navy" ? "(قياسات)" : "(تقدير BMI)"}`} /><Stat k="FFMI" v={`${r.ffmi}`} sub={`BMI ${r.bmi}`} />
            </div>
            <p className="mt-2 text-center text-xs">💧 مي: حوالي <b>{r.waterL}</b> لتر باليوم</p>
            <ul className="mt-3 space-y-1 text-xs">
              {r.meals.map((m) => <li key={m.key} className="flex justify-between rounded-lg bg-background/50 px-3 py-1.5"><span>{m.label}</span><span className="text-muted">{m.kcal} سعرة · {m.protein}g بروتين</span></li>)}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={download} disabled={busy} aria-busy={busy} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-black hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{busy ? "جارٍ تجهيز الملف..." : "📄 تنزيل PDF"}</button>
              <button type="button" onClick={share} className="rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-black hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">واتساب 💬</button>
            </div>
            <Report r={r} sex={sex} goal={goal} f={f} activity={activity} innerRef={repRef} />
            <p className="mt-3 text-[10px] leading-relaxed text-muted">تقدير تقريبي وليس نصيحة طبية. الحرق الأساسي بطريقة {r.bmrMethod === "katch" ? "Katch-McArdle (على FFM)" : "Mifflin-St Jeor"}. اعمل متابعة كل 2-3 أسابيع وعدّل حسب نتيجتك.</p>
          </>
        )}
      </div>
    </div>
  );
}
