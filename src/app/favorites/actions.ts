"use server";
import { listBySlugs } from "@/lib/queries";

export async function loadFavorites(slugs: string[]) {
  if (!Array.isArray(slugs)) return [];
  return listBySlugs(slugs.filter((s): s is string => typeof s === "string"));
}
