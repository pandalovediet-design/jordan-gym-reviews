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
  z("chest", "192,172 230,166 270,172 288,200 286,235 268,250 230,252 194,240 192,200"),
  z("shoulders", "100,160 80,168 68,185 63,210 64,224 80,222 100,224 103,200 101,175"),
  z("shoulders", "262,158 292,165 318,188 331,212 333,224 300,222 287,222 284,200 278,175"),
  z("biceps", "63,224 82,224 108,238 108,262 98,282 86,300 60,300 42,285 55,255"),
  z("biceps", "286,224 333,224 342,245 350,268 354,290 335,300 312,302 298,290 289,270 284,245"),
  z("forearms", "35,302 86,302 82,330 74,360 64,385 56,402 26,402 24,375 28,340"),
  z("forearms", "312,302 357,302 362,330 360,355 352,380 342,398 326,398 321,370 314,335"),
  z("abs", "130,258 250,258 268,290 270,335 255,350 135,350 118,335 120,290"),
  z("quads", "100,470 188,470 190,505 180,530 172,555 160,585 140,597 118,592 105,575 101,550 99,525 98,495"),
  z("quads", "206,470 292,470 292,505 290,527 284,550 278,578 262,596 240,596 226,580 216,555 212,525 205,497"),
  z("calves", "112,598 150,598 158,615 158,642 148,666 140,685 132,710 125,728 104,728 98,700 93,665 88,625 95,608"),
  z("calves", "245,598 290,600 304,618 305,645 301,680 297,710 292,728 270,728 264,705 254,680 245,660 240,635 240,610"),
];
const BACK: Shape[] = [
  z("back", "152,132 214,132 245,150 272,165 284,195 282,230 276,262 262,300 250,325 246,342 190,346 130,346 112,338 108,320 98,290 92,262 90,225 92,190 104,165 121,150"),
  z("shoulders", "100,158 78,170 62,192 52,215 50,238 70,240 90,232 90,205 92,180"),
  z("shoulders", "275,160 300,172 315,195 322,225 318,240 296,240 286,225 282,200 279,178"),
  z("triceps", "50,238 92,236 95,262 86,290 78,312 40,312 28,295 38,262"),
  z("triceps", "296,240 322,240 332,265 338,292 335,312 300,312 285,290 279,268 284,245"),
  z("forearms", "28,312 76,312 70,340 62,370 52,402 24,402 21,360"),
  z("forearms", "300,312 338,312 342,340 336,380 330,402 302,402 299,370 298,340"),
  z("glutes", "100,398 172,400 176,460 165,495 120,505 92,470"),
  z("glutes", "190,400 262,398 274,470 255,505 205,495 186,460"),
  z("hamstrings", "96,508 176,508 172,535 160,560 150,585 135,592 105,590 95,570 92,540 94,522"),
  z("hamstrings", "196,508 278,508 280,525 275,550 272,575 262,590 240,592 222,580 205,555 198,535"),
  z("calves", "100,590 135,590 142,610 140,640 136,662 124,684 116,710 112,732 82,732 78,700 74,665 72,640 78,610"),
  z("calves", "225,590 275,592 286,612 288,645 284,680 280,710 277,732 250,732 244,705 234,680 224,660 219,630 220,605"),
];

export function BodyMap({ view, active, onPick }: { view: "front" | "back"; active: Muscle | readonly Muscle[] | null; onPick: (g: Muscle) => void }) {
  const [hov, setHov] = useState<Muscle | null>(null);
  const v = view === "front" ? FRONT_VIEW : BACK_VIEW;
  const shapes = view === "front" ? FRONT : BACK;
  const firstIdx = (g: Muscle) => shapes.findIndex((x) => x.g === g);
  return (
    <svg viewBox={`0 0 ${v.w} ${v.h}`} className="mx-auto h-[420px] w-auto touch-manipulation select-none rounded-2xl bg-[#101011]" role="group" aria-label="خريطة الجسم التفاعلية">
      <image href={v.src} width={v.w} height={v.h} aria-hidden="true" />
      {shapes.map((s, i) => {
        const on = Array.isArray(active) ? (active as readonly Muscle[]).includes(s.g) : active === s.g;
        const hot = hov === s.g;
        return (
          <path key={i} d={s.d} onClick={() => onPick(s.g)} tabIndex={i === firstIdx(s.g) ? 0 : -1} role="button" aria-label={MUSCLE_LABEL[s.g]} aria-pressed={on}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setHov(s.g); }} onPointerLeave={() => setHov(null)}
            onFocus={() => setHov(s.g)} onBlur={() => setHov(null)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(s.g); } }}
            strokeWidth={on ? 3 : 2} strokeLinejoin="round"
            className={`cursor-pointer outline-none transition-colors duration-150 focus-visible:stroke-accent focus-visible:[stroke-width:4] ${on ? "fill-accent/55 stroke-accent" : hot ? "fill-accent/30 stroke-accent/80" : "fill-transparent stroke-transparent"}`} />
        );
      })}
    </svg>
  );
}
