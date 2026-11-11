/** Color themes an activity can pick for its public page and dashboard (null = platform default green). */
export const THEMES = [
  { key: "emerald", label: "ألوان المنصة", swatch: ["#f3f4f0", "#121613", "#c8f53a"] },
  { key: "night", label: "ليلي بنفسجي", swatch: ["#0a0d24", "#151a3f", "#7c6cff"] },
  { key: "gold", label: "ذهبي فخم", swatch: ["#15110a", "#241c10", "#f5c542"] },
  { key: "ocean", label: "أزرق محيطي", swatch: ["#04182a", "#0a2840", "#38bdf8"] },
  { key: "rose", label: "وردي", swatch: ["#1f0a19", "#311128", "#f472b6"] },
  { key: "ember", label: "برتقالي ناري", swatch: ["#1a0d06", "#2a160b", "#fb923c"] },
] as const;
export type ThemeKey = (typeof THEMES)[number]["key"];
export const THEME_KEYS = THEMES.map((t) => t.key) as unknown as [ThemeKey, ...ThemeKey[]];
export const asTheme = (v: string | null | undefined): ThemeKey | null => (THEMES.some((t) => t.key === v) ? (v as ThemeKey) : null);
/** Wrapper classes that re-skin everything inside (colors are CSS variables, see globals.css). */
export const themeClass = (v: string | null | undefined) => { const t = asTheme(v); return t && t !== "emerald" ? `theme-${t} themed` : ""; };
