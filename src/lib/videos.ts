import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { publicMediaUrl, waNumber } from "@/lib/format";
import type { VideoItem } from "@/components/VideoCard";

const SEL = "id,kind,url,platform,title_ar,cover_path,organizations!inner(id,slug,name_ar,city,type,whatsapp,phone)";

export async function listVideos(opts: { kind?: "review" | "reel"; orgId?: string; type?: string; city?: string; limit?: number }): Promise<VideoItem[]> {
  let q = createPublicClient().from("videos").select(SEL).eq("status", "approved").order("created_at", { ascending: false }).limit(opts.limit ?? 48);
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.orgId) q = q.eq("organization_id", opts.orgId);
  if (opts.type) q = q.eq("organizations.type", opts.type as never);
  if (opts.city) q = q.eq("organizations.city", opts.city);
  const { data } = await q;
  return (data ?? []).map((r) => {
    const o = r.organizations;
    return {
      id: r.id, kind: r.kind, url: r.url, platform: r.platform, title_ar: r.title_ar,
      cover_url: r.cover_path ? publicMediaUrl(r.cover_path) : null,
      org: o ? { id: o.id, slug: o.slug, name_ar: o.name_ar, city: o.city, wa: waNumber(o.whatsapp ?? o.phone) } : null,
    };
  });
}
