import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

// Admin-only QR download: /admin/qr/<org id>?format=svg|png
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Not found", { status: 404 });
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const { data: org } = await supabase.from("organizations").select("slug").eq("id", id).maybeSingle();
  if (!org) return new NextResponse("Not found", { status: 404 });
  const url = `${await siteUrl()}/q/${org.slug}`;
  const opts = { errorCorrectionLevel: "H" as const, margin: 2, color: { dark: "#07211c", light: "#ffffff" } };
  if (req.nextUrl.searchParams.get("format") === "png") {
    const png = await QRCode.toBuffer(url, { ...opts, width: 1200 });
    return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "content-disposition": `attachment; filename="qr-${org.slug}.png"`, "cache-control": "private, no-store" } });
  }
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  return new NextResponse(svg, { headers: { "content-type": "image/svg+xml", "content-disposition": `attachment; filename="qr-${org.slug}.svg"`, "cache-control": "private, no-store" } });
}
