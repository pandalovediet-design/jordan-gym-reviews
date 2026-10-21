"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NowLocate({ type, label = "📍 حدّد موقعي" }: { type?: string; label?: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const go = () => {
    if (!navigator.geolocation) return setMsg("المتصفح ما بدعم تحديد الموقع.");
    setMsg("جاري تحديد موقعك...");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const u = new URLSearchParams({ lat: p.coords.latitude.toFixed(4), lng: p.coords.longitude.toFixed(4) });
        if (type) u.set("type", type);
        router.push(`/now?${u}`);
      },
      () => setMsg("ما قدرنا نحدد موقعك. فعّل صلاحية الموقع للمتصفح وجرّب."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={go} className="rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground">{label}</button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </div>
  );
}
