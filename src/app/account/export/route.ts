import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** JSON export of everything the signed-in user's businesses hold. Uses RLS: only rows the user can see. */
export async function GET() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: orgs } = await supabase.from("organizations").select("*").eq("created_by", u.user.id);
  const ids = (orgs ?? []).map((o) => o.id);
  const byOrg = async (t: "org_branches" | "organization_hours" | "organization_services" | "products" | "offers" | "menu_items" | "inquiries" | "org_classes" | "org_trainers") =>
    ids.length ? ((await supabase.from(t).select("*").in("organization_id", ids)).data ?? []) : [];
  const [branches, hours, services, products, offers, menu, inquiries, classes, trainers] = await Promise.all([
    byOrg("org_branches"), byOrg("organization_hours"), byOrg("organization_services"), byOrg("products"), byOrg("offers"),
    byOrg("menu_items"), byOrg("inquiries"), byOrg("org_classes"), byOrg("org_trainers"),
  ]);
  const body = JSON.stringify({ exported_at: new Date().toISOString(), email: u.user.email, organizations: orgs ?? [], branches, hours, services, products, offers, menu, classes, trainers, inquiries }, null, 2);
  return new NextResponse(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": 'attachment; filename="my-data.json"' } });
}
