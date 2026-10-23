import QRCode from "qrcode";
import { createPublicClient } from "@/lib/supabase/public";
import { baseUrl } from "@/lib/base-url";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Public QR of a club page: /g/<slug>/qr (SVG) or ?format=png. Points to the stable /q/<slug> link, which counts the scan then opens the page. */
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const clean = decodeURIComponent(slug).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) return new Response("not found", { status: 404 });
  const { data: org } = await createPublicClient().from("organizations").select("slug").eq("slug", clean).eq("status", "published").maybeSingle();
  if (!org) return new Response("not found", { status: 404 });
  const url = `${baseUrl()}/q/${org.slug}`;
  const opts = { errorCorrectionLevel: "H" as const, margin: 2, color: { dark: "#07211c", light: "#ffffff" } };
  const q = new URL(req.url).searchParams;
  const cache = "public, s-maxage=3600, stale-while-revalidate=86400";
  const dl: Record<string, string> = q.get("download") === "1" ? { "content-disposition": `attachment; filename="qr-${org.slug}.${q.get("format") === "png" ? "png" : "svg"}"` } : {};
  if (q.get("format") === "png") {
    const png = await QRCode.toBuffer(url, { ...opts, width: 1200 });
    return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": cache, ...dl } });
  }
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": cache, ...dl } });
}
