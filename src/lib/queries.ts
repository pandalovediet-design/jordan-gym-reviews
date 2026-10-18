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
    .from("organizations")
    .select("id,slug,name_ar,type,city,area,description_ar,verified_at", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range((opts.page - 1) * PAGE_SIZE, opts.page * PAGE_SIZE - 1);
  const q = cleanQuery(opts.q ?? "");
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,area.ilike.%${q}%`);
  if (isOrgType(opts.type)) query = query.eq("type", opts.type);
  const city = cleanQuery(opts.city ?? "");
  if (city) query = query.eq("city", city);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((o) => o.id);
  const ratings = ids.length
    ? (await db.from("organization_ratings").select("*").in("organization_id", ids)).data ?? []
    : [];
  const covers = ids.length
    ? (await db.from("organization_media").select("organization_id,storage_path,alt_text,is_cover,sort_order").in("organization_id", ids).order("is_cover", { ascending: false }).order("sort_order")).data ?? []
    : [];
  return {
    total: count ?? 0,
    items: (data ?? []).map((o) => ({
      ...o,
      rating: ratings.find((r) => r.organization_id === o.id) ?? null,
      cover: covers.find((c) => c.organization_id === o.id) ?? null,
    })),
  };
}

export async function searchProducts(opts: { q?: string; page: number }) {
  const db = createPublicClient();
  let query = db
    .from("products")
    .select("id,name_ar,brand,price_jod,availability,organization_id,organizations(slug,name_ar,city)", { count: "exact" })
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
  const [hours, services, media, offers, products, reviews, rating] = await Promise.all([
    db.from("organization_hours").select("*").eq("organization_id", org.id).order("weekday"),
    db.from("organization_services").select("*").eq("organization_id", org.id).eq("is_active", true).order("sort_order"),
    db.from("organization_media").select("*").eq("organization_id", org.id).order("sort_order"),
    db.from("offers").select("*").eq("organization_id", org.id).eq("is_active", true).lte("starts_at", now).gte("ends_at", now),
    org.type === "store"
      ? db.from("products").select("id,name_ar,brand,price_jod,availability").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(48)
      : Promise.resolve({ data: [] }),
    db.from("reviews").select("id,author_name,rating,body,created_at,review_responses(body)").eq("organization_id", org.id).eq("status", "published").order("created_at", { ascending: false }).limit(20),
    db.from("organization_ratings").select("*").eq("organization_id", org.id).maybeSingle(),
  ]);
  return {
    org,
    hours: hours.data ?? [],
    services: services.data ?? [],
    media: media.data ?? [],
    offers: offers.data ?? [],
    products: products.data ?? [],
    reviews: reviews.data ?? [],
    rating: rating.data,
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
