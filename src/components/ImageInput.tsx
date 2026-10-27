"use client";
import { useRef, useState, type InputHTMLAttributes } from "react";

const MAX_SIDE = 1600;

/** Shrinks big phone photos in the browser before upload (max 1600px, WebP/JPEG), so uploads are fast and never hit the size limit. */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size <= 700 * 1024) { bmp.close(); return file; }
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bmp.close(); return file; }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  let blob = await toBlob("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") {
    // Safari can't encode WebP: fall back to JPEG on a white background (drops transparency).
    ctx.globalCompositeOperation = "destination-over"; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    blob = await toBlob("image/jpeg", 0.85);
  }
  if (!blob || blob.size >= file.size) return file;
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
}

export function ImageInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange">) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function onChange() {
    const input = ref.current;
    const file = input?.files?.[0];
    if (!input || !file) return;
    setBusy(true);
    try {
      const out = await shrink(file);
      if (out !== file) {
        const dt = new DataTransfer();
        dt.items.add(out);
        input.files = dt.files;
      }
    } catch {
      /* keep the original file; the server will validate it */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <input {...props} ref={ref} type="file" aria-busy={busy} accept={props.accept ?? "image/jpeg,image/png,image/webp"} onChange={onChange} />
      <span className="block text-xs text-muted" role="status" aria-live="polite" aria-atomic="true">
        {busy ? "جاري تجهيز الصورة لتسريع الرفع..." : "تُجهّز الصور الكبيرة تلقائيًا قبل الرفع."}
      </span>
    </>
  );
}
