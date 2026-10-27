"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function NearMeButton({ active }: { active: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const go = () => {
    if (loading) return;
    if (active) {
      const u = new URLSearchParams(sp.toString());
      u.delete("lat"); u.delete("lng"); u.delete("page");
      router.push(`/search?${u}`);
      return;
    }
    if (!navigator.geolocation) return setMsg("المتصفح ما بدعم تحديد الموقع.");
    setLoading(true);
    setMsg("جاري تحديد موقعك...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const u = new URLSearchParams(sp.toString());
        u.set("lat", pos.coords.latitude.toFixed(4));
        u.set("lng", pos.coords.longitude.toFixed(4));
        u.delete("page");
        router.push(`/search?${u}`);
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) setMsg("صلاحية الموقع مرفوضة. اسمح للمتصفح بالوصول للموقع ثم جرّب مجددًا.");
        else if (error.code === error.TIMEOUT) setMsg("تأخر تحديد الموقع. تأكد من تشغيل الموقع وحاول مرة ثانية.");
        else setMsg("تعذر تحديد موقعك حاليًا. حاول مرة ثانية.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={go} disabled={loading} aria-busy={loading} className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60 ${active ? "bg-accent text-accent-foreground" : "bg-surface ring-1 ring-white/10 hover:ring-accent/60"}`}>
        {loading ? "⏳ جاري تحديد الموقع..." : active ? "📍 إلغاء «قريب مني»" : "📍 قريب مني"}
      </button>
      {msg && <span role="status" aria-live="polite" className="text-sm text-muted">{msg}</span>}
    </div>
  );
}
