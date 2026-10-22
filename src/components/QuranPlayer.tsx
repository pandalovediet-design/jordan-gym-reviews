"use client";
import { ayahText, RECITERS, TIMERS, useQuranAudio } from "@/components/QuranAudio";

const ar = (n: number) => n.toLocaleString("ar-EG");

export function QuranPlayer({ quranClass }: { quranClass: string }) {
  const { prefs, surahs, ayahs, idx, curSurah, playing, busy, err, left, done, active, setSurah, setReciter, setTimer, toggle, stop, step, nameOf } = useQuranAudio();
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm ring-1 ring-white/10 ${on ? "bg-accent font-bold text-accent-foreground" : "bg-background/50 hover:ring-accent"}`;
  const cur = ayahs[idx];
  const mm = (s: number) => `${ar(Math.floor(s / 60))}:${ar(s % 60).padStart(2, "٠")}`;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
        <p className="mb-3 text-center text-sm font-bold">🎧 استمع وأنت بتتمرن</p>

        <label className="block text-xs text-muted">السورة
          <select value={prefs.surah} onChange={(e) => setSurah(Number(e.target.value))}
            className="mt-1 w-full rounded-xl bg-background px-3 py-2.5 text-base text-foreground ring-1 ring-white/10 outline-none focus:ring-accent">
            {(surahs.length ? surahs : Array.from({ length: 114 }, (_, i) => ({ number: i + 1, name: `سورة ${i + 1}`, numberOfAyahs: 0 }))).map((s) => (
              <option key={s.number} value={s.number}>{ar(s.number)}. {s.name}</option>
            ))}
          </select>
        </label>

        <p className="mt-4 mb-2 text-xs text-muted">القارئ</p>
        <div className="flex flex-wrap gap-2">
          {RECITERS.map((r) => <button key={r.id} type="button" aria-pressed={prefs.reciter === r.id} onClick={() => setReciter(r.id)} className={chip(prefs.reciter === r.id)}>{r.name}</button>)}
        </div>

        <p className="mt-4 mb-2 text-xs text-muted">مدة التمرين (بعدها بنوقف عند نهاية الآية)</p>
        <div className="flex flex-wrap gap-2">
          {TIMERS.map((t) => <button key={t} type="button" aria-pressed={prefs.timer === t} onClick={() => setTimer(t)} className={chip(prefs.timer === t)}>{t === 0 ? "بدون توقف" : `${ar(t)} دقيقة`}</button>)}
        </div>

        <div className="mt-6 rounded-2xl bg-background p-4 text-center ring-1 ring-white/10">
          {cur ? (
            <>
              <p className="text-xs text-muted">{nameOf(curSurah)} — آية {ar(cur.numberInSurah)} من {ar(ayahs.length)}</p>
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
        <p>🔒 بيكمّل الصوت لما تطفي الشاشة ولما تتنقل بين صفحات الموقع (بيظهر شريط تحكم صغير تحت). كمان بيطلع تحكم على شاشة القفل. بعض الأجهزة بتختلف بهالشي، خصوصاً مع توفير الطاقة، وإذا عملت تحديث للصفحة بيوقف.</p>
        <p className="mt-2">التلاوات من <b>AlQuran.cloud</b> (Islamic Network)، وحقوقها لقرّائها. إذا لاحظت أي مشكلة بتسجيل، تواصل معنا ونزيله فوراً.</p>
      </div>
    </div>
  );
}
