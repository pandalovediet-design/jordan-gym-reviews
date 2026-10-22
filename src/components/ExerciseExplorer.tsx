"use client";
import Link from "next/link";
import { useState } from "react";
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
  const list = items.filter((e) => !group || e.muscle_group === group);
  const chip = "rounded-full px-3 py-1 text-sm ring-1 ring-white/10";
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[300px_1fr]">
      <div className="h-fit rounded-3xl bg-surface p-5 ring-1 ring-white/10 md:sticky md:top-4">
        <div className="mb-3 flex justify-center gap-2 text-sm">
          {(["front", "back"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-full px-4 py-1 ring-1 ring-white/10 ${view === v ? "bg-accent font-bold text-accent-foreground" : ""}`}>{v === "front" ? "أمامي" : "خلفي"}</button>
          ))}
        </div>
        <BodyMap view={view} active={group} onPick={(g) => setGroup(g === group ? null : g)} />
        <p className="mt-2 text-center text-sm text-muted">{group ? MUSCLE_LABEL[group] : "اضغط على عضلة"}</p>
      </div>
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => pick(null)} className={`${chip} ${!group ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>الكل</button>
          {MUSCLES.map((m) => (
            <button key={m} onClick={() => pick(m)} className={`${chip} ${group === m ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>{MUSCLE_LABEL[m]}</button>
          ))}
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((e, i) => (
            <li key={e.slug}>
              <Link href={`/exercises/${e.slug}`} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all hover:ring-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={demoCover(i)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-xs text-accent">{MUSCLE_LABEL[e.muscle_group as Muscle]} · {LEVEL_LABEL[e.level]}</span>
                  <span className="block text-lg font-extrabold">{e.name_ar}</span>
                  <span className="block text-xs text-white/70">{e.count > 0 ? `${e.count} ${e.count === 1 ? "شرح من مدرب" : "شروحات من مدربين"}` : "بانتظار شرح من المدربين"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 && <p className="text-muted">ما في تمارين لهالعضلة بعد.</p>}
      </div>
    </div>
  );
}
