import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

/** Member downloads a PDF: the private token is checked first, then a 60-second signed link is issued. */
export async function GET(_: Request, ctx: { params: Promise<{ token: string; fileId: string }> }) {
  const { token, fileId } = await ctx.params;
  if (!UUID.test(token) || !UUID.test(fileId)) return new NextResponse("Not found", { status: 404 });
  const { data: path } = await createPublicClient().rpc("get_member_file_path", { p_token: token, p_file: fileId });
  if (!path) return new NextResponse("Not found", { status: 404 });
  const admin = createAdminClient();
  if (!admin) return new NextResponse("Unavailable", { status: 503 });
  const { data, error } = await admin.storage.from("member-files").createSignedUrl(path, 60, { download: true });
  if (error || !data) return new NextResponse("Unavailable", { status: 503 });
  return NextResponse.redirect(data.signedUrl, 302);
}
