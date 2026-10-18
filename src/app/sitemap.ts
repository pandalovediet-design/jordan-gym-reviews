import type { MetadataRoute } from "next";
import { listSitemapEntries } from "@/lib/queries";

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { orgs, products } = await listSitemapEntries().catch(() => ({ orgs: [], products: [] }));
  return [
    { url: base },
    { url: `${base}/search` },
    ...orgs.map((o) => ({ url: `${base}/g/${o.slug}`, lastModified: o.updated_at })),
    ...products.map((p) => ({ url: `${base}/p/${p.id}`, lastModified: p.updated_at })),
  ];
}
