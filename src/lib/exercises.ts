import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { publicMediaUrl, waNumber } from "@/lib/format";

export type ExerciseRow = {
  id: string; slug: string; name_ar: string; muscle_group: string; secondary_ar: string | null;
  level: string; gear_ar: string | null; summary_ar: string | null; count: number;
};

export async function listExercises(): Promise<ExerciseRow[]> {
  const db = createPublicClient();
  const [{ data: ex }, { data: ex2 }] = await Promise.all([
    db.from("exercises").select("id,slug,name_ar,muscle_group,secondary_ar,level,gear_ar,summary_ar").order("muscle_group").order("sort_order"),
    db.from("exercise_explanations").select("exercise_id").limit(5000),
  ]);
  const n = new Map<string, number>();
  for (const r of ex2 ?? []) n.set(r.exercise_id, (n.get(r.exercise_id) ?? 0) + 1);
  return (ex ?? []).map((e) => ({ ...e, count: n.get(e.id) ?? 0 }));
}

export type Explanation = {
  id: string; video_url: string | null; steps: string[]; mistake: string | null;
  coach: { id: string; slug: string; name: string; city: string; wa: string | null; photo: string | null };
};

export async function getExercise(slug: string) {
  const db = createPublicClient();
  const { data: ex } = await db.from("exercises").select("id,slug,name_ar,muscle_group,secondary_ar,level,gear_ar,summary_ar").eq("slug", slug).maybeSingle();
  if (!ex) return null;
  const { data: rows } = await db.from("exercise_explanations")
    .select("id,video_url,steps_ar,mistake_ar,organizations!inner(id,slug,name_ar,city,whatsapp,phone)")
    .eq("exercise_id", ex.id).order("created_at");
  const ids = (rows ?? []).map((r) => r.organizations?.id).filter((x): x is string => !!x);
  const media = ids.length
    ? (await db.from("organization_media").select("organization_id,storage_path,is_cover,sort_order").in("organization_id", ids).order("is_cover", { ascending: false }).order("sort_order")).data ?? []
    : [];
  const photo = new Map<string, string>();
  for (const m of media) if (!photo.has(m.organization_id)) photo.set(m.organization_id, publicMediaUrl(m.storage_path));
  const explanations: Explanation[] = (rows ?? []).filter((r) => r.organizations).map((r) => {
    const o = r.organizations!;
    return { id: r.id, video_url: r.video_url, steps: r.steps_ar, mistake: r.mistake_ar,
      coach: { id: o.id, slug: o.slug, name: o.name_ar, city: o.city, wa: waNumber(o.whatsapp ?? o.phone), photo: photo.get(o.id) ?? null } };
  });
  const { data: related } = await db.from("exercises").select("slug,name_ar").eq("muscle_group", ex.muscle_group).neq("id", ex.id).order("sort_order").limit(6);
  return { ex, explanations, related: related ?? [] };
}
