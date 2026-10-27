"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function NowLocate({ type, label = "📍 حدّد موقعي" }: { type?: string; label?: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(false);

  const go = () => {
    if (requestRef.current) return;
    if (!navigator.geolocation) {
      setMsg("المتصفح ما بدعم تحديد الموقع. جرّب متصفحاً أحدث.");
      return;
    }
    requestRef.current = true;
    setLoading(true);
    setMsg("جاري تحديد موقعك… اسمح بالوصول للموقع إذا طلب المتصفح ذلك.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        requestRef.current = false;
        const u = new URLSearchParams({ lat: p.coords.latitude.toFixed(4), lng: p.coords.longitude.toFixed(4) });
        if (type) u.set("type", type);
        router.push(`/now?${u}`);
      },
      (error) => {
        requestRef.current = false;
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setMsg("صلاحية الموقع مرفوضة. فعّل إذن الموقع من إعدادات المتصفح ثم جرّب مجدداً.");
        } else if (error.code === error.TIMEOUT) {
          setMsg("تأخر تحديد الموقع. تأكد من تشغيل GPS وحاول مرة ثانية.");
        } else {
          setMsg("تعذّر تحديد موقعك حالياً. تأكد من تشغيل خدمة الموقع وحاول مجدداً.");
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        aria-busy={loading}
        className="rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "⏳ جاري تحديد الموقع…" : label}
      </button>
      {msg && <span className="text-sm text-muted" role="status" aria-live="polite">{msg}</span>}
    </div>
  );
}
