import { addDays, dow } from "@/lib/workout-log";

export type DayActivity = { workout: boolean; healthy: boolean };

const ar = (n: number) => n.toLocaleString("ar-JO-u-nu-latn");
const MONTHS = ["كانون 2", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين 1", "تشرين 2", "كانون 1"];

function cell(a: DayActivity | undefined) {
  if (a?.workout && a.healthy) return "bg-accent";
  if (a?.workout) return "bg-accent/60";
  if (a?.healthy) return "bg-emerald-500/50";
  return "bg-background ring-1 ring-inset ring-white/10";
}

/** A year of days, one square each: trained, ate healthy, or both. Newest week sits at the reading end (left in RTL). */
export function ActivityHeatmap({ days, today, weeks = 26 }: { days: Record<string, DayActivity>; today: string; weeks?: number }) {
  const lastSunday = addDays(today, -dow(today));
  const start = addDays(lastSunday, -(weeks - 1) * 7);
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  let workouts = 0, healthy = 0;
  for (const col of cols) for (const d of col) { if (d <= today && days[d]?.workout) workouts++; if (d <= today && days[d]?.healthy) healthy++; }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span><b className="text-accent">{ar(workouts)}</b> يوم تمرين</span>
        <span><b className="text-emerald-300">{ar(healthy)}</b> يوم أكل صحي</span>
        <span className="text-muted">آخر {ar(Math.round(weeks / 4.35))} شهور</span>
      </div>
      <div className="overflow-x-auto pb-1" role="img" aria-label={`خريطة نشاطك: ${ar(workouts)} يوم تمرين و${ar(healthy)} يوم أكل صحي`}>
        <div className="flex w-max gap-[3px]">
          {cols.map((col, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              <span aria-hidden className="h-3 w-3 overflow-visible whitespace-nowrap text-[9px] leading-3 text-muted">{col[0].slice(8) <= "07" ? MONTHS[Number(col[0].slice(5, 7)) - 1] : ""}</span>
              {col.map((d) => (
                <span key={d} title={d} className={`size-3 rounded-[3px] sm:size-3.5 ${d > today ? "opacity-0" : cell(days[d])}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><span className="size-3 rounded-[3px] bg-accent/60" /> تمرين</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-[3px] bg-emerald-500/50" /> أكل صحي</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-[3px] bg-accent" /> الاثنين</span>
      </div>
    </div>
  );
}
