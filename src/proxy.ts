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

export async function proxy(request: NextRequest) {
  const sub = subdomainSlug(request);
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
