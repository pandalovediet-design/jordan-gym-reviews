import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmin } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "backups";
const KEEP_DAYS = 14;
/** The directory content that would hurt to lose. Personal member logs are not exported. */
const TABLES = [
  "countries", "cities", "org_categories", "organizations", "org_branches", "organization_hours", "organization_media",
  "organization_services", "membership_plans", "offers", "org_trainers", "org_classes", "business_posts", "ads", "ad_accounting",
  "partners", "trails", "videos", "home_workouts", "nutrition_items", "site_settings",
] as const;

/** Daily snapshot of the directory as one JSON file in a private storage bucket. Called by Vercel Cron. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  const db = createAdminClient();
  if (!db) return new Response("service key missing", { status: 500 });

  try {
    await db.storage.createBucket(BUCKET, { public: false }).catch(() => {});
    const data: Record<string, unknown[]> = {};
    for (const table of TABLES) {
      const rows: unknown[] = [];
      for (let from = 0; ; from += 1000) {
        const { data: page, error } = await db.from(table).select("*").range(from, from + 999);
        if (error) throw new Error(`${table}: ${error.message}`);
        rows.push(...(page ?? []));
        if (!page || page.length < 1000) break;
      }
      data[table] = rows;
    }
    const day = new Date().toISOString().slice(0, 10);
    const body = JSON.stringify({ taken_at: new Date().toISOString(), tables: data });
    const { error: upErr } = await db.storage.from(BUCKET).upload(`${day}.json`, body, { contentType: "application/json", upsert: true });
    if (upErr) throw new Error(upErr.message);

    const { data: files } = await db.storage.from(BUCKET).list("", { limit: 200 });
    const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
    const old = (files ?? []).map((f) => f.name).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(0, 10) < cutoff);
    if (old.length) await db.storage.from(BUCKET).remove(old);

    return Response.json({ ok: true, day, organizations: data.organizations.length, bytes: body.length, removed: old.length });
  } catch (e) {
    await notifyAdmin(`⚠️ النسخة الاحتياطية اليومية فشلت\n${String((e as Error).message).slice(0, 300)}`);
    return new Response("backup failed", { status: 500 });
  }
}
