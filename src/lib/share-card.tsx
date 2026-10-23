import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ORG_TYPE_LABEL, isVerified } from "@/lib/format";
import { baseUrl } from "@/lib/base-url";

const font = (f: string) => readFile(path.join(process.cwd(), "src/assets/fonts", f));

export type CardOrg = {
  slug: string | null; name_ar: string | null; type: string | null; city: string | null; area: string | null; min_price_jod: number | null;
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

  // Satori shapes Arabic but doesn't reorder words, so each phrase is laid out as words in a row-reverse flex box.
  const R = ({ t, size, weight = 400, color = "#eef6f2", lh = 1.3, nowrap = false }: { t: string; size: number; weight?: number; color?: string; lh?: number; nowrap?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: nowrap ? "nowrap" : "wrap", columnGap: size * 0.28, fontSize: size, fontWeight: weight, color, lineHeight: lh }}>
      {t.split(/\s+/).filter(Boolean).map((w, i) => <span key={i} style={{ display: "flex" }}>{w}</span>)}
    </div>
  );
  const ar = "flex-end";

  const nameLen = (o.name_ar ?? "").length;
  const nameSize = nameLen > 30 ? 92 : nameLen > 18 ? 112 : 132;
  const whereParts = [o.area, o.city].filter(Boolean) as string[];
  const feats = ["الأسعار", "الدوام", "الموقع", "واتساب"];

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "90px 80px", background: "radial-gradient(circle at 85% 12%, #1c5a47 0%, rgba(28,90,71,0) 45%), radial-gradient(circle at 10% 95%, rgba(182,242,58,0.18) 0%, rgba(182,242,58,0) 40%), linear-gradient(160deg,#0d2f28 0%,#07211c 75%)", color: "#eef6f2", fontFamily: "Taj, TajL" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: "row-reverse" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={120} height={120} alt="" style={{ borderRadius: 60 }} />
            <div style={{ display: "flex", fontSize: 54, fontWeight: 800 }}>Jordan <span style={{ color: "#b6f23a", marginLeft: 14 }}>Gym</span></div>
          </div>
          {isVerified(o) && <div style={{ display: "flex", background: "#b6f23a", padding: "8px 36px 14px", borderRadius: 50 }}><R t="موثّق" size={40} weight={800} color="#07211c" nowrap /></div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: ar }}>
          <div style={{ display: "flex", padding: "8px 40px 14px", borderRadius: 50, border: "3px solid #b6f23a" }}>
            <R t={ORG_TYPE_LABEL[o.type as keyof typeof ORG_TYPE_LABEL] ?? ""} size={48} weight={800} color="#b6f23a" nowrap />
          </div>
          <div style={{ display: "flex", width: 140, height: 10, borderRadius: 5, background: "#b6f23a" }} />
          <R t={o.name_ar ?? ""} size={nameSize} weight={800} lh={1.25} />
          {whereParts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", width: 22, height: 22, borderRadius: 11, background: "#b6f23a" }} />
              {whereParts.map((w, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 20 }}>
                  {i > 0 && <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, background: "#6f8d82" }} />}
                  <R t={w} size={58} color="#c9ddd4" nowrap />
                </div>))}
            </div>
          )}
          {o.min_price_jod != null && (
            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "baseline", gap: 20, marginTop: 16, padding: "10px 44px 24px", borderRadius: 36, background: "rgba(182,242,58,0.12)" }}>
              <R t="يبدأ من" size={48} color="#c9ddd4" nowrap />
              <div style={{ display: "flex", fontSize: 130, fontWeight: 800, color: "#b6f23a" }}>{Number(o.min_price_jod).toFixed(0)}</div>
              <R t="د.أ" size={52} weight={800} nowrap />
            </div>
          )}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 18, marginTop: 6 }}>
              {chips.map((c) => <div key={c} style={{ display: "flex", padding: "8px 34px 14px", borderRadius: 50, background: "rgba(255,255,255,0.12)" }}><R t={c} size={40} nowrap /></div>)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: ar }}>
          <div style={{ display: "flex", flexDirection: "row-reverse", gap: 14 }}>
            {feats.map((f) => <div key={f} style={{ display: "flex", padding: "6px 26px 12px", borderRadius: 40, background: "rgba(255,255,255,0.1)" }}><R t={f} size={36} color="#c9ddd4" nowrap /></div>)}
          </div>
          <div style={{ display: "flex", alignSelf: "stretch", justifyContent: "center", background: "#b6f23a", color: "#07211c", borderRadius: 30, padding: "26px 20px", fontSize: host.length + (o.slug ?? "").length > 42 ? 38 : 46, fontWeight: 800 }}>{host}/g/{o.slug}</div>
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
