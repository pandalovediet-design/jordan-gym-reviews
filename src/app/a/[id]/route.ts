import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

// Ad click redirect: counts the click, then sends the visitor to the advertiser's link.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(new URL("/", req.url), 307);
  const { data: ad } = await createPublicClient().from("ads").select("link_url,clicks").eq("id", id).maybeSingle();
  if (!ad) return NextResponse.redirect(new URL("/", req.url), 307);
  const admin = createAdminClient();
  if (admin) await admin.from("ads").update({ clicks: ad.clicks + 1 }).eq("id", id).then(() => {}, () => {});
  return NextResponse.redirect(ad.link_url, 307);
}
