"use client";
import { useState } from "react";
import { MUSCLE_LABEL, type Muscle } from "@/lib/exercise-meta";

type Shape = { g: Muscle; p: string };
const FRONT_VIEW = { w: 390, h: 806, src: "/body/front.webp" };
const BACK_VIEW = { w: 345, h: 806, src: "/body/back.webp" };

// Clickable zones are drawn over the photo (coordinates are in photo pixels).
const FRONT: Shape[] = [
  { g: "chest", p: "110,195 140,178 200,185 200,248 170,266 128,262 108,235" },
  { g: "chest", p: "205,185 262,178 290,195 292,235 270,262 230,266 205,248" },
  { g: "shoulders", p: "72,200 88,170 118,158 122,185 106,225 98,262 66,258" },
  { g: "shoulders", p: "318,200 302,170 272,158 268,185 284,225 292,262 322,258" },
  { g: "biceps", p: "66,262 98,266 102,300 92,340 60,345 50,305" },
  { g: "biceps", p: "322,262 292,266 288,300 298,340 332,345 342,305" },
  { g: "forearms", p: "58,348 92,345 86,390 66,440 62,465 28,455 26,410 38,375" },
  { g: "forearms", p: "332,348 298,345 304,390 324,440 328,465 362,455 364,410 352,375" },
  { g: "abs", p: "148,272 242,272 246,345 196,356 146,345" },
  { g: "quads", p: "102,530 190,530 190,560 178,615 130,632 100,600" },
  { g: "quads", p: "212,530 296,530 298,600 268,640 224,615 212,560" },
  { g: "calves", p: "98,640 160,632 158,690 140,740 104,742 92,690" },
  { g: "calves", p: "240,632 298,640 302,690 292,742 256,740 238,690" },
];
const BACK: Shape[] = [
  { g: "back", p: "118,168 190,150 262,168 274,235 262,310 246,346 134,346 106,310 96,235" },
  { g: "shoulders", p: "68,215 90,175 118,160 124,190 106,235 98,268 64,262" },
  { g: "shoulders", p: "312,215 290,175 262,160 256,190 274,235 282,268 316,262" },
  { g: "triceps", p: "62,268 96,272 100,305 90,345 54,350 42,310" },
  { g: "triceps", p: "318,268 284,272 280,305 290,345 326,350 338,310" },
  { g: "forearms", p: "52,352 90,346 84,390 70,435 62,458 28,450 26,410 36,375" },
  { g: "forearms", p: "326,352 290,346 296,390 308,435 316,458 340,448 340,410 332,375" },
  { g: "glutes", p: "108,400 272,400 280,470 274,522 104,522 94,470" },
  { g: "hamstrings", p: "94,528 186,530 186,560 172,610 128,625 92,600" },
  { g: "hamstrings", p: "204,530 280,528 290,600 258,625 214,610 204,560" },
  { g: "calves", p: "92,625 165,625 168,690 148,745 102,745 78,690" },
  { g: "calves", p: "232,625 300,625 304,690 290,745 250,745 228,690" },
];

export function BodyMap({ view, active, onPick }: { view: "front" | "back"; active: Muscle | null; onPick: (g: Muscle) => void }) {
  const [hov, setHov] = useState<Muscle | null>(null);
  const v = view === "front" ? FRONT_VIEW : BACK_VIEW;
  const shapes = view === "front" ? FRONT : BACK;
  return (
    <svg viewBox={`0 0 ${v.w} ${v.h}`} className="mx-auto h-[420px] w-auto rounded-2xl bg-[#101011]" role="img" aria-label="خريطة الجسم">
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
