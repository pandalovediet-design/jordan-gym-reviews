import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "أدلة رياضية: أرخص النوادي، أماكن بتسهر، وأكثر",
  description: "أدلة جاهزة لاختيار المكان المناسب: نوادي اقتصادية، نوادي مفتوحة لوقت متأخر، وغيرها.",
  alternates: { canonical: "/guides" },
};

const GUIDES = [
  ["/guides/budget", "💸 نوادي اقتصادية", "نوادي اشتراكها الشهري بسعر مناسب للطلاب وللميزانية المحدودة."],
  ["/guides/late", "🌙 رياضة بعد الإفطار وبالليل", "نوادي بتسهر لوقت متأخر، مفيدة برمضان ولأصحاب الدوام الطويل."],
  ["/now", "⏱️ وين أتمرن هسا؟", "المفتوح الآن الأقرب إلك، والملاعب اللي فيها مواعيد اليوم."],
  ["/pink", "💗 Pink Zone", "أماكن رياضية خاصة بالنساء."],
  ["/awards", "🏆 نادي ومدرب الشهر", "صوّت للأفضل."],
  ["/tools", "🧮 حاسبة السعرات", "احسب سعراتك وبروتينك حسب هدفك."],
] as const;

export default function Guides() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">أدلة رياضية</h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">{GUIDES.map(([href, t, d]) => (
        <li key={href}><Link href={href} className="block h-full rounded-2xl bg-surface p-5 ring-1 ring-white/10 hover:ring-accent"><h2 className="font-bold">{t}</h2><p className="mt-1 text-sm text-muted">{d}</p></Link></li>))}</ul>
    </div>
  );
}
