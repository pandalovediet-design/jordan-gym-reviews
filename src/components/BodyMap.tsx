"use client";
import { useState } from "react";
import { MUSCLE_LABEL, type Muscle } from "@/lib/exercise-meta";

type Shape = { g: Muscle; p: string };
const FRONT_VIEW = { w: 170, h: 344, src: "/body/front.webp" };
const BACK_VIEW = { w: 150, h: 344, src: "/body/back.webp" };

// Clickable zones are drawn over the photo (coordinates are in photo pixels).
const FRONT: Shape[] = [
  { g: "chest", p: "50,76 62,70 80,72 80,100 70,110 55,108 48,95" },
  { g: "chest", p: "84,72 104,70 120,78 122,98 115,108 100,110 84,100" },
  { g: "shoulders", p: "36,80 48,70 58,74 52,92 46,108 32,100" },
  { g: "shoulders", p: "118,74 130,70 142,80 145,100 134,108 124,92" },
  { g: "biceps", p: "30,108 46,104 50,120 46,140 32,142 26,125" },
  { g: "biceps", p: "124,104 140,108 148,125 142,142 128,140 122,120" },
  { g: "forearms", p: "26,144 44,142 42,165 32,190 14,190 14,165" },
  { g: "forearms", p: "126,142 144,144 156,165 156,190 138,190 128,165" },
  { g: "abs", p: "64,112 108,112 108,150 64,150" },
  { g: "quads", p: "46,226 88,226 88,248 82,268 60,270 46,252" },
  { g: "quads", p: "92,226 128,228 128,252 114,270 96,268 92,248" },
  { g: "calves", p: "50,274 76,272 74,296 66,318 52,318 48,296" },
  { g: "calves", p: "96,272 122,274 124,296 120,318 104,318 96,296" },
];
const BACK: Shape[] = [
  { g: "back", p: "55,66 85,62 109,70 115,94 109,128 101,146 55,146 47,126 45,94" },
  { g: "shoulders", p: "29,80 41,70 49,76 45,96 39,108 27,100" },
  { g: "shoulders", p: "109,76 119,70 133,80 135,100 125,108 115,94" },
  { g: "triceps", p: "21,104 39,100 45,114 39,140 25,144 15,128" },
  { g: "triceps", p: "117,104 133,108 143,126 135,144 121,140 115,118" },
  { g: "forearms", p: "17,144 37,140 35,166 27,196 11,192 11,166" },
  { g: "forearms", p: "121,142 139,144 145,166 143,194 127,196 121,166" },
  { g: "glutes", p: "48,156 108,156 113,200 109,222 49,222 43,200" },
  { g: "hamstrings", p: "41,226 81,226 83,248 77,262 55,264 39,248" },
  { g: "hamstrings", p: "85,226 123,228 125,250 111,264 91,262 85,248" },
  { g: "calves", p: "37,266 69,264 71,284 63,306 43,306 33,284" },
  { g: "calves", p: "89,264 121,266 127,284 119,306 99,306 89,284" },
];

export function BodyMap({ view, active, onPick }: { view: "front" | "back"; active: Muscle | null; onPick: (g: Muscle) => void }) {
  const [hov, setHov] = useState<Muscle | null>(null);
  const v = view === "front" ? FRONT_VIEW : BACK_VIEW;
  const shapes = view === "front" ? FRONT : BACK;
  return (
    <svg viewBox={`0 0 ${v.w} ${v.h}`} className="mx-auto h-[420px] w-auto rounded-2xl bg-[#1c1c1e]" role="img" aria-label="خريطة الجسم">
      <image href={v.src} width={v.w} height={v.h} />
      {shapes.map((s, i) => {
        const on = active === s.g;
        const hot = hov === s.g;
        return (
          <polygon key={i} points={s.p} onClick={() => onPick(s.g)} tabIndex={i === shapes.findIndex((x) => x.g === s.g) ? 0 : -1} role="button" aria-label={MUSCLE_LABEL[s.g]}
            onMouseEnter={() => setHov(s.g)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(s.g)} onBlur={() => setHov(null)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(s.g); }}
            strokeWidth={1} strokeLinejoin="round"
            className={`cursor-pointer outline-none transition-all duration-200 ${on ? "fill-accent/60 stroke-accent drop-shadow-[0_0_6px_var(--color-accent)]" : hot ? "fill-accent/35 stroke-accent/80" : "fill-white/0 stroke-white/0"}`} />
        );
      })}
    </svg>
  );
}
