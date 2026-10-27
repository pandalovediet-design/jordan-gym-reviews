import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  organization_id: z.string().uuid(),
  event_type: z.enum(["page_view", "whatsapp_click", "phone_click", "qr_visit"]),
});

// Best-effort, in-memory throttle per instance: 1 identical event / 30s per IP+org.
const seen = new Map<string, number>();

export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return new NextResponse(null, { status: 204 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${p.data.organization_id}:${p.data.event_type}`;
  const now = Date.now();
  if ((seen.get(key) ?? 0) > now - 30_000) return new NextResponse(null, { status: 204 });
  seen.set(key, now);
  if (seen.size > 5000) seen.clear();
  const { data: org } = await admin.from("organizations").select("id").eq("id", p.data.organization_id).eq("status", "published").maybeSingle();
  if (org) await admin.from("analytics_events").insert(p.data);
  return new NextResponse(null, { status: 204 });
}
