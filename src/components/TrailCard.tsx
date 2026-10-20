import Link from "next/link";
import { adImageUrl } from "@/lib/ads";
import { TRAIL_DIFFICULTY, TRAIL_TYPE } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

export function TrailCard({ t }: { t: Tables<"trails"> }) {
  const img = adImageUrl(t.image_path);
  return (
    <Link href={`/trails/${t.slug}`} className="block overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10 hover:ring-accent">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={t.name_ar} loading="lazy" className="h-40 w-full object-cover" />
      ) : <div className="flex h-40 items-center justify-center bg-white/5 text-4xl">🥾</div>}
      <div className="space-y-1 p-4">
        <h3 className="font-bold">{t.name_ar}</h3>
        <p className="text-sm text-muted">{t.region}</p>
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          <span className="rounded-full bg-white/10 px-2 py-0.5">{TRAIL_TYPE[t.trail_type as keyof typeof TRAIL_TYPE]}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5">{TRAIL_DIFFICULTY[t.difficulty as keyof typeof TRAIL_DIFFICULTY]}</span>
          {t.distance_km != null && <span className="rounded-full bg-white/10 px-2 py-0.5">{t.distance_km} كم</span>}
        </div>
      </div>
    </Link>
  );
}
