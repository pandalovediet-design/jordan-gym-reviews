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
  const where = [o.area, o.city].filter(Boolean).join("، ");
  const host = baseUrl().replace(/^https?:\/\//, "");

  // Satori shapes Arabic but doesn't reorder words, so each phrase is laid out as words in a row-reverse flex box.
  const R = ({ t, size, weight = 400, color = "#eef6f2", lh = 1.3, nowrap = false }: { t: string; size: number; weight?: number; color?: string; lh?: number; nowrap?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: nowrap ? "nowrap" : "wrap", columnGap: size * 0.28, fontSize: size, fontWeight: weight, color, lineHeight: lh }}>
      {t.split(/\s+/).filter(Boolean).map((w, i) => <span key={i} style={{ display: "flex" }}>{w}</span>)}
    </div>
  );
  const ar = "flex-end";

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "linear-gradient(160deg,#0d2f28 0%,#07211c 70%)", color: "#eef6f2", fontFamily: "Taj, TajL" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: "row-reverse" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={84} height={84} alt="" style={{ borderRadius: 42 }} />
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>Jordan <span style={{ color: "#b6f23a", marginLeft: 10 }}>Gym</span></div>
          </div>
          {isVerified(o) && <div style={{ display: "flex", background: "#b6f23a", padding: "6px 28px 10px", borderRadius: 40 }}><R t="موثّق" size={30} weight={800} color="#07211c" nowrap /></div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: ar }}>
          <R t={ORG_TYPE_LABEL[o.type as keyof typeof ORG_TYPE_LABEL] ?? ""} size={38} color="#b6f23a" />
          <R t={o.name_ar ?? ""} size={(o.name_ar ?? "").length > 22 ? 80 : 100} weight={800} lh={1.3} />
          {where && <R t={where} size={44} color="#9bb5ab" />}
          {o.min_price_jod != null && (
            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "baseline", gap: 16, marginTop: 20 }}>
              <R t="يبدأ من" size={40} color="#9bb5ab" />
              <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#b6f23a" }}>{Number(o.min_price_jod).toFixed(0)}</div>
              <R t="د.أ" size={40} />
            </div>
          )}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
              {chips.map((c) => <div key={c} style={{ display: "flex", padding: "6px 26px 10px", borderRadius: 40, background: "rgba(255,255,255,0.1)" }}><R t={c} size={32} nowrap /></div>)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "2px solid rgba(255,255,255,0.15)", paddingTop: 36, alignItems: ar }}>
          <R t="الأسعار والدوام والموقع وواتساب" size={34} color="#9bb5ab" />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>{host}/g/{o.slug}</div>
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
