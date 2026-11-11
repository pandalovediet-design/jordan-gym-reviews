import type { Metadata } from "next";
import { FavoritesList } from "./FavoritesList";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "المفضلة", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHead title="المفضلة" note="محفوظة على جهازك، بدون حساب." />
      <FavoritesList />
    </div>
  );
}
