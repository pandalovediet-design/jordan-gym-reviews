"use client";
import { useState } from "react";
import { JORDAN_AREAS, JORDAN_CITIES } from "@/lib/jordan";

const field = "min-h-11 w-full rounded-xl border-0 bg-background px-3 py-2.5 text-foreground ring-1 ring-white/10 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-45";

 /** City (governorate) then an optional smaller area. Saved values that aren't in the list stay selectable. */
export function CityAreaPicker({ defaultCity = "", defaultArea = "", allowAll = false, labels = true }: { defaultCity?: string; defaultArea?: string; allowAll?: boolean; labels?: boolean }) {
  const [city, setCity] = useState(defaultCity || (allowAll ? "" : JORDAN_CITIES[0]));
  const [area, setArea] = useState(defaultArea);
  const cities = city && !JORDAN_CITIES.includes(city) ? [city, ...JORDAN_CITIES] : JORDAN_CITIES;
  const known = JORDAN_AREAS[city] ?? [];
  const areas = area && !known.includes(area) ? [area, ...known] : known;
  const lbl = "block space-y-1.5 text-sm font-medium text-muted";
  return (
    <div className={allowAll ? "contents" : "grid gap-3 sm:grid-cols-2"}>
      <label className={lbl}>{labels && "المدينة / المحافظة"}
        <select name="city" aria-label="المدينة أو المحافظة" required={!allowAll} value={city} onChange={(e) => { setCity(e.target.value); setArea(""); }} className={field}>
          {allowAll && <option value="">كل المدن</option>}
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className={lbl}>{labels && "المنطقة"}
        <select name="area" aria-label="المنطقة" value={area} onChange={(e) => setArea(e.target.value)} disabled={!city} className={field}>
          <option value="">{allowAll ? "كل المناطق" : "اختر المنطقة (اختياري)"}</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
    </div>
  );
}
