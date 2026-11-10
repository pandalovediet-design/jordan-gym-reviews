"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Counts one impression for each ad shown on this page view (the database only accepts live ads). */
export function AdImpressions({ ids }: { ids: string[] }) {
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    createClient().rpc("count_ad_impressions", { p_ids: key.split(",") }).then(() => {}, () => {});
  }, [key]);
  return null;
}
