"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { useFavs, replaceFavs } from "@/components/Favorites";
import { claimLocalData } from "@/lib/member-sync";
import { getAccountFavorites, loadFavorites, mergeAccountFavorites } from "./actions";

type Items = Awaited<ReturnType<typeof loadFavorites>>;

function readLocal(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("jgr:favs") ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function FavoritesList() {
  const favs = useFavs();
  const [items, setItems] = useState<Items | null>(null);
  const [failed, setFailed] = useState(false);
  const [synced, setSynced] = useState(false);
  const key = favs.join(",");

  // Account sync runs once per visit, not on every toggle, so a removal cannot bounce back.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const remote = await getAccountFavorites();
        if (!alive || remote === null) return;
        if (claimLocalData("favorites", remote.userId) === "merge") {
          const local = readLocal();
          const merged = [...new Set([...remote.slugs, ...local])];
          if (merged.length > remote.slugs.length) await mergeAccountFavorites(local);
          if (alive) replaceFavs(merged);
        } else {
          replaceFavs(remote.slugs);
        }
        if (alive) setSynced(true);
      } catch { /* Keep local favorites available. */ }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    loadFavorites(key ? key.split(",") : [])
      .then((result) => { if (alive) { setItems(result); setFailed(false); } })
      .catch(() => { if (alive) { setItems([]); setFailed(true); } });
    return () => { alive = false; };
  }, [key]);

  if (items === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="جاري تحميل المفضلة">
        {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none" />)}
      </div>
    );
  }
  if (failed) {
    return <p role="alert" className="rounded-2xl bg-surface p-8 text-center text-muted">تعذر تحميل المفضلة الآن. جرّب تحدّث الصفحة.</p>;
  }
  const shown = items.filter((o) => favs.includes(o.slug));
  if (shown.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center">
        <p className="text-muted">ما أضفت أي نشاط للمفضلة بعد. اضغط على القلب على أي كرت وبتلاقيه هون.</p>
        <Link href="/directory" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-accent px-6 font-semibold text-accent-foreground">تصفّح الأماكن</Link>
      </div>
    );
  }
  return (
    <>
      {synced && <p className="mb-3 text-xs text-muted">مفضلتك محفوظة بحسابك وبتظهر على كل أجهزتك.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((o) => <OrgCard key={o.id} org={o} />)}</div>
    </>
  );
}
