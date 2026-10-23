import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ORG_TYPE_LABEL, isVerified, publicMediaUrl } from "@/lib/format";
import { GLOW_NAME, type GlowColor } from "@/lib/format";
import { baseUrl } from "@/lib/base-url";

const GLOW: Record<GlowColor, { a: string; b: string; glow: string }> = {
  gold: { a: "#ffe08a", b: "#ff9f1c", glow: "rgba(255,190,60,0.65)" },
  blue: { a: "#38bdf8", b: "#6366f1", glow: "rgba(80,150,255,0.6)" },
  green: { a: "#34d399", b: "#10b981", glow: "rgba(52,211,153,0.55)" },
  pink: { a: "#f472b6", b: "#ec4899", glow: "rgba(244,114,182,0.6)" },
};

/** First club photo as a JPEG data URI sized for the card (satori can't read WebP, so everything is converted). Returns null on any failure. */
export async function loadCardPhoto(storagePath: string | null | undefined, story: boolean): Promise<string | null> {
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
    const out = await sharp(buf).rotate().resize(940, story ? 800 : 380, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toBuffer();
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

/** Shareable club card image: feed 1080x1350 or story 1080x1920. */
export async function renderCard(o: CardOrg, story: boolean) {
  const [a4, a8, l4, l8, logo] = await Promise.all([
    font("tajawal-arabic-400-normal.woff"), font("tajawal-arabic-800-normal.woff"),
    font("tajawal-latin-400-normal.woff"), font("tajawal-latin-800-normal.woff"),
    readFile(path.join(process.cwd(), "public/logo-mark.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const W = 1080, H = story ? 1920 : 1350;
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
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "nowrap", columnGap: size * 0.28, fontSize: size, fontWeight: weight, color, lineHeight: lh }}>
            {l.map((w, j) => <span key={j} style={{ display: "flex" }}>{w}</span>)}
          </div>))}
      </div>
    );
  };
  const ar = "flex-end";

  const hasPhoto = !!o.photo;
  const nameLen = (o.name_ar ?? "").length;
  // Prefer one line: shrink the name to fit the card width (same glyph-width estimate R uses to wrap); very long names wrap at a fixed size instead.
  const nameWords = (o.name_ar ?? "").split(/\s+/).filter(Boolean);
  const nameEm = nameWords.reduce((a, w) => a + [...w].length * 0.62, 0) + Math.max(0, nameWords.length - 1) * 0.26;
  const baseName = hasPhoto ? (nameLen > 40 ? 72 : nameLen > 26 ? 88 : 104) : nameLen > 40 ? 84 : nameLen > 26 ? 100 : 132;
  const fit = nameEm > 0 ? Math.floor((W - 180) / nameEm) : baseName;
  const nameSize = fit >= 84 ? Math.min(baseName, fit) : baseName;
  const whereParts = [o.area, o.city].filter(Boolean) as string[];
  const feats = ["الأسعار", "الدوام", "الموقع", "واتساب"];
  const gl = o.glow ? GLOW[o.glow] : null;
  const photoH = story ? 800 : 380;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: hasPhoto ? "64px 70px 70px" : "90px 80px", background: "radial-gradient(circle at 85% 12%, #1c5a47 0%, rgba(28,90,71,0) 45%), radial-gradient(circle at 10% 95%, rgba(182,242,58,0.18) 0%, rgba(182,242,58,0) 40%), linear-gradient(160deg,#0d2f28 0%,#07211c 75%)", color: "#eef6f2", fontFamily: "Taj, TajL", ...(gl && !hasPhoto ? { border: `10px solid ${gl.a}` } : {}) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: "row-reverse" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={hasPhoto ? 84 : 120} height={hasPhoto ? 84 : 120} alt="" style={{ borderRadius: 60 }} />
            <div style={{ display: "flex", fontSize: hasPhoto ? 44 : 54, fontWeight: 800 }}>Jordan <span style={{ color: "#b6f23a", marginLeft: 14 }}>Gym</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "row-reverse", gap: 12 }}>
            {isVerified(o) && <div style={{ display: "flex", background: "#b6f23a", padding: "6px 30px 12px", borderRadius: 50 }}><R t="موثّق" size={36} weight={800} color="#07211c" nowrap /></div>}
            {gl && <div style={{ display: "flex", background: `linear-gradient(135deg, ${gl.a}, ${gl.b})`, padding: "6px 30px 12px", borderRadius: 50 }}><R t={`عضو ${GLOW_NAME[o.glow as GlowColor]}`} size={36} weight={800} color="#2a1a00" nowrap /></div>}
          </div>
        </div>

        {o.photo && (
          <div style={{ display: "flex", padding: gl ? 8 : 0, borderRadius: 44, background: gl ? `linear-gradient(135deg, ${gl.a}, ${gl.b}, ${gl.a})` : "rgba(0,0,0,0)", boxShadow: gl ? `0 0 90px 24px ${gl.glow}` : "0 20px 60px rgba(0,0,0,0.45)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.photo} width={W - 140 - (gl ? 16 : 0)} height={photoH} alt="" style={{ borderRadius: 38, objectFit: "cover" }} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: hasPhoto ? 22 : 34, alignItems: ar }}>
          <div style={{ display: "flex", padding: "8px 40px 14px", borderRadius: 50, border: "3px solid #b6f23a" }}>
            <R t={ORG_TYPE_LABEL[o.type as keyof typeof ORG_TYPE_LABEL] ?? ""} size={hasPhoto ? 40 : 48} weight={800} color="#b6f23a" nowrap />
          </div>
          {!hasPhoto && <div style={{ display: "flex", width: 140, height: 10, borderRadius: 5, background: "#b6f23a" }} />}
          <R t={o.name_ar ?? ""} size={nameSize} weight={800} lh={1.25} />
          {whereParts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", width: 22, height: 22, borderRadius: 11, background: "#b6f23a" }} />
              {whereParts.map((w, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 20 }}>
                  {i > 0 && <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, background: "#6f8d82" }} />}
                  <R t={w} size={hasPhoto ? 48 : 58} color="#c9ddd4" nowrap />
                </div>))}
            </div>
          )}
          {o.min_price_jod != null && (
            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "baseline", gap: 20, marginTop: hasPhoto ? 4 : 16, padding: hasPhoto ? "4px 36px 14px" : "10px 44px 24px", borderRadius: 36, background: "rgba(182,242,58,0.12)" }}>
              <R t="يبدأ من" size={hasPhoto ? 40 : 48} color="#c9ddd4" nowrap />
              <div style={{ display: "flex", fontSize: hasPhoto ? 96 : 130, fontWeight: 800, color: "#b6f23a" }}>{Number(o.min_price_jod).toFixed(0)}</div>
              <R t="د.أ" size={hasPhoto ? 44 : 52} weight={800} nowrap />
            </div>
          )}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 14, marginTop: 4 }}>
              {chips.map((c) => <div key={c} style={{ display: "flex", padding: "6px 30px 12px", borderRadius: 50, background: "rgba(255,255,255,0.12)" }}><R t={c} size={hasPhoto ? 34 : 40} nowrap /></div>)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: ar }}>
          {((!hasPhoto && chips.length === 0 && o.min_price_jod == null) || story) && (
            <div style={{ display: "flex", flexDirection: "row-reverse", gap: 14 }}>
              {feats.map((f) => <div key={f} style={{ display: "flex", padding: "6px 26px 12px", borderRadius: 40, background: "rgba(255,255,255,0.1)" }}><R t={f} size={36} color="#c9ddd4" nowrap /></div>)}
            </div>
          )}
          <div style={{ display: "flex", alignSelf: "stretch", justifyContent: "center", background: "#b6f23a", color: "#07211c", borderRadius: 30, padding: hasPhoto ? "20px 20px" : "26px 20px", fontSize: host.length + (o.slug ?? "").length > 42 ? 36 : 44, fontWeight: 800 }}>{host}/g/{o.slug}</div>
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
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
