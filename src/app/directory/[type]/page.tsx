import type { Metadata } from "next";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { notFound } from "next/navigation";
import { DirectoryView } from "@/components/DirectoryView";
import { isOrgType, listCities, searchOrgs } from "@/lib/queries";
import { ORG_TYPE_PLURAL } from "@/lib/format";

export const revalidate = 600;

export async function generateMetadata({ params }: PageProps<"/directory/[type]">): Promise<Metadata> {
  const { type } = await params;
  if (!isOrgType(type)) return { title: "غير موجود" };
  return {
    title: `${ORG_TYPE_PLURAL[type]} في الأردن`,
    description: `قائمة ${ORG_TYPE_PLURAL[type]} في الأردن مع الأسعار والدوام والموقع والتواصل المباشر.`,
    alternates: { canonical: `/directory/${type}` },
  };
}

export default async function Page({ params }: PageProps<"/directory/[type]">) {
  const { type } = await params;
  if (!isOrgType(type)) notFound();
  const [{ items, total }, cities] = await Promise.all([searchOrgs({ type, page: 1 }), listCities(type)]);
  return (<><SponsoredSlot placement="category" type={type} className="mx-auto max-w-7xl px-4 pt-6 sm:px-6" /><DirectoryView type={type} items={items} total={total} cities={cities} /></>);
}
