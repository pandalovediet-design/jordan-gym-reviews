"use client";
import { useState } from "react";
import { MUSCLE_LABEL, type Muscle } from "@/lib/exercise-meta";

type Shape = { g: Muscle; d: string };
const FRONT_VIEW = { w: 390, h: 806, src: "/body/front.webp" };
const BACK_VIEW = { w: 345, h: 806, src: "/body/back.webp" };

/** Closed Catmull-Rom spline through the points, so every zone has soft, muscle-like edges. */
function smooth(points: string): string {
  const P = points.trim().split(/\s+/).map((q) => q.split(",").map(Number) as [number, number]);
  const n = P.length;
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + "Z";
}
const z = (g: Muscle, points: string): Shape => ({ g, d: smooth(points) });

// Zones are fitted to the photo (coordinates in photo pixels).
const FRONT: Shape[] = [
  z("chest", "118,178 150,168 188,172 190,200 188,240 160,250 130,252 112,235 108,205"),
  z("chest", "192,172 230,166 270,172 290,200 286,235 268,250 230,252 194,240 192,200"),
  z("shoulders", "120,160 85,175 67,210 62,245 75,272 105,267 112,235 102,200"),
  z("shoulders", "258,160 300,170 325,195 332,240 322,274 292,271 287,240 278,200"),
  z("biceps", "64,272 105,266 114,290 100,312 68,312 58,295"),
  z("biceps", "292,272 322,276 330,295 318,308 298,306 290,290"),
  z("forearms", "50,312 96,308 90,345 65,392 24,395 26,350"),
  z("forearms", "312,302 358,306 362,350 350,396 325,398 318,350"),
  z("abs", "130,258 250,258 268,290 270,335 255,350 135,350 118,335 120,290"),
  z("quads", "98,528 178,528 176,555 160,580 130,590 100,580 92,555"),
  z("quads", "216,528 284,527 290,555 280,580 250,592 228,580 212,555"),
  z("calves", "100,600 150,600 156,625 152,662 125,730 108,735 97,720 94,665 90,625"),
  z("calves", "242,600 292,602 308,625 300,665 300,720 280,735 268,730 255,670 246,630"),
];
const BACK: Shape[] = [
  z("back", "140,160 210,160 255,172 282,205 278,275 262,322 245,345 135,345 115,325 100,275 92,207 120,170"),
  z("shoulders", "118,168 76,178 56,205 50,240 58,262 92,262 94,230 90,205 104,182"),
  z("shoulders", "260,163 300,175 317,210 322,255 310,272 286,268 282,240 280,212"),
  z("triceps", "50,262 94,262 98,290 86,316 40,318 34,292"),
  z("triceps", "286,268 314,272 326,290 322,314 284,314 279,292"),
  z("forearms", "28,318 84,318 76,360 66,398 25,402 24,360"),
  z("forearms", "290,316 330,310 334,355 328,400 288,402 290,360"),
  z("glutes", "100,398 172,400 176,460 165,495 120,505 92,470"),
  z("glutes", "180,400 262,398 274,470 255,505 205,495 180,460"),
  z("hamstrings", "92,530 163,532 160,560 150,585 120,590 98,570 92,545"),
  z("hamstrings", "198,532 278,530 276,560 262,585 225,592 205,572 196,548"),
  z("calves", "110,588 148,592 146,615 140,628 137,660 128,692 118,725 102,722 88,690 76,650 76,620 92,598"),
  z("calves", "222,586 268,590 286,612 288,650 274,695 258,728 244,726 236,690 222,645 218,610"),
];

export function BodyMap({ view, active, onPick }: { view: "front" | "back"; active: Muscle | null; onPick: (g: Muscle) => void }) {
  const [hov, setHov] = useState<Muscle | null>(null);
  const v = view === "front" ? FRONT_VIEW : BACK_VIEW;
  const shapes = view === "front" ? FRONT : BACK;
  const firstIdx = (g: Muscle) => shapes.findIndex((x) => x.g === g);
  return (
    <svg viewBox={`0 0 ${v.w} ${v.h}`} className="mx-auto h-[420px] w-auto touch-manipulation select-none rounded-2xl bg-[#101011]" role="img" aria-label="خريطة الجسم">
      <image href={v.src} width={v.w} height={v.h} />
      {shapes.map((s, i) => {
        const on = active === s.g;
        const hot = hov === s.g;
        return (
          <path key={i} d={s.d} onClick={() => onPick(s.g)} tabIndex={i === firstIdx(s.g) ? 0 : -1} role="button" aria-label={MUSCLE_LABEL[s.g]}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setHov(s.g); }} onPointerLeave={() => setHov(null)}
            onFocus={() => setHov(s.g)} onBlur={() => setHov(null)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(s.g); }}
            strokeWidth={on ? 3 : 2} strokeLinejoin="round"
            className={`cursor-pointer outline-none transition-colors duration-150 ${on ? "fill-accent/55 stroke-accent" : hot ? "fill-accent/30 stroke-accent/80" : "fill-transparent stroke-transparent"}`} />
        );
      })}
    </svg>
  );
}
