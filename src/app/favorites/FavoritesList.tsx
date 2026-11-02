"use client";
import { useEffect, useState } from "react";
import { OrgCard } from "@/components/OrgCard";
import { useFavs } from "@/components/Favorites";
import { getAccountFavoriteSlugs, loadFavorites } from "./actions";
import { replaceFavs } from "@/components/Favorites";

type Items = Awaited<ReturnType<typeof loadFavorites>>;

export function FavoritesList() {
  const favs = useFavs();
  const [items, setItems] = useState<Items | null>(null);
  const key = favs.join(",");
  useEffect(() => {
    let alive = true;
    loadFavorites(key ? key.split(",") : []).then((r) => alive && setItems(r)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [key]);
  if (items === null) return <p className="text-muted">جاري التحميل...</p>;
  if (favs.length === 0 || items.length === 0)
    return <p className="rounded-2xl bg-surface p-8 text-center text-muted">ما أضفت أي نشاط للمفضلة بعد. اضغط على القلب 🤍 على أي بطاقة.</p>;
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.filter((o) => favs.includes(o.slug)).map((o) => <OrgCard key={o.id} org={o} />)}</div>;
}
