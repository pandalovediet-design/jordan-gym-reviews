import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryView } from "@/components/DirectoryView";
import { isOrgType, listCities, searchOrgs } from "@/lib/queries";
import { ORG_TYPE_PLURAL } from "@/lib/format";

export const revalidate = 600;

export async function generateMetadata({ params }: PageProps<"/directory/[type]/[city]">): Promise<Metadata> {
  const { type, city } = await params;
  if (!isOrgType(type)) return { title: "غير موجود" };
  const c = decodeURIComponent(city);
  return {
    title: `${ORG_TYPE_PLURAL[type]} في ${c}`,
    description: `أفضل ${ORG_TYPE_PLURAL[type]} في ${c}: الأسعار، الدوام، الموقع، والتواصل المباشر.`,
    alternates: { canonical: `/directory/${type}/${encodeURIComponent(c)}` },
  };
}

export default async function Page({ params }: PageProps<"/directory/[type]/[city]">) {
  const { type, city } = await params;
  if (!isOrgType(type)) notFound();
  const c = decodeURIComponent(city);
  const [{ items, total }, cities] = await Promise.all([searchOrgs({ type, city: c, page: 1 }), listCities(type)]);
  if (total === 0) notFound(); // never index empty landing pages
  return <DirectoryView type={type} city={c} items={items} total={total} cities={cities} />;
}
