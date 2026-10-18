import { baseUrl } from "@/lib/base-url";
import type { MetadataRoute } from "next";
import { listCities, listSitemapEntries } from "@/lib/queries";
import { ORG_TYPE_PLURAL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const { orgs, products } = await listSitemapEntries().catch(() => ({ orgs: [], products: [] }));
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
    { url: `${base}/search` },
    ...orgs.map((o) => ({ url: `${base}/g/${o.slug}`, lastModified: o.updated_at })),
    ...products.map((p) => ({ url: `${base}/p/${p.id}`, lastModified: p.updated_at })),
  ];
}
