"use client";
import { useState } from "react";
import { MUSCLE_LABEL, type Muscle } from "@/lib/exercise-meta";

// ───────────── BODY MAP ─────────────
// Left half is drawn once; the right half is its mirror (x -> 200 - x).
type Shape = { g: Muscle; d: string };
const SIL = "M92 66 C80 68 66 70 56 78 C48 84 46 98 44 118 C42 140 38 168 36 190 L34 208 C38 214 48 212 50 206 L56 170 C58 150 62 130 64 118 C64 140 66 160 68 180 C70 196 72 204 74 212 C72 240 70 270 68 300 C68 330 70 350 70 372 L68 384 L92 384 L92 372 C94 340 94 310 94 284 C96 260 98 240 100 226 L100 66 Z";
const DELT = "M70 74 C60 74 52 80 50 92 C49 102 52 110 58 112 C64 104 68 92 70 74Z";
const ARM = "M50 114 C46 130 44 148 44 160 C48 164 54 164 57 160 C58 146 60 130 60 116 C56 118 53 118 50 114Z";
const FORE = "M43 164 C48 167 54 167 57 164 C56 178 54 190 52 200 L36 198 C38 188 41 176 43 164Z";
const CALF = "M72 296 C78 292 90 292 94 296 C94 320 92 346 90 366 L76 366 C72 346 70 320 72 296Z";
const FRONT: Shape[] = [
  { g: "chest", d: "M72 80 C80 78 92 80 99 84 L99 118 C90 122 78 120 68 112 C66 100 68 88 72 80Z" },
  { g: "shoulders", d: DELT }, { g: "biceps", d: ARM }, { g: "forearms", d: FORE },
  { g: "abs", d: "M82 124 L99 124 L99 200 C92 202 84 198 80 190 C78 168 78 140 82 124Z" },
  { g: "quads", d: "M76 218 L98 228 C98 250 96 270 94 284 C88 288 78 288 72 284 C70 260 72 236 76 218Z" },
  { g: "calves", d: CALF },
];
const BACK: Shape[] = [
  { g: "back", d: "M72 76 C82 72 92 72 99 70 L99 176 C92 182 80 180 74 170 C68 150 66 120 68 96 C68 88 70 80 72 76Z" },
  { g: "shoulders", d: DELT }, { g: "triceps", d: ARM }, { g: "forearms", d: FORE },
  { g: "glutes", d: "M74 180 C86 176 96 178 99 182 L99 222 C90 232 78 230 72 220 C70 204 70 190 74 180Z" },
  { g: "hamstrings", d: "M74 232 C84 238 94 238 98 232 C98 256 96 272 94 284 C88 288 78 288 72 284 C70 266 72 248 74 232Z" },
  { g: "calves", d: CALF },
];

export function BodyMap({ view, active, onPick }: { view: "front" | "back"; active: Muscle | null; onPick: (g: Muscle) => void }) {
  const shapes = view === "front" ? FRONT : BACK;
  const [hov, setHov] = useState<Muscle | null>(null);
  const half = (mirror: boolean) => (
    <g transform={mirror ? "translate(200,0) scale(-1,1)" : undefined}>
      <path d={SIL} className="fill-white/[0.07] stroke-white/20" strokeWidth={1} strokeLinejoin="round" />
      {shapes.map((s, i) => {
        const on = active === s.g;
        const hot = hov === s.g;
        return (
          <path key={i} d={s.d} onClick={() => onPick(s.g)} tabIndex={mirror ? -1 : 0} role="button" aria-label={MUSCLE_LABEL[s.g]}
            onMouseEnter={() => setHov(s.g)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(s.g)} onBlur={() => setHov(null)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(s.g); }}
            strokeWidth={0.8} strokeLinejoin="round"
            className={`cursor-pointer outline-none transition-all duration-200 ${on ? "fill-accent stroke-accent drop-shadow-[0_0_8px_var(--color-accent)]" : hot ? "fill-accent/60 stroke-accent/70" : "fill-white/20 stroke-white/30"}`} />
        );
      })}
    </g>
  );
  return (
    <svg viewBox="0 0 200 390" className="mx-auto h-[400px] w-auto" role="img" aria-label="خريطة الجسم">
      <ellipse cx="100" cy="34" rx="16" ry="20" className="fill-white/[0.07] stroke-white/20" strokeWidth={1} />
      <path d="M92 52 L92 68 L108 68 L108 52Z" className="fill-white/[0.07]" />
      {half(false)}
      {half(true)}
    </svg>
  );
}

