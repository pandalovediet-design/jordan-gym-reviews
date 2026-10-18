/** Canonical public origin. Set NEXT_PUBLIC_SITE_URL to the permanent domain once bought. */
export function baseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && !/localhost/.test(configured)) return configured.replace(/\/$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  return configured || "http://localhost:3000";
}
