"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { BodyMap } from "@/components/BodyMap";
import { LEVEL_LABEL, MUSCLES, MUSCLE_LABEL, demoCover, type Muscle } from "@/lib/exercise-meta";

type Item = { slug: string; name_ar: string; muscle_group: string; level: string; count: number };

export function ExerciseExplorer({ items }: { items: Item[] }) {
  const [view, setView] = useState<"front" | "back">("front");
  const [group, setGroup] = useState<Muscle | null>(null);
  const pick = (g: Muscle | null) => {
    setGroup(g);
    if (g === "back" || g === "triceps" || g === "glutes" || g === "hamstrings") setView("back");
    else if (g === "chest" || g === "biceps" || g === "abs" || g === "quads") setView("front");
  };
  const listRef = useRef<HTMLDivElement>(null);
  // On phones the results sit below the figure: bring them into view after a tap on the body.
  const fromBody = (g: Muscle) => {
    setGroup(g === group ? null : g);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const list = items.filter((e) => !group || e.muscle_group === group);
  const chip = "rounded-full px-3 py-1.5 text-sm ring-1 ring-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[300px_1fr]">
      <section aria-label="اختيار العضلة" className="h-fit rounded-3xl bg-surface p-5 ring-1 ring-white/10 md:sticky md:top-4">
        <div className="mb-3 flex justify-center gap-2 text-sm" role="group" aria-label="عرض الجسم">
          {(["front", "back"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-full px-4 py-2 ring-1 ring-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${view === v ? "bg-accent font-bold text-accent-foreground" : ""}`}>{v === "front" ? "أمامي" : "خلفي"}</button>
          ))}
        </div>
        <BodyMap view={view} active={group} onPick={fromBody} />
        <p className="mt-2 min-h-6 text-center text-sm text-muted" aria-live="polite">{group ? MUSCLE_LABEL[group] : "اضغط على عضلة"}</p>
        <p className="mt-1 text-center text-xs text-muted">تقدر تختار العضلة من الرسم أو من القائمة.</p>
      </section>
      <section ref={listRef} aria-label="نتائج التمارين" className="scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted" aria-live="polite" aria-atomic="true">{group ? `${MUSCLE_LABEL[group]} — ${list.length} ${list.length === 1 ? "تمرين" : "تمارين"}` : `كل التمارين — ${list.length}`}</p>
          {group && <button type="button" onClick={() => pick(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent ring-1 ring-accent/40 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">مسح التصفية ×</button>}
        </div>
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="تصفية حسب العضلة">
          <button type="button" onClick={() => pick(null)} aria-pressed={!group} className={`${chip} ${!group ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>الكل</button>
          {MUSCLES.map((m) => (
            <button type="button" key={m} onClick={() => pick(m)} aria-pressed={group === m} className={`${chip} ${group === m ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>{MUSCLE_LABEL[m]}</button>
          ))}
        </div>
        {list.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((e, i) => (
              <li key={e.slug}>
                <Link href={`/exercises/${e.slug}`} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all hover:ring-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={demoCover(i)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                  <span className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block text-xs text-accent">{MUSCLE_LABEL[e.muscle_group as Muscle]} · {LEVEL_LABEL[e.level]}</span>
                    <span className="block text-lg font-extrabold">{e.name_ar}</span>
                    <span className="block text-xs text-white/80">{e.count > 0 ? `${e.count} ${e.count === 1 ? "شرح من مدرب" : "شروحات من مدربين"}` : "بانتظار شرح من المدربين"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface/60 px-5 py-10 text-center">
            <p className="font-bold">لسه ما أضفنا تمارين لهالعضلة</p>
            <p className="mt-2 text-sm text-muted">اختار عضلة ثانية أو ارجع لكل التمارين.</p>
            <button type="button" onClick={() => pick(null)} className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">عرض كل التمارين</button>
          </div>
        )}
      </section>
    </div>
  );
}
