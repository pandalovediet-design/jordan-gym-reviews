import { createPublicClient } from "@/lib/supabase/public";

/** Per-member web app manifest, so "install" opens this member's own page. */
export async function GET(_: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response("Not found", { status: 404 });
  const { data } = await createPublicClient().rpc("get_member_by_token", { p_token: token });
  const m = data?.[0];
  if (!m) return new Response("Not found", { status: 404 });
  const body = {
    name: m.org_name, short_name: m.org_name.slice(0, 12), lang: "ar", dir: "rtl",
    start_url: `/me/${token}`, scope: `/me/${token}`, display: "standalone",
    background_color: "#07211c", theme_color: "#07211c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "no-store" } });
}
