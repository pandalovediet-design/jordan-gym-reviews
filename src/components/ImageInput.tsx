"use client";
import { useRef, useState, type InputHTMLAttributes } from "react";

const MAX_SIDE = 1600;
const MAX_OPTIMIZE_SIZE = 700 * 1024;

async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size <= MAX_OPTIMIZE_SIZE) { bmp.close(); return file; }

  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bmp.close(); return file; }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  let blob = await toBlob("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") {
    // Safari may not encode WebP: use JPEG on white to handle transparent PNGs.
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    blob = await toBlob("image/jpeg", 0.85);
  }
  if (!blob || blob.size >= file.size) return file;
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`
    : `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;
}

export function ImageInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange">) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("تُجهّز الصور الكبيرة تلقائيًا قبل الرفع.");

  async function onChange() {
    const input = ref.current;
    const file = input?.files?.[0];
    if (!input || !file) {
      setStatus("لم يتم اختيار صورة.");
      return;
    }

    setBusy(true);
    setStatus("جارٍ تجهيز الصورة لتسريع الرفع...");
    try {
      const out = await shrink(file);
      // If the user selected another file while processing, never replace the newer selection.
      if (input.files?.[0] !== file) return;
      if (out !== file) {
        const dt = new DataTransfer();
        dt.items.add(out);
        input.files = dt.files;
        const saved = Math.max(0, file.size - out.size);
        const percent = Math.round((saved / file.size) * 100);
        setStatus(`تم تجهيز الصورة: ${formatSize(file.size)} ← ${formatSize(out.size)} (توفير ${percent}٪).`);
      } else {
        setStatus("الصورة جاهزة للرفع دون الحاجة إلى ضغط إضافي.");
      }
    } catch {
      // Keep the original file; server-side validation remains authoritative.
      if (input.files?.[0] === file) setStatus("تعذّر تحسين الصورة تلقائيًا؛ ستُرفع الصورة الأصلية إذا استوفت شروط الرفع.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        {...props}
        ref={ref}
        type="file"
        aria-busy={busy}
        aria-describedby={props["aria-describedby"] ? `${props["aria-describedby"]} image-input-status` : "image-input-status"}
        accept={props.accept ?? "image/jpeg,image/png,image/webp"}
        onChange={onChange}
        className={`min-h-11 max-w-full rounded-xl text-sm text-foreground file:me-3 file:min-h-11 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:font-semibold file:text-foreground file:transition hover:file:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:file:transition-none ${props.className ?? ""}`}
      />
      <span id="image-input-status" className="mt-2 block text-xs leading-relaxed text-muted" role="status" aria-live="polite" aria-atomic="true">
        {status}
      </span>
    </>
  );
}
