/* eslint-disable @next/next/no-img-element -- this file renders an image with satori, not a page */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ORG_TYPE_LABEL, publicMediaUrl } from "@/lib/format";
import { type GlowColor } from "@/lib/format";
import { baseUrl } from "@/lib/base-url";

const GLOW: Record<GlowColor, { a: string; b: string; glow: string }> = {
  gold: { a: "#ffe08a", b: "#ff9f1c", glow: "rgba(255,190,60,0.65)" },
  blue: { a: "#38bdf8", b: "#6366f1", glow: "rgba(80,150,255,0.6)" },
  green: { a: "#34d399", b: "#10b981", glow: "rgba(52,211,153,0.55)" },
  pink: { a: "#f472b6", b: "#ec4899", glow: "rgba(244,114,182,0.6)" },
};

/** First club photo as a JPEG data URI sized for the card (satori can't read WebP, so everything is converted). Returns null on any failure. */
export async function loadCardPhoto(storagePath: string | null | undefined): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const file = storagePath.split("/").pop() ?? "";
    let buf: Buffer;
    if (file.startsWith("demo-")) buf = await readFile(path.join(process.cwd(), "public/demo", file));
    else {
      const res = await fetch(publicMediaUrl(storagePath), { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
    }
    const out = await sharp(buf).rotate().resize(952, 300, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

const font = (f: string) => readFile(path.join(process.cwd(), "src/assets/fonts", f));

export type CardOrg = {
  slug: string | null; name_ar: string | null; type: string | null; city: string | null; area: string | null; min_price_jod: number | null;
  photo?: string | null; glow?: GlowColor | null;
  verified_at: string | null; women_access: string | null; has_kids_area: boolean | null; kids_friendly: boolean | null; has_mosque: boolean | null; free_trial_note: string | null;
};

/** The one shareable card of a place (1080x1350): name, area and a QR that opens its page. Works as a post, a story and a print. */
export async function renderCard(o: CardOrg, qr: string, download = false) {
  const [a4, a8, l4, l8, logo] = await Promise.all([
    font("tajawal-arabic-400-normal.woff"), font("tajawal-arabic-800-normal.woff"),
    font("tajawal-latin-400-normal.woff"), font("tajawal-latin-800-normal.woff"),
    readFile(path.join(process.cwd(), "public/logo-mark.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const W = 1080, H = 1350;
  const chips: string[] = [];
  if (o.women_access === "women_only") chips.push("نسائي");
  else if (o.women_access === "women_hours") chips.push("أوقات نسائية");
  if (o.has_kids_area) chips.push("ركن للأطفال");
  if (o.kids_friendly) chips.push("مهيّأ للأطفال");
  if (o.has_mosque) chips.push("مصلى");
  if (o.free_trial_note) chips.push("يوم تجريبي");
  const host = baseUrl().replace(/^https?:\/\//, "");

  // Satori shapes Arabic letters but doesn't reorder words, so each line is a nowrap row-reverse flex of word spans;
  // long phrases are wrapped by hand into lines using an estimated glyph width (satori's own wrapping mis-measures Arabic).
  const R = ({ t, size, weight = 400, color = "#eef6f2", lh = 1.3, nowrap = false, maxW = W - 160, block = false }: { t: string; size: number; weight?: number; color?: string; lh?: number; nowrap?: boolean; maxW?: number; block?: boolean }) => {
    const words = t.split(/\s+/).filter(Boolean);
    const est = (ws: string[]) => ws.reduce((a, w) => a + [...w].length * size * 0.62, 0) + Math.max(0, ws.length - 1) * size * 0.26;
    const lines: string[][] = [];
    for (const w of words) {
      const cur = lines[lines.length - 1];
      if (!nowrap && cur && est([...cur, w]) > maxW) lines.push([w]);
      else if (cur) cur.push(w);
      else lines.push([w]);
    }
    if (block) {
      // One text node per line (words in reverse order) inside a full-width box with right alignment: exact spacing, no measuring excess.
      return (
        <div style={{ display: "flex", flexDirection: "column", width: maxW }}>
          {lines.map((l, i) => <div key={i} style={{ width: maxW, textAlign: "right", whiteSpace: "nowrap", fontSize: size, fontWeight: weight, color, lineHeight: lh }}>{[...l].reverse().join(" ")}</div>)}
        </div>
      );
    }
    // A line with no Arabic letters (an English name) reads left to right: keep its word order.
    if (!/[\u0600-\u06FF]/.test(t)) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {lines.map((l, i) => <div key={i} style={{ display: "flex", whiteSpace: "nowrap", fontSize: size, fontWeight: weight, color, lineHeight: lh }}>{l.join(" ")}</div>)}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "nowrap", columnGap: size * 0.28, fontSize: size, fontWeight: weight, color, lineHeight: lh }}>
            {l.map((w, j) => <span key={j} style={{ display: "flex" }}>{w}</span>)}
          </div>))}
      </div>
    );
  };

  const whereParts = [o.area, o.city].filter(Boolean) as string[];
  const gl = o.glow ? GLOW[o.glow] : null;
  const title = o.name_ar ?? "";
  const typeLabel = ORG_TYPE_LABEL[o.type as keyof typeof ORG_TYPE_LABEL] ?? "نادي رياضي";
  const INK = "#04130c", LIME = "#c8f53a", CHALK = "#f3f8f2", SAGE = "#9db3a4";
  const inner = W - 128;
  const qrBox = o.photo ? 400 : 520;
  const price = o.min_price_jod != null ? `الاشتراك من ${Number(o.min_price_jod)} دينار` : null;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: `radial-gradient(circle at 12% 0%, rgba(200,245,58,.20), transparent 42%), radial-gradient(circle at 100% 100%, rgba(0,122,61,.30), transparent 45%), ${INK}`, color: CHALK, fontFamily: "Taj, TajL", padding: "56px 64px 52px" }}>
        {/* brand row */}
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", width: inner }}>
          <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 18 }}>
            <img src={logoSrc} width={84} height={84} alt="" style={{ borderRadius: 24, border: `2px solid ${LIME}` }} />
            <div style={{ display: "flex", fontSize: 50, fontWeight: 800, letterSpacing: -1 }}><span style={{ color: CHALK }}>GYM</span><span style={{ color: LIME }}>JO</span></div>
          </div>
          <R t="زورونا على جيم جو" size={32} weight={800} color={LIME} nowrap />
        </div>
        <div style={{ display: "flex", width: inner, height: 5, marginTop: 28, borderRadius: 5, background: `linear-gradient(90deg, #111 0 30%, ${CHALK} 30% 60%, #007a3d 60% 88%, #ce1126 88% 100%)` }} />

        {/* the place */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: inner, marginTop: 34, gap: 6 }}>
          <R t={typeLabel} size={32} weight={800} color={LIME} nowrap />
          <R t={title} size={title.length > 26 ? 60 : 74} weight={800} lh={1.2} maxW={inner} />
          {whereParts.length > 0 && <R t={whereParts.join(" ، ")} size={36} color={SAGE} nowrap />}
        </div>

        {o.photo && <img src={o.photo} width={inner} height={300} alt="" style={{ marginTop: 28, borderRadius: 32, objectFit: "cover" }} />}

        {/* the code */}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", width: inner, gap: 22 }}>
          <div style={{ display: "flex", position: "relative", alignItems: "center", justifyContent: "center", width: qrBox, height: qrBox, borderRadius: 40, background: "#ffffff", border: `6px solid ${gl ? gl.a : LIME}` }}>
            <img src={qr} width={qrBox - 44} height={qrBox - 44} alt="" />
            <img src={logoSrc} width={qrBox * 0.2} height={qrBox * 0.2} alt="" style={{ position: "absolute", borderRadius: 22, border: "6px solid #ffffff" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", height: 74, padding: "0 44px", borderRadius: 74, background: LIME }}>
            <R t={price ? `امسح الرمز، ${price}` : "امسح الرمز وشوف الأسعار والدوام"} size={34} weight={800} color="#0b1a08" nowrap />
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", width: inner }}>
          <div style={{ display: "flex", flexDirection: "row-reverse", gap: 12 }}>
            {(chips.length ? chips.slice(0, 3) : ["أسعار", "دوام", "موقع"]).map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", height: 52, padding: "0 22px", borderRadius: 52, border: "2px solid rgba(243,248,242,.22)" }}><R t={c} size={26} weight={800} nowrap /></div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: SAGE }}>{host}</div>
        </div>
      </div>
    ),
    {
      width: W, height: H,
      fonts: [
        { name: "Taj", data: a4, weight: 400, style: "normal" },
        { name: "Taj", data: a8, weight: 800, style: "normal" },
        { name: "TajL", data: l4, weight: 400, style: "normal" },
        { name: "TajL", data: l8, weight: 800, style: "normal" },
      ],
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400", ...(download ? { "Content-Disposition": `attachment; filename="gymjo-${o.slug}.png"` } : {}) },
    },
  );
}
