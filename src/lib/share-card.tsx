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

  const whereParts = [o.area, o.city].filter(Boolean) as string[];
  const gl = o.glow ? GLOW[o.glow] : null;

  const photoH = story ? 900 : 520;
  const title = o.name_ar ?? "";
  const typeLabel = ORG_TYPE_LABEL[o.type as keyof typeof ORG_TYPE_LABEL] ?? "نادي رياضي";
  const location = whereParts.join(" • ");
  const url = `${host}/g/${o.slug}`;
  const photoFrame = o.photo ? (
    <div style={{ display: "flex", padding: gl ? 9 : 0, borderRadius: story ? 48 : 36, background: gl ? `linear-gradient(135deg, ${gl.a}, ${gl.b}, ${gl.a})` : "#25483c", boxShadow: gl ? `0 0 70px 18px ${gl.glow}` : "0 18px 55px rgba(0,0,0,.32)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={o.photo} width={story ? 900 : 940} height={photoH} alt="" style={{ borderRadius: story ? 40 : 30, objectFit: "cover" }} />
    </div>
  ) : (
    <div style={{ display: "flex", height: story ? 760 : 460, borderRadius: 42, background: "radial-gradient(circle at 20% 20%, #477b52 0%, #174638 48%, #0a2922 100%)", border: "2px solid rgba(182,242,58,.3)", alignItems: "center", justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} width={story ? 260 : 210} height={story ? 260 : 210} alt="" style={{ opacity: .9 }} />
    </div>
  );
  const brand = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: "row-reverse" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={story ? 76 : 68} height={story ? 76 : 68} alt="" style={{ borderRadius: 50 }} />
        <div style={{ display: "flex", fontSize: story ? 42 : 38, fontWeight: 800 }}>Gym<span style={{ color: "#b6f23a", marginLeft: 10 }}>Jo</span></div>
      </div>
      <div style={{ display: "flex", flexDirection: "row-reverse", gap: 10 }}>
        {isVerified(o) && <div style={{ display: "flex", background: "#b6f23a", padding: "7px 22px 11px", borderRadius: 40 }}><R t="موثّق" size={30} weight={800} color="#07211c" nowrap /></div>}
        {gl && <div style={{ display: "flex", background: `linear-gradient(135deg, ${gl.a}, ${gl.b})`, padding: "7px 22px 11px", borderRadius: 40 }}><R t={`عضو ${GLOW_NAME[o.glow as GlowColor]}`} size={28} weight={800} color="#2a1a00" nowrap /></div>}
      </div>
    </div>
  );
  const details = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: story ? 18 : 14 }}>
      <div style={{ display: "flex", padding: "7px 28px 12px", borderRadius: 40, background: "rgba(182,242,58,.13)", border: "2px solid #b6f23a" }}>
        <R t={typeLabel} size={story ? 34 : 30} weight={800} color="#b6f23a" nowrap />
      </div>
      <R t={title} size={story ? (title.length > 32 ? 66 : 82) : (title.length > 32 ? 58 : 70)} weight={800} lh={1.2} maxW={story ? 900 : 920} />
      {location && <R t={location} size={story ? 38 : 34} color="#c9ddd4" maxW={900} />}
      {o.min_price_jod != null && (
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "baseline", gap: 14, padding: "5px 28px 14px", borderRadius: 26, background: "rgba(182,242,58,.12)" }}>
          <R t="يبدأ الاشتراك من" size={story ? 30 : 26} color="#c9ddd4" nowrap />
          <div style={{ display: "flex", fontSize: story ? 76 : 64, fontWeight: 800, color: "#b6f23a" }}>{Number(o.min_price_jod).toFixed(0)}</div>
          <R t="د.أ" size={story ? 36 : 32} weight={800} nowrap />
        </div>
      )}
      {chips.length > 0 && <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 }}>
        {chips.slice(0, story ? 5 : 4).map((c) => <div key={c} style={{ display: "flex", padding: "6px 20px 10px", borderRadius: 30, background: "rgba(255,255,255,.11)" }}><R t={c} size={story ? 28 : 25} nowrap /></div>)}
      </div>}
    </div>
  );
  const cta = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "center", background: "#b6f23a", color: "#07211c", borderRadius: 24, padding: story ? "20px 24px" : "16px 20px" }}>
        <R t={story ? "اكتشف النادي على GYMJO" : "اكتشف النادي"} size={story ? 42 : 36} weight={800} color="#07211c" nowrap />
      </div>
      <div style={{ display: "flex", justifyContent: "center", fontSize: story ? 28 : 25, color: "#c9ddd4", fontWeight: 700 }}>{url}</div>
    </div>
  );

  return new ImageResponse(
    story ? (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", padding: "58px 72px 62px", gap: 30, background: "radial-gradient(circle at 85% 12%, #1c5a47 0%, rgba(28,90,71,0) 42%), linear-gradient(160deg,#0d2f28 0%,#07211c 78%)", color: "#eef6f2", fontFamily: "Taj, TajL" }}>
        {brand}
        {photoFrame}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 20 }}>{details}</div>
        {cta}
        <div style={{ display: "flex", justifyContent: "center", color: "#78968a", fontSize: 23 }}>دليلك لاكتشاف الرياضة في الأردن</div>
      </div>
    ) : (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#08251e", color: "#eef6f2", fontFamily: "Taj, TajL" }}>
        <div style={{ display: "flex", padding: "38px 58px 26px", alignItems: "center", justifyContent: "space-between", flexDirection: "row-reverse" }}>
          {brand}
        </div>
        <div style={{ display: "flex", padding: "0 58px" }}>{photoFrame}</div>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", padding: "30px 64px 34px", background: "linear-gradient(160deg,#103d30 0%,#071f19 100%)" }}>
          {details}
          {cta}
        </div>
        {gl && <div style={{ display: "flex", height: 9, background: `linear-gradient(90deg, ${gl.a}, ${gl.b}, ${gl.a})` }} />}
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
