import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** JSON export of the signed-in member's own data and anything their businesses hold. Uses RLS: only rows the user can see. */
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
  const [favorites, workouts, challenges, food, water] = await Promise.all([
    supabase.from("user_favorites").select("created_at, organizations(slug, name_ar)").eq("user_id", u.user.id),
    supabase.from("user_workout_logs").select("workout_date, activity, minutes, muscles, updated_at").eq("user_id", u.user.id).order("workout_date"),
    supabase.from("user_challenge_progress").select("week_start, challenge_id, progress, updated_at").eq("user_id", u.user.id).order("week_start"),
    supabase.from("user_food_logs").select("log_date, meal, note, rating, updated_at").eq("user_id", u.user.id).order("log_date"),
    supabase.from("user_water_logs").select("log_date, cups").eq("user_id", u.user.id).order("log_date"),
  ]);
  const member = {
    display_name: typeof u.user.user_metadata?.full_name === "string" ? u.user.user_metadata.full_name : null,
    favorites: favorites.data ?? [],
    workout_logs: workouts.data ?? [],
    challenge_progress: challenges.data ?? [],
    food_log: food.data ?? [],
    water_log: water.data ?? [],
  };
  const body = JSON.stringify({ exported_at: new Date().toISOString(), email: u.user.email, member, organizations: orgs ?? [], branches, hours, services, products, offers, menu, classes, trainers, inquiries }, null, 2);
  return new NextResponse(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": 'attachment; filename="my-data.json"' } });
}
