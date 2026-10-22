import { baseUrl } from "@/lib/base-url";
import type { MetadataRoute } from "next";
import { listExercises } from "@/lib/exercises";
import { listHomeWorkouts } from "@/lib/home-workouts";
import { listNutrition } from "@/lib/nutrition";
import { listCities, listSitemapEntries, listTrails } from "@/lib/queries";
import { ORG_TYPE_PLURAL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const { orgs, products } = await listSitemapEntries().catch(() => ({ orgs: [], products: [] }));
  const trails = await listTrails().catch(() => []);
  const exercises = await listExercises().catch(() => []);
  const homeWorkouts = await listHomeWorkouts().catch(() => []);
  const nutrition = await listNutrition().catch(() => []);
  const types = Object.keys(ORG_TYPE_PLURAL) as Enums<"org_type">[];
  const dirs = (
    await Promise.all(
      types.map(async (t) => {
        const cities = await listCities(t).catch(() => []);
        return cities.length ? [`${base}/directory/${t}`, ...cities.map((c) => `${base}/directory/${t}/${encodeURIComponent(c.city)}`)] : [];
      }),
    )
  ).flat();
  return [
    { url: base },
    ...dirs.map((url) => ({ url })),
    { url: `${base}/directory` },
    { url: `${base}/pink` },
    { url: `${base}/now` },
    { url: `${base}/awards` },
    { url: `${base}/guides` },
    { url: `${base}/guides/budget` },
    { url: `${base}/guides/late` },
    { url: `${base}/join` },
    { url: `${base}/sponsors` },
    { url: `${base}/deals` },
    { url: `${base}/reels` },
    { url: `${base}/exercises` },
    ...exercises.map((e) => ({ url: `${base}/exercises/${e.slug}` })),
    { url: `${base}/no-gym` },
    { url: `${base}/no-deprivation` },
    ...nutrition.map((w) => ({ url: `${base}/no-deprivation/${w.slug}` })),
    ...homeWorkouts.map((w) => ({ url: `${base}/no-gym/${w.slug}` })),
    { url: `${base}/market` },
    { url: `${base}/search` },
    { url: `${base}/trails` },
    { url: `${base}/tools` },
    ...trails.map((t) => ({ url: `${base}/trails/${t.slug}`, lastModified: t.updated_at })),
    { url: `${base}/terms` },
    { url: `${base}/privacy` },
    ...orgs.map((o) => ({ url: `${base}/g/${o.slug}`, lastModified: o.updated_at })),
    ...products.map((p) => ({ url: `${base}/p/${p.id}`, lastModified: p.updated_at })),
  ];
}
