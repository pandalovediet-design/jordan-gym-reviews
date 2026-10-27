import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

/** Every section of the public site that can sit in the header tab bar. */
export const NAV_CATALOG = [
  { href: "/search", label: "البحث" },
  { href: "/pink", label: "💗 Pink Zone", cls: "text-pink-300" },
  { href: "/now", label: "⏱️ هسا" },
  { href: "/awards", label: "🏆 نادي الشهر" },
  { href: "/exercises", label: "🏋️ التمارين" },
  { href: "/log", label: "🔥 سجل تمريني" },
  { href: "/deals", label: "🎟️ أكواد خصم" },
  { href: "/no-gym", label: "🏠 من غير جيم" },
  { href: "/no-deprivation", label: "🥗 من غير حرمان" },
  { href: "/rooh-w-jasad", label: "🕌 روح وجسد" },
  { href: "/reels", label: "🎬 ريلز" },
  { href: "/market", label: "🔄 سوق المعدات" },
  { href: "/trails", label: "🥾 المسارات" },
  { href: "/tools", label: "🧮 الحاسبة" },
  { href: "/favorites", label: "❤️ المفضلة" },
] as const;

/** Homepage blocks the platform owner can switch on or off. */
export const HOME_BLOCKS = [
  { key: "tiles", label: "أزرار الأقسام تحت البحث (نوادي، مدربين، ملاعب...)" },
  { key: "banner", label: "البانر الإعلاني الكبير" },
  { key: "sponsored", label: "كروت «ممول»" },
  { key: "flash", label: "شريط الفلاش" },
  { key: "offers", label: "عروض ودورات حالية" },
  { key: "pink", label: "💗 Pink Zone" },
  { key: "sections", label: "أقسام الأنشطة (نوادي، ملاعب، متاجر...)" },
  { key: "trails", label: "🥾 مسارات المشي" },
  { key: "partners", label: "شركاء المنصة" },
] as const;

export type HomeBlock = (typeof HOME_BLOCKS)[number]["key"];

export type SiteSettings = {
  /** Header tabs to show, in this order (hrefs from NAV_CATALOG). The rest live on /sections. */
  nav: string[];
  /** Homepage blocks to show. */
  home: Record<HomeBlock, boolean>;
  /** Cards per homepage section before the "عرض الكل" link; 0 = all of them. */
  perSection: number;
  /** How many activity sections the homepage shows (biggest first); 0 = all. */
  maxSections: number;
  heroTitle: string;
  heroAccent: string;
  heroSubtitle: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  nav: ["/search", "/pink", "/now", "/awards", "/exercises", "/no-gym", "/trails", "/favorites"],
  home: { tiles: true, banner: true, sponsored: true, flash: true, offers: true, pink: true, sections: true, trails: true, partners: true },
  perSection: 6,
  maxSections: 6,
  heroTitle: "دليلك للرياضة في الأردن،",
  heroAccent: "أسعار حقيقية وتواصل مباشر",
  heroSubtitle: "نوادي، مدربين، منشآت ومتاجر رياضية: الأسعار، الدوام، الموقع والتواصل المباشر في مكان واحد.",
};

const NAV_HREFS = new Set<string>(NAV_CATALOG.map((n) => n.href));
const clampInt = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : dflt;
};
const text = (v: unknown, max: number, dflt: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : dflt);

/** Merge whatever is stored with the defaults, so a missing or partial row never breaks the site. */
export function normalizeSettings(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const nav = Array.isArray(r.nav) ? [...new Set(r.nav.filter((h): h is string => typeof h === "string" && NAV_HREFS.has(h)))] : DEFAULT_SETTINGS.nav;
  const homeRaw = (r.home && typeof r.home === "object" ? r.home : {}) as Record<string, unknown>;
  const home = { ...DEFAULT_SETTINGS.home };
  for (const b of HOME_BLOCKS) if (typeof homeRaw[b.key] === "boolean") home[b.key] = homeRaw[b.key] as boolean;
  return {
    nav,
    home,
    perSection: clampInt(r.perSection, 0, 60, DEFAULT_SETTINGS.perSection),
    maxSections: clampInt(r.maxSections, 0, 40, DEFAULT_SETTINGS.maxSections),
    heroTitle: text(r.heroTitle, 120, DEFAULT_SETTINGS.heroTitle),
    heroAccent: typeof r.heroAccent === "string" ? r.heroAccent.trim().slice(0, 80) : DEFAULT_SETTINGS.heroAccent,
    heroSubtitle: text(r.heroSubtitle, 300, DEFAULT_SETTINGS.heroSubtitle),
  };
}

export const SETTINGS_TAG = "site-settings";

/** Cached for 5 minutes; saving from /admin/settings refreshes it right away. */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const { data, error } = await createPublicClient().from("site_settings").select("data").eq("id", 1).maybeSingle();
      if (error || !data) return DEFAULT_SETTINGS;
      return normalizeSettings(data.data);
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  ["site-settings-v1"],
  { revalidate: 300, tags: [SETTINGS_TAG] },
);
