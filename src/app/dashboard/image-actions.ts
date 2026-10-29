"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { FormState } from "./actions";

const MAX_IMG = 4 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function setProfileImage(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "اختر صورة شخصية للنادي" };
  const ext = EXT[file.type];
  if (!ext) return { error: "الصيغ المسموحة: JPG أو PNG أو WebP" };
  if (file.size > MAX_IMG) return { error: "حجم الصورة أكبر من 4MB" };
  const { supabase } = await requireUser();
  const path = `${id}/profile-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("org-media").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "تعذّر رفع الصورة الشخصية" };
  const { data: old } = await supabase.from("organization_media").select("id,storage_path").eq("organization_id", id).lt("sort_order", 0);
  const { error } = await supabase.from("organization_media").insert({ organization_id: id, storage_path: path, alt_text: "الصورة الشخصية للنادي", is_cover: false, sort_order: -1 });
  if (error) {
    await supabase.storage.from("org-media").remove([path]);
    return { error: "تعذّر حفظ الصورة الشخصية" };
  }
  if (old?.length) {
    await supabase.from("organization_media").delete().in("id", old.map((x) => x.id));
    await supabase.storage.from("org-media").remove(old.map((x) => x.storage_path));
  }
  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/");
  return { ok: "تم تحديث الصورة الشخصية" };
}

export async function setCoverImage(id: string, mediaId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: image } = await supabase.from("organization_media").select("id").eq("id", mediaId).eq("organization_id", id).gte("sort_order", 0).maybeSingle();
  if (!image) return;
  await supabase.from("organization_media").update({ is_cover: false }).eq("organization_id", id).gte("sort_order", 0);
  await supabase.from("organization_media").update({ is_cover: true }).eq("id", mediaId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/");
}
