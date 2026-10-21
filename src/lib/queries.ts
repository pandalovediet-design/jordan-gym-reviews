import { createPublicClient } from "@/lib/supabase/public";
import { ammanDate, asGlow, cleanQuery } from "@/lib/format";
import { distanceKm } from "@/lib/maps";
import type { Database, Enums, Tables } from "@/lib/database.types";

export const PAGE_SIZE = 12;
const ORG_TYPES = ["gym", "independent_coach", "sports_facility", "store", "nutritionist", "healthy_food", "sports_health"] as const;
export const isOrgType = (v: string | undefined): v is Enums<"org_type"> =>
  !!v && (ORG_TYPES as readonly string[]).includes(v);

export const WOMEN_FILTERS = ["only", "any"] as const;

const LISTING_COLS = "id,slug,name_ar,type,city,area,description_ar,verified_at,is_featured,category_id,category_slug,category_name,women_access,women_hours_note,free_trial_note,min_price_jod,latitude,longitude,branch_count,branch_cities,branch_women_only,branch_women_hours,branch_points,glow_color";

type ListingRow = {
  id: string | null; slug: string | null; name_ar: string | null; type: Enums<"org_type"> | null; city: string | null; area: string | null;
  description_ar: string | null; verified_at: string | null; is_featured: boolean | null;
  category_id: string | null; category_slug: string | null; category_name: string | null;
  women_access: string | null; women_hours_note: string | null;
  free_trial_note: string | null; min_price_jod: number | null;
  latitude: number | null; longitude: number | null;
  branch_count: number | null; branch_cities: string[] | null; branch_women_only: boolean | null; branch_women_hours: boolean | null; branch_points: unknown; glow_color: string | null;
};
function mapListing(data: ListingRow[]) {
  return data.flatMap((o) =>
    o.id && o.slug && o.name_ar && o.type && o.city
      ? [{
          id: o.id, slug: o.slug, name_ar: o.name_ar, type: o.type, city: o.city, area: o.area, description_ar: o.description_ar,
          verified_at: o.verified_at, is_featured: !!o.is_featured,
          category_id: o.category_id, category_slug: o.category_slug, category_name: o.category_name,
          women_access: (o.women_access === "women_only" || o.women_access === "women_hours" ? o.women_access : "none") as "none" | "women_only" | "women_hours",
          women_hours_note: o.women_hours_note,
          free_trial_note: o.free_trial_note,
          min_price_jod: o.min_price_jod == null ? null : Number(o.min_price_jod),
          lat: o.latitude == null ? null : Number(o.latitude), lng: o.longitude == null ? null : Number(o.longitude),
          branch_count: Number(o.branch_count ?? 1), glow_color: asGlow(o.glow_color),
          branch_women_only: !!o.branch_women_only, branch_women_hours: !!o.branch_women_hours,
          points: [
            ...(o.latitude != null && o.longitude != null ? [{ lat: Number(o.latitude), lng: Number(o.longitude) }] : []),
            ...(Array.isArray(o.branch_points) ? (o.branch_points as { lat: number; lng: number }[]).filter((p) => p && typeof p.lat === "number" && typeof p.lng === "number") : []),
          ],
        }]
      : [],
  );
}
async function withCovers<T extends { id: string }>(db: ReturnType<typeof createPublicClient>, rows: T[]) {
  const ids = rows.map((o) => o.id);
  const covers = ids.length
    ? (await db.from("organization_media").select("organization_id,storage_path,alt_text,is_cover,sort_order").in("organization_id", ids).order("is_cover", { ascending: false }).order("sort_order")).data ?? []
    : [];
  return rows.map((o) => ({ ...o, cover: covers.find((c) => c.organization_id === o.id) ?? null }));
}

export async function searchOrgs(opts: { q?: string; type?: string; city?: string; area?: string; category?: string; women?: string; maxPrice?: number; trial?: boolean; near?: { lat: number; lng: number } | null; page: number }) {
  const db = createPublicClient();
  let query = db
    .from("organizations_listing")
    .select(LISTING_COLS, { count: "exact" })
    .order("is_featured", { ascending: false })
    .order("featured_rank", { ascending: false })
    .order("created_at", { ascending: false });
  query = opts.near ? query.limit(500) : query.range((opts.page - 1) * PAGE_SIZE, opts.page * PAGE_SIZE - 1);
  const q = cleanQuery(opts.q ?? "");
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,area.ilike.%${q}%`);
  if (isOrgType(opts.type)) query = query.eq("type", opts.type);
  const city = cleanQuery(opts.city ?? "");
  if (city) query = query.or(`city.eq.${city},branch_cities.cs.{"${city}"}`);
  const area = cleanQuery(opts.area ?? "");
  if (area) query = query.eq("area", area);
  if (opts.category) query = query.eq("category_slug", /^[a-z0-9-]{2,40}$/.test(opts.category) ? opts.category : "-");
  if (opts.women === "only") query = query.or("women_access.eq.women_only,branch_women_only.eq.true");
  else if (opts.women === "any") query = query.or("women_access.in.(women_only,women_hours),branch_women_only.eq.true,branch_women_hours.eq.true");
  if (opts.maxPrice && opts.maxPrice > 0 && opts.maxPrice < 100000) query = query.lte("min_price_jod", opts.maxPrice);
  if (opts.trial) query = query.not("free_trial_note", "is", null);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  if (opts.near) {
    const near = opts.near;
    const all = mapListing(data ?? []).flatMap((o) => (o.points.length ? [{ ...o, distance_km: Math.min(...o.points.map((p) => distanceKm(near, p))) }] : []))
      .sort((a, b) => a.distance_km - b.distance_km);
    const slice = all.slice((opts.page - 1) * PAGE_SIZE, opts.page * PAGE_SIZE);
    return { total: all.length, items: await withCovers(db, slice) };
  }
  return { total: count ?? 0, items: await withCovers(db, mapListing(data ?? [])) };
}

export async function listCategories() {
  const { data } = await createPublicClient().from("org_categories").select("id,slug,org_type,name_ar,sort_order").eq("is_active", true).order("sort_order");
  return data ?? [];
}

/** Homepage: one section per category (latest/featured first), plus the Pink Zone row. */
export async function listHomeSections(perSection = 6) {
  const db = createPublicClient();
  const [cats, listing] = await Promise.all([
    listCategories(),
    db.from("organizations_listing").select(LISTING_COLS)
      .order("is_featured", { ascending: false }).order("featured_rank", { ascending: false }).order("created_at", { ascending: false }).limit(400),
  ]);
  if (listing.error) throw new Error(listing.error.message);
  const rows = mapListing(listing.data ?? []);
  const sections = cats
    .map((c) => ({ key: c.slug, title: c.name_ar, href: `/search?category=${c.slug}`, items: rows.filter((o) => o.category_id === c.id) }))
    .filter((s) => s.items.length > 0)
    .map((s) => ({ ...s, total: s.items.length, items: s.items.slice(0, perSection) }));
  const uncategorized = rows.filter((o) => !o.category_id);
  if (uncategorized.length) sections.push({ key: "other", title: "أنشطة أخرى", href: "/search", items: uncategorized.slice(0, perSection), total: uncategorized.length });
  const pink = rows.filter((o) => o.women_access === "women_only" || o.branch_women_only);
  const shown = new Set([...sections.flatMap((s) => s.items), ...pink.slice(0, perSection)].map((o) => o.id));
  const withCover = await withCovers(db, rows.filter((o) => shown.has(o.id)));
  const byId = new Map(withCover.map((o) => [o.id, o]));
  return {
    sections: sections.map((s) => ({ ...s, items: s.items.map((o) => byId.get(o.id)!) })),
    pink: { total: pink.length, items: pink.slice(0, perSection).map((o) => byId.get(o.id)!) },
  };
}

export async function searchProducts(opts: { q?: string; page: number }) {
  const db = createPublicClient();
  let query = db
    .from("products")
    .select("id,name_ar,brand,price_jod,old_price_jod,availability,description_ar,image_path,organization_id,organizations(slug,name_ar,city)", { count: "exact" })
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
  const [hours, services, media, offers, products, classes, branches, trainers, promo, menu, coaches, coachGyms] = await Promise.all([
    db.from("organization_hours").select("*").eq("organization_id", org.id).order("weekday"),
    db.from("organization_services").select("*").eq("organization_id", org.id).eq("is_active", true).order("sort_order"),
    db.from("organization_media").select("*").eq("organization_id", org.id).order("sort_order"),
    db.from("offers").select("*").eq("organization_id", org.id).eq("is_active", true).lte("starts_at", now).gte("ends_at", now),
    org.type === "store"
      ? db.from("products").select("id,name_ar,brand,price_jod,old_price_jod,availability,description_ar,image_path,branch_id").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(48)
      : Promise.resolve({ data: [] }),
    db.from("org_classes").select("*").eq("organization_id", org.id).eq("is_active", true).order("weekday").order("starts_at"),
    db.from("org_branches").select("*").eq("organization_id", org.id).eq("is_active", true).order("is_main", { ascending: false }).order("sort_order"),
    db.from("org_trainers").select("*").eq("organization_id", org.id).eq("is_active", true).order("sort_order"),
    db.from("org_promotions").select("glow_color,glow_until").eq("organization_id", org.id).maybeSingle(),
    org.type === "healthy_food"
      ? db.from("menu_items").select("*").eq("organization_id", org.id).order("sort_order").order("created_at")
      : Promise.resolve({ data: [] }),
    org.type === "gym" ? db.rpc("get_gym_partners", { p_gym: org.id }) : Promise.resolve({ data: [] }),
    (org.type === "independent_coach" || org.type === "nutritionist") ? db.rpc("get_coach_gyms", { p_coach: org.id }) : Promise.resolve({ data: [] }),
  ]);
  const slots = org.type === "sports_facility"
    ? ((await db.from("facility_slots").select("id,slot_date,starts_at,ends_at,status").eq("organization_id", org.id)
        .gte("slot_date", ammanDate(0)).lte("slot_date", ammanDate(14)).order("slot_date").order("starts_at")).data ?? [])
    : [];
  const coachProfile = (org.type === "independent_coach" || org.type === "nutritionist")
    ? (await db.from("coach_profiles").select("*").eq("organization_id", org.id).maybeSingle()).data
    : null;
  return {
    org,
    coaches: (coaches.data ?? []) as Database["public"]["Functions"]["get_gym_partners"]["Returns"],
    coachGyms: (coachGyms.data ?? []) as Database["public"]["Functions"]["get_coach_gyms"]["Returns"],
    coachProfile,
    slots,
    hours: hours.data ?? [],
    services: services.data ?? [],
    media: media.data ?? [],
    offers: offers.data ?? [],
    products: products.data ?? [],
    classes: classes.data ?? [],
    branches: branches.data ?? [],
    trainers: trainers.data ?? [],
    glow: promo.data?.glow_until && +new Date(promo.data.glow_until) > Date.now() ? asGlow(promo.data.glow_color) : null,
    menu: (menu.data ?? []) as Tables<"menu_items">[],
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

export async function listBySlugs(slugs: string[]) {
  const clean = slugs.filter((s) => /^[a-z0-9-]{2,60}$/i.test(s)).slice(0, 100);
  if (!clean.length) return [];
  const db = createPublicClient();
  const { data, error } = await db.from("organizations_listing").select(LISTING_COLS).in("slug", clean);
  if (error) throw new Error(error.message);
  const rows = mapListing(data ?? []).sort((a, b) => clean.indexOf(a.slug) - clean.indexOf(b.slug));
  return withCovers(db, rows);
}

export async function listLiveFlash(limit = 6) {
  const now = new Date().toISOString();
  const { data } = await createPublicClient()
    .from("flash_slots")
    .select("id,title_ar,description_ar,discount_percent,price_jod,ends_at,organizations(slug,name_ar,city,status)")
    .lte("starts_at", now).gt("ends_at", now).not("title_ar", "is", null)
    .order("ends_at", { ascending: true }).limit(limit);
  return (data ?? []).flatMap((f) =>
    f.organizations && f.title_ar
      ? [{ id: f.id, title: f.title_ar, description: f.description_ar, discount: f.discount_percent, price: f.price_jod != null ? `${Number(f.price_jod).toFixed(2)} د.أ` : null, ends_at: f.ends_at,
           org: { slug: f.organizations.slug, name: f.organizations.name_ar, city: f.organizations.city } }]
      : [],
  );
}

export async function listPartners() {
  const now = new Date().toISOString();
  const { data } = await createPublicClient().from("partners").select("id,name_ar,logo_path,link_url,organizations(slug)")
    .eq("is_active", true).or(`ends_at.is.null,ends_at.gt.${now}`).order("sort_order").order("created_at").limit(24);
  return data ?? [];
}

export async function listTrails() {
  const { data } = await createPublicClient().from("trails").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(200);
  return data ?? [];
}

export async function getTrail(slug: string) {
  const { data } = await createPublicClient().from("trails").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return data;
}
