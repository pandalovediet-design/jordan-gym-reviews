"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Counts one impression for each ad shown on this page view (the database only accepts live ads). */
export function AdImpressions({ ids }: { ids: string[] }) {
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    // One impression per ad per visit, so reloading a page does not inflate the numbers.
    let fresh = key.split(",");
    try {
      const seen = new Set((sessionStorage.getItem("ad-seen") ?? "").split(",").filter(Boolean));
      fresh = fresh.filter((id) => !seen.has(id));
      fresh.forEach((id) => seen.add(id));
      sessionStorage.setItem("ad-seen", [...seen].slice(-200).join(","));
    } catch { /* storage blocked: count normally */ }
    if (fresh.length === 0) return;
    createClient().rpc("count_ad_impressions", { p_ids: fresh }).then(() => {}, () => {});
  }, [key]);
  return null;
}
