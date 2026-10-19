import type { Metadata } from "next";
import { FavoritesList } from "./FavoritesList";

export const metadata: Metadata = { title: "المفضلة", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">المفضلة</h1>
      <p className="mb-6 text-sm text-muted">محفوظة على جهازك فقط، بدون حساب.</p>
      <FavoritesList />
    </div>
  );
}
