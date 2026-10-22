"use client";
import { useState } from "react";

// ───────────── MOCK DATA (design preview only: nothing here touches the database) ─────────────
type Group = "chest" | "shoulders" | "biceps" | "abs" | "quads" | "back" | "triceps" | "glutes" | "hamstrings" | "calves";
const GROUP_LABEL: Record<Group, string> = {
  chest: "الصدر", shoulders: "الأكتاف", biceps: "البايسبس", abs: "البطن", quads: "الفخذ الأمامي",
  back: "الظهر", triceps: "الترايسبس", glutes: "المؤخرة", hamstrings: "الفخذ الخلفي", calves: "السمانة",
};
type Trainer = { name: string; city: string; years: number; photo: string; wa: string; steps: string[]; mistake: string };
type Exercise = { id: string; name: string; group: Group; secondary: string; level: string; gear: string; cover: string; trainers: Trainer[] };

const T = (name: string, city: string, years: number, n: number, steps: string[], mistake: string): Trainer =>
  ({ name, city, years, photo: `/demo/demo-coach-${n}.webp`, wa: "962790000000", steps, mistake });

const EXERCISES: Exercise[] = [
  { id: "db-press", name: "ضغط الدمبل للصدر", group: "chest", secondary: "الأكتاف الأمامية، الترايسبس", level: "مبتدئ", gear: "دمبل + بنش", cover: "/demo/demo-gym-1.webp", trainers: [
    T("الكابتن خالد", "عمّان", 9, 1, ["استلقِ على البنش وثبّت قدميك بالأرض.", "نزّل الدمبل ببطء حتى مستوى الصدر.", "ادفع للأعلى وازفر عند أعلى نقطة."], "رفع الأكتاف للأذنين أثناء الدفع."),
    T("الكابتن ريم", "إربد", 6, 2, ["أبقِ لوحي الكتف مشدودين للخلف.", "الزاوية بين الذراع والجذع 45 درجة.", "تحكّم بالنزول 3 ثواني."], "فرد المرفقين بقوة بأعلى نقطة."),
  ] },
  { id: "pushup", name: "تمرين الضغط", group: "chest", secondary: "الترايسبس، البطن", level: "مبتدئ", gear: "بدون معدات", cover: "/demo/demo-gym-2.webp", trainers: [
    T("الكابتن يزن", "عمّان", 5, 3, ["يدين أعرض قليلاً من الكتفين.", "جسمك خط مستقيم من الرأس للكعبين.", "انزل حتى يلمس صدرك الأرض تقريباً."], "هبوط الحوض أو رفعه للأعلى."),
  ] },
  { id: "ohp", name: "ضغط الأكتاف", group: "shoulders", secondary: "الترايسبس", level: "متوسط", gear: "دمبل", cover: "/demo/demo-gym-3.webp", trainers: [
    T("الكابتن سامي", "الزرقاء", 8, 1, ["اجلس بظهر مستقيم ودمبل بمستوى الأذن.", "ادفع للأعلى حتى فرد الذراعين.", "نزّل ببطء ولا تُسقط الوزن."], "تقوّس أسفل الظهر."),
  ] },
  { id: "curl", name: "كيرل الدمبل", group: "biceps", secondary: "الساعد", level: "مبتدئ", gear: "دمبل", cover: "/demo/demo-coach-2.webp", trainers: [
    T("الكابتن هبة", "عمّان", 7, 2, ["ثبّت المرفقين بجانب جسمك.", "ارفع الدمبل مع لف الكف للأعلى.", "نزّل بتحكّم ولا تتأرجح."], "تأرجح الجذع لرفع وزن أثقل."),
  ] },
  { id: "plank", name: "البلانك", group: "abs", secondary: "الكتفين، أسفل الظهر", level: "مبتدئ", gear: "بدون معدات", cover: "/demo/demo-arena-1.webp", trainers: [
    T("الكابتن دانا", "عمّان", 4, 3, ["ارتكز على الساعدين والمرفقين تحت الكتف.", "شدّ البطن والمؤخرة.", "تنفّس بانتظام وثبّت 30 ثانية."], "رفع الحوض أو ترك الظهر ينخفض."),
  ] },
  { id: "squat", name: "سكوات", group: "quads", secondary: "المؤخرة، الفخذ الخلفي", level: "متوسط", gear: "بار أو بدون", cover: "/demo/demo-gym-1.webp", trainers: [
    T("الكابتن مالك", "عمّان", 10, 1, ["قدمين بعرض الكتفين وأصابع للخارج قليلاً.", "انزل كأنك تجلس على كرسي.", "ادفع بالكعبين للأعلى."], "دخول الركبتين للداخل."),
    T("الكابتن لجين", "العقبة", 5, 2, ["شدّ الجذع قبل النزول.", "الركبة بنفس اتجاه أصابع القدم.", "انزل لمستوى الفخذ موازي للأرض."], "رفع الكعبين عن الأرض."),
  ] },
  { id: "row", name: "سحب الدمبل", group: "back", secondary: "البايسبس", level: "متوسط", gear: "دمبل + بنش", cover: "/demo/demo-gym-2.webp", trainers: [
    T("الكابتن فادي", "السلط", 8, 3, ["ركبة ويد على البنش وظهر مستقيم.", "اسحب الدمبل نحو الحوض.", "اعصر لوحي الكتف بأعلى نقطة."], "لف الجذع مع السحب."),
  ] },
  { id: "dips", name: "غطس الترايسبس", group: "triceps", secondary: "الصدر السفلي", level: "متوسط", gear: "بنش أو متوازي", cover: "/demo/demo-gym-3.webp", trainers: [
    T("الكابتن نور", "عمّان", 6, 1, ["يدين خلفك على البنش.", "نزّل الجسم حتى 90 درجة بالمرفق.", "ادفع للأعلى دون قفل المرفق."], "إبعاد الجسم كثيراً عن البنش."),
  ] },
  { id: "bridge", name: "جسر المؤخرة", group: "glutes", secondary: "الفخذ الخلفي", level: "مبتدئ", gear: "بدون معدات", cover: "/demo/demo-arena-2.webp", trainers: [
    T("الكابتن عدي", "عمّان", 3, 2, ["استلقِ وثني الركبتين.", "ارفع الحوض واعصر المؤخرة.", "اثبت ثانيتين ونزّل ببطء."], "الدفع بأسفل الظهر بدل المؤخرة."),
  ] },
  { id: "rdl", name: "ديدليفت روماني", group: "hamstrings", secondary: "المؤخرة، أسفل الظهر", level: "متقدم", gear: "بار أو دمبل", cover: "/demo/demo-gym-1.webp", trainers: [
    T("الكابتن خالد", "عمّان", 9, 3, ["ركبتين مثنيتين قليلاً.", "ادفع الحوض للخلف مع ظهر مستقيم.", "انزل لمنتصف الساق وارجع بالمؤخرة."], "تقوّس الظهر عند النزول."),
  ] },
  { id: "calf", name: "رفع السمانة", group: "calves", secondary: "—", level: "مبتدئ", gear: "درجة أو بدون", cover: "/demo/demo-arena-3.webp", trainers: [
    T("الكابتن سامي", "الزرقاء", 8, 2, ["قف على حافة درجة.", "ارتفع على أطراف الأصابع.", "نزّل الكعب أسفل الدرجة بتحكّم."], "قصر مدى الحركة."),
  ] },
];

// ───────────── BODY MAP ─────────────
type Shape = { g: Group; d: string };
const FRONT: Shape[] = [
  { g: "shoulders", d: "M58 98 q-14 6 -14 22 q8 4 16 0 q4 -12 -2 -22z" }, { g: "shoulders", d: "M142 98 q14 6 14 22 q-8 4 -16 0 q-4 -12 2 -22z" },
  { g: "chest", d: "M64 100 q18 -6 34 2 v28 q-18 6 -34 -4z" }, { g: "chest", d: "M136 100 q-18 -6 -34 2 v28 q18 6 34 -4z" },
  { g: "biceps", d: "M44 126 q-6 20 -4 38 q8 4 14 0 q2 -20 6 -34z" }, { g: "biceps", d: "M156 126 q6 20 4 38 q-8 4 -14 0 q-2 -20 -6 -34z" },
  { g: "abs", d: "M80 136 h40 q2 36 -2 62 h-36 q-4 -26 -2 -62z" },
  { g: "quads", d: "M70 206 q-8 40 -6 82 q10 6 20 0 q4 -42 2 -82z" }, { g: "quads", d: "M130 206 q8 40 6 82 q-10 6 -20 0 q-4 -42 -2 -82z" },
  { g: "calves", d: "M66 298 q-4 30 -2 62 q8 4 16 0 q2 -32 0 -62z" }, { g: "calves", d: "M134 298 q4 30 2 62 q-8 4 -16 0 q-2 -32 0 -62z" },
];
const BACK: Shape[] = [
  { g: "shoulders", d: "M58 98 q-14 6 -14 22 q8 4 16 0 q4 -12 -2 -22z" }, { g: "shoulders", d: "M142 98 q14 6 14 22 q-8 4 -16 0 q-4 -12 2 -22z" },
  { g: "back", d: "M66 98 h68 q4 40 -8 70 h-52 q-12 -30 -8 -70z" },
  { g: "triceps", d: "M44 126 q-6 20 -4 38 q8 4 14 0 q2 -20 6 -34z" }, { g: "triceps", d: "M156 126 q6 20 4 38 q-8 4 -14 0 q-2 -20 -6 -34z" },
  { g: "glutes", d: "M72 176 h56 q6 24 -4 34 h-48 q-10 -10 -4 -34z" },
  { g: "hamstrings", d: "M70 214 q-8 36 -6 74 q10 6 20 0 q4 -38 2 -74z" }, { g: "hamstrings", d: "M130 214 q8 36 6 74 q-10 6 -20 0 q-4 -38 -2 -74z" },
  { g: "calves", d: "M66 298 q-4 30 -2 62 q8 4 16 0 q2 -32 0 -62z" }, { g: "calves", d: "M134 298 q4 30 2 62 q-8 4 -16 0 q-2 -32 0 -62z" },
];

function Body({ shapes, active, onPick }: { shapes: Shape[]; active: Group | null; onPick: (g: Group) => void }) {
  return (
    <svg viewBox="0 0 200 380" className="mx-auto h-[360px] w-auto" role="img" aria-label="خريطة الجسم">
      <circle cx="100" cy="52" r="24" className="fill-white/10" />
      <rect x="90" y="72" width="20" height="22" rx="6" className="fill-white/10" />
      <path d="M64 96 h72 l6 40 -6 76 h-72 l-6 -76z" className="fill-white/[0.06]" />
      {shapes.map((s, i) => (
        <path key={i} d={s.d} onClick={() => onPick(s.g)} tabIndex={0} role="button" aria-label={GROUP_LABEL[s.g]}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(s.g); }}
          className={`cursor-pointer outline-none transition-all duration-200 ${active === s.g ? "fill-accent drop-shadow-[0_0_8px_var(--color-accent)]" : "fill-white/25 hover:fill-accent/60 focus-visible:fill-accent/60"}`} />
      ))}
    </svg>
  );
}

// ───────────── PAGE ─────────────
export function ExercisesPreview() {
  const [view, setView] = useState<"front" | "back">("front");
  const [group, setGroup] = useState<Group | null>("chest");
  const [open, setOpen] = useState<Exercise | null>(null);
  const [tab, setTab] = useState(0);
  const [playing, setPlaying] = useState(false);
  const list = EXERCISES.filter((e) => !group || e.group === group);

  if (open) {
    const t = open.trainers[Math.min(tab, open.trainers.length - 1)];
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button onClick={() => { setOpen(null); setTab(0); setPlaying(false); }} className="mb-4 text-sm text-accent">← رجوع للدليل</button>
        <div className="grid gap-8 md:grid-cols-[320px_1fr]">
          <div>
            <div className="relative aspect-[9/16] overflow-hidden rounded-3xl bg-black ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.cover} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
              <button onClick={() => setPlaying(!playing)} aria-label="تشغيل" className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-2xl text-black shadow-xl transition-transform hover:scale-105">{playing ? "❚❚" : "▶"}</span>
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.photo} alt="" className="size-10 rounded-full object-cover ring-2 ring-accent" />
                <div className="text-sm"><p className="font-bold">{t.name}</p><p className="text-xs text-white/70">{t.city} · {t.years} سنة خبرة</p></div>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted">معاينة تصميم: الفيديو هون هيكون رابط حقيقي من المدرب</p>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-sm text-accent">{GROUP_LABEL[open.group]}</p>
              <h1 className="text-3xl font-extrabold">{open.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-accent">المستوى: {open.level}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">المعدات: {open.gear}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">عضلات مساعدة: {open.secondary}</span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {open.trainers.map((tr, i) => (
                <button key={i} onClick={() => setTab(i)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 transition-colors ${tab === i ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>شرح {tr.name}</button>
              ))}
            </div>
            <ol className="space-y-3">
              {t.steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-surface p-4 ring-1 ring-white/10">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-accent-foreground">{i + 1}</span>
                  <p className="pt-1 text-sm">{s}</p>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl bg-red-500/10 p-4 text-sm ring-1 ring-red-400/30"><p className="font-bold text-red-200">⚠️ خطأ شائع</p><p className="mt-1">{t.mistake}</p></div>
            <div className="flex flex-wrap gap-3">
              <a href={`https://wa.me/${t.wa}`} className="rounded-xl bg-green-600 px-5 py-2.5 font-bold text-white">كلّم {t.name} على واتساب</a>
              <span className="rounded-xl bg-surface px-5 py-2.5 text-sm ring-1 ring-white/10">عرض ملف المدرب</span>
            </div>
            <div className="rounded-2xl bg-surface p-4 ring-1 ring-white/10">
              <p className="mb-3 font-bold">🏋️ بتتدرب هالتمرين؟ أقرب نوادي فيها الجهاز</p>
              <ul className="space-y-2 text-sm">
                {["[تجريبي] نادي الأبطال — عبدون · 1.2 كم", "[تجريبي] نادي القوة — الجبيهة · 2.8 كم", "[تجريبي] نادي فيت لايف — الصويفية · 3.5 كم"].map((n) => (
                  <li key={n} className="flex items-center justify-between rounded-xl bg-background px-3 py-2"><span>{n}</span><span className="text-accent">←</span></li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted">المعلومات تعليمية وللمبتدئين يُنصح بالتمرّن بإشراف مدرب.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2 inline-block rounded-full bg-yellow-400/15 px-3 py-1 text-xs text-yellow-200">معاينة تصميم · بيانات تجريبية</div>
      <h1 className="text-3xl font-extrabold md:text-4xl">دليل التمارين <span className="text-accent">بالعربي</span></h1>
      <p className="mt-2 max-w-xl text-muted">اضغط على العضلة اللي بدك تشتغل عليها، وشوف شرح التمرين من مدربين أردنيين.</p>
      <div className="mt-8 grid gap-8 md:grid-cols-[300px_1fr]">
        <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
          <div className="mb-3 flex justify-center gap-2 text-sm">
            {(["front", "back"] as const).map((v) => (
              <button key={v} onClick={() => { setView(v); setGroup(null); }} className={`rounded-full px-4 py-1 ring-1 ring-white/10 ${view === v ? "bg-accent font-bold text-accent-foreground" : ""}`}>{v === "front" ? "أمامي" : "خلفي"}</button>
            ))}
          </div>
          <Body shapes={view === "front" ? FRONT : BACK} active={group} onPick={setGroup} />
          <p className="mt-2 text-center text-sm text-muted">{group ? GROUP_LABEL[group] : "اختر عضلة"}</p>
        </div>
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => setGroup(null)} className={`rounded-full px-3 py-1 text-sm ring-1 ring-white/10 ${!group ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>الكل</button>
            {(Object.keys(GROUP_LABEL) as Group[]).map((g) => (
              <button key={g} onClick={() => setGroup(g)} className={`rounded-full px-3 py-1 text-sm ring-1 ring-white/10 ${group === g ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>{GROUP_LABEL[g]}</button>
            ))}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((e) => (
              <li key={e.id}>
                <button onClick={() => { setOpen(e); setTab(0); setPlaying(false); }} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl text-start ring-1 ring-white/10 transition-all hover:ring-accent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block text-xs text-accent">{GROUP_LABEL[e.group]} · {e.level}</span>
                    <span className="block text-lg font-extrabold">{e.name}</span>
                    <span className="block text-xs text-white/70">{e.trainers.length} {e.trainers.length > 1 ? "شروحات من مدربين" : "شرح من مدرب"}</span>
                  </span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="text-muted">ما في تمارين لهالعضلة بعد.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
