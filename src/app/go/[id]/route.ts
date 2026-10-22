import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

// Product click redirect for "من غير جيم": counts the click, then sends the visitor to the store link.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(new URL("/no-gym", req.url), 307);
  const { data: p } = await createPublicClient().from("home_workout_products").select("url,clicks").eq("id", id).maybeSingle();
  if (!p) return NextResponse.redirect(new URL("/no-gym", req.url), 307);
  const admin = createAdminClient();
  if (admin) await admin.from("home_workout_products").update({ clicks: p.clicks + 1 }).eq("id", id).then(() => {}, () => {});
  return NextResponse.redirect(p.url, 307);
}
