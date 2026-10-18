import { baseUrl } from "@/lib/base-url";
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api", "/login", "/forgot", "/auth/", "/a/", "/q/", "/m/"] }, sitemap: `${base}/sitemap.xml` };
}
