import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on each matched request.
const RESERVED = new Set(["www", "admin", "api", "app", "mail", "dashboard", "login", "static", "cdn", "m", "q"]);

/** Per-business subdomain (<slug>.<root domain>). Off until NEXT_PUBLIC_ROOT_DOMAIN is set. */
function subdomainSlug(request: NextRequest): string | null {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
  if (!root) return null;
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host.endsWith(`.${root}`)) return null;
  const sub = host.slice(0, -root.length - 1);
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(sub) && !RESERVED.has(sub) ? sub : null;
}

// Verified custom domains (org_domains) -> that business's page. Cached for a minute per instance.
const domainCache = new Map<string, { slug: string | null; at: number }>();
async function customDomainSlug(request: NextRequest): Promise<string | null> {
  if (!process.env.VERCEL_API_TOKEN) return null; // feature off until the platform owner enables it
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
  if (!host || host.endsWith(".vercel.app") || host === "localhost" || (root && (host === root || host === `www.${root}` || host.endsWith(`.${root}`)))) return null;
  const hit = domainCache.get(host);
  if (hit && Date.now() - hit.at < 60_000) return hit.slug;
  let slug: string | null = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/org_domains?domain=eq.${encodeURIComponent(host)}&status=eq.verified&select=organizations(slug)`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! }, cache: "no-store" },
    );
    const rows = (await res.json()) as { organizations?: { slug?: string } | null }[];
    slug = Array.isArray(rows) ? rows[0]?.organizations?.slug ?? null : null;
  } catch {}
  domainCache.set(host, { slug, at: Date.now() });
  return slug;
}

export async function proxy(request: NextRequest) {
  const sub = subdomainSlug(request) ?? (request.nextUrl.pathname === "/" ? await customDomainSlug(request) : null);
  if (sub && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/g/${sub}`;
    return NextResponse.rewrite(url);
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|offline.html|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
  ],
};
