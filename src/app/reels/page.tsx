import type { Metadata } from "next";
import Link from "next/link";
import { VideoCard } from "@/components/VideoCard";
import { listVideos } from "@/lib/videos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ريلز رياضية — مراجعات ومدربين بالأردن",
  description: "فيديوهات قصيرة لأندية ومدربين وملاعب بالأردن، ومراجعات Jordan Gym Reviews.",
  alternates: { canonical: "/reels" },
};
const TYPES: [string, string][] = [["", "الكل"], ["gym", "نوادي"], ["independent_coach", "مدربين"], ["sports_facility", "ملاعب"], ["nutritionist", "تغذية"], ["store", "متاجر"]];

export default async function Reels({ searchParams }: PageProps<"/reels">) {
  const sp = await searchParams;
  const t = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const type = TYPES.some(([k]) => k && k === t) ? t! : "";
  const [reviews, reels] = await Promise.all([
    type ? Promise.resolve([]) : listVideos({ kind: "review", limit: 12 }),
    listVideos({ kind: "reel", type, limit: 48 }),
  ]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">🎬 ريلز رياضية</h1>
      <p className="mt-2 text-muted">فيديوهات قصيرة من أندية ومدربين وملاعب بالأردن. اضغط تشغيل وتواصل مع صاحب الفيديو مباشرة.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map(([k, l]) => (
          <Link key={k} href={k ? `/reels?type=${k}` : "/reels"} className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 ${type === k ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>{l}</Link>
        ))}
      </div>
      {reviews.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold">⭐ مراجعات عبد الكريم</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{reviews.map((v) => <VideoCard key={v.id} v={v} />)}</div>
        </section>
      )}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">ريلز المدربين والأنشطة</h2>
        {reels.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{reels.map((v) => <VideoCard key={v.id} v={v} />)}</div>
        ) : (
          <p className="rounded-2xl bg-surface p-6 text-center text-muted ring-1 ring-white/10">ما في فيديوهات بهالقسم حالياً. مدرب أو صاحب نشاط؟ ضيف فيديوك من لوحة التحكم.</p>
        )}
      </section>
    </div>
  );
}
