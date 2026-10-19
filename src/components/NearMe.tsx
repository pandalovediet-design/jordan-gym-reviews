"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function NearMeButton({ active }: { active: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("");
  const go = () => {
    if (active) {
      const u = new URLSearchParams(sp.toString());
      u.delete("lat"); u.delete("lng"); u.delete("page");
      router.push(`/search?${u}`);
      return;
    }
    if (!navigator.geolocation) return setMsg("المتصفح ما بدعم تحديد الموقع.");
    setMsg("جاري تحديد موقعك...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const u = new URLSearchParams(sp.toString());
        u.set("lat", pos.coords.latitude.toFixed(4)); u.set("lng", pos.coords.longitude.toFixed(4)); u.delete("page");
        router.push(`/search?${u}`);
      },
      () => setMsg("ما قدرنا نحدد موقعك. فعّل صلاحية الموقع للمتصفح وجرّب."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };
  return (
    <>
      <button type="button" onClick={go} className={`rounded-xl px-4 py-2 text-sm font-bold ${active ? "bg-accent text-accent-foreground" : "bg-surface ring-1 ring-white/10"}`}>
        📍 {active ? "إلغاء «قريب مني»" : "قريب مني"}
      </button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </>
  );
}
