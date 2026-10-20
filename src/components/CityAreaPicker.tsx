"use client";
import { useState } from "react";
import { JORDAN_AREAS, JORDAN_CITIES } from "@/lib/jordan";

const field = "w-full rounded-xl bg-background px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";

/** City (governorate) then an optional smaller area. Saved values that aren't in the list stay selectable. */
export function CityAreaPicker({ defaultCity = "", defaultArea = "", allowAll = false, labels = true }: { defaultCity?: string; defaultArea?: string; allowAll?: boolean; labels?: boolean }) {
  const [city, setCity] = useState(defaultCity || (allowAll ? "" : JORDAN_CITIES[0]));
  const [area, setArea] = useState(defaultArea);
  const cities = city && !JORDAN_CITIES.includes(city) ? [city, ...JORDAN_CITIES] : JORDAN_CITIES;
  const known = JORDAN_AREAS[city] ?? [];
  const areas = area && !known.includes(area) ? [area, ...known] : known;
  const lbl = "block space-y-1 text-sm text-muted";
  return (
    <div className={allowAll ? "contents" : "grid gap-3 sm:grid-cols-2"}>
      <label className={lbl}>{labels && "المدينة / المحافظة"}
        <select name="city" required={!allowAll} value={city} onChange={(e) => { setCity(e.target.value); setArea(""); }} className={field}>
          {allowAll && <option value="">كل المدن</option>}
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className={lbl}>{labels && "المنطقة"}
        <select name="area" value={area} onChange={(e) => setArea(e.target.value)} disabled={!city} className={field}>
          <option value="">{allowAll ? "كل المناطق" : "اختر المنطقة (اختياري)"}</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
    </div>
  );
}
