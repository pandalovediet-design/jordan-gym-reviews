import { createPublicClient } from "@/lib/supabase/public";
import { cleanQuery } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export const PAGE_SIZE = 12;
const ORG_TYPES = ["gym", "independent_coach", "sports_facility", "store", "nutritionist"] as const;
export const isOrgType = (v: string | undefined): v is Enums<"org_type"> =>
  !!v && (ORG_TYPES as readonly string[]).includes(v);

export async function searchOrgs(opts: { q?: string; type?: string; city?: string; page: number }) {
  const db = createPublicClient();
  let query = db
    .from("organizations_listing")
    .select("id,slug,name_ar,type,city,area,description_ar,verified_at,is_featured", { count: "exact" })
    .order("is_featured", { ascending: false })
    .order("featured_rank", { ascending: false })
    .order("created_at", { ascending: false })
    .range((opts.page - 1) * PAGE_SIZE, opts.page * PAGE_SIZE - 1);
  const q = cleanQuery(opts.q ?? "");
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,area.ilike.%${q}%`);
  if (isOrgType(opts.type)) query = query.eq("type", opts.type);
  const city = cleanQuery(opts.city ?? "");
  if (city) query = query.eq("city", city);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []).flatMap((o) =>
    o.id && o.slug && o.name_ar && o.type && o.city
      ? [{ id: o.id, slug: o.slug, name_ar: o.name_ar, type: o.type, city: o.city, area: o.area, description_ar: o.description_ar, verified_at: o.verified_at, is_featured: !!o.is_featured }]
      : [],
  );
  const ids = rows.map((o) => o.id);
  const covers = ids.length
    ? (await db.from("organization_media").select("organization_id,storage_path,alt_text,is_cover,sort_order").in("organization_id", ids).order("is_cover", { ascending: false }).order("sort_order")).data ?? []
    : [];
  return {
    total: count ?? 0,
    items: rows.map((o) => ({
      ...o,
      cover: covers.find((c) => c.organization_id === o.id) ?? null,
    })),
  };
}

export async function searchProducts(opts: { q?: string; page: number }) {
  const db = createPublicClient();
  let query = db
    .from("products")
    .select("id,name_ar,brand,price_jod,availability,description_ar,image_path,organization_id,organizations(slug,name_ar,city)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((opts.page - 1) * PAGE_SIZE, opts.page * PAGE_SIZE - 1);
  const q = cleanQuery(opts.q ?? "");
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,brand.ilike.%${q}%`);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { total: count ?? 0, items: data ?? [] };
}

export async function getOrgBySlug(slug: string) {
  const db = createPublicClient();
  const { data: org } = await db
    .from("organizations").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!org) return null;
  const now = new Date().toISOString();
  const [hours, services, media, offers, products] = await Promise.all([
    db.from("organization_hours").select("*").eq("organization_id", org.id).order("weekday"),
    db.from("organization_services").select("*").eq("organization_id", org.id).eq("is_active", true).order("sort_order"),
    db.from("organization_media").select("*").eq("organization_id", org.id).order("sort_order"),
    db.from("offers").select("*").eq("organization_id", org.id).eq("is_active", true).lte("starts_at", now).gte("ends_at", now),
    org.type === "store"
      ? db.from("products").select("id,name_ar,brand,price_jod,availability,description_ar,image_path").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(48)
      : Promise.resolve({ data: [] }),
  ]);
  return {
    org,
    hours: hours.data ?? [],
    services: services.data ?? [],
    media: media.data ?? [],
    offers: offers.data ?? [],
    products: products.data ?? [],
  };
}

export async function getProduct(id: string) {
  const db = createPublicClient();
  const { data } = await db
    .from("products")
    .select("*, product_categories(name_ar,slug), organizations(slug,name_ar,city,whatsapp,phone)")
    .eq("id", id).maybeSingle();
  return data;
}

export async function listSitemapEntries() {
  const db = createPublicClient();
  const [orgs, products] = await Promise.all([
    db.from("organizations").select("slug,updated_at").eq("status", "published").limit(5000),
    db.from("products").select("id,updated_at").limit(5000),
  ]);
  return { orgs: orgs.data ?? [], products: products.data ?? [] };
}

export async function listActiveOffers(limit = 6) {
  const db = createPublicClient();
  const now = new Date().toISOString();
  const { data } = await db
    .from("offers")
    .select("id,title_ar,description_ar,discount_percent,offer_price_jod,ends_at,kind,organizations(slug,name_ar,city,status)")
    .eq("is_active", true).lte("starts_at", now).gte("ends_at", now)
    .order("ends_at", { ascending: true }).limit(limit);
  return (data ?? []).filter((o) => o.organizations);
}

export async function listCities(type?: Enums<"org_type">) {
  const db = createPublicClient();
  let q = db.from("organizations_listing").select("city,type").limit(5000);
  if (type) q = q.eq("type", type);
  const { data } = await q;
  const counts = new Map<string, number>();
  for (const r of data ?? []) if (r.city) counts.set(r.city, (counts.get(r.city) ?? 0) + 1);
  return [...counts.entries()].map(([city, n]) => ({ city, n })).sort((a, b) => b.n - a.n);
}
