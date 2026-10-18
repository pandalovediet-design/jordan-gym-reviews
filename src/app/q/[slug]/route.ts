import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

// Stable short link printed on stickers: /q/<slug>. Counts the scan, then redirects to the page.
// The target can change (subdomain, custom domain) without reprinting the sticker.
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const clean = decodeURIComponent(slug).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) return NextResponse.redirect(new URL("/", req.url), 307);
  const { data: org } = await createPublicClient()
    .from("organizations").select("id").eq("slug", clean).eq("status", "published").maybeSingle();
  if (!org) return NextResponse.redirect(new URL("/search", req.url), 307);
  const admin = createAdminClient();
  if (admin) await admin.from("analytics_events").insert({ organization_id: org.id, event_type: "qr_scan" }).then(() => {}, () => {});
  return NextResponse.redirect(new URL(`/g/${clean}`, req.url), 307);
}
