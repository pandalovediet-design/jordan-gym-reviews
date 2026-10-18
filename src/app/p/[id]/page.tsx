import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/queries";
import { AVAILABILITY_LABEL, dateAr, jod } from "@/lib/format";

export const revalidate = 120;
const UUID = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = UUID.test(id) ? await getProduct(id).catch(() => null) : null;
  return p ? { title: p.name_ar, description: p.description_ar?.slice(0, 160) } : { title: "غير موجود" };
}

export default async function ProductPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const p = UUID.test(id) ? await getProduct(id) : null;
  if (!p) notFound();
  const row = (k: string, v: string | null) => v && <div className="flex justify-between border-b border-white/10 py-2 text-sm"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-muted">{p.product_categories?.name_ar}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{p.name_ar}</h1>
      <p className="mt-3 text-2xl text-accent">{jod(p.price_jod)}</p>
      <p className="text-sm text-muted">{AVAILABILITY_LABEL[p.availability]} · آخر تحديث للسعر {dateAr(p.price_updated_at)} · للتوفر {dateAr(p.availability_updated_at)}</p>
      {p.description_ar && <p className="mt-5 whitespace-pre-line leading-8">{p.description_ar}</p>}
      <dl className="mt-5 rounded-2xl bg-surface px-5 py-2 ring-1 ring-white/10">
        {row("الماركة", p.brand)}{row("الشركة المصنعة", p.manufacturer)}{row("الحجم", p.net_size ?? p.size_info)}{row("المكونات", p.ingredients)}
      </dl>
      {p.organizations && <p className="mt-6">متوفر لدى <Link className="text-accent underline" href={`/g/${p.organizations.slug}`}>{p.organizations.name_ar}</Link> — {p.organizations.city}</p>}
    </div>
  );
}
