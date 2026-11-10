import { baseUrl } from "@/lib/base-url";
import type { MetadataRoute } from "next";

const PRIVATE = ["/dashboard", "/manager", "/notifications", "/admin", "/api", "/login", "/forgot", "/auth/", "/a/", "/go/", "/q/", "/m/", "/claim/"];
// Answer engines and AI assistants are welcome: the whole point is to be quoted accurately.
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Bingbot"];

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
