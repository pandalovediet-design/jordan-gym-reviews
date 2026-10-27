import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { createOrg } from "../actions";
import { CityAreaPicker } from "@/components/CityAreaPicker";
import { CategoryPicker } from "@/components/CategoryPicker";
import { listCategories } from "@/lib/queries";
import { ORG_TYPE_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "إضافة نشاط", robots: { index: false } };

export default async function NewOrg() {
  await requireUser();
  const categories = await listCategories();
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-3 text-2xl font-extrabold">إضافة نشاط</h1>
      <p className="mb-6 rounded-xl bg-accent/10 p-3 text-sm text-accent ring-1 ring-accent/30">ممكن يكون ناديك موجود عندنا أصلاً. <Link href="/claim" className="font-bold underline">دوّر عليه هون</Link> واستلمه بدل ما تسجّله من جديد.</p>
      <ActionForm action={createOrg} submit="إنشاء">
        <input name="name_ar" required placeholder="اسم النشاط" className={field} />
        <CategoryPicker types={ORG_TYPE_LABEL} categories={categories} />
        <CityAreaPicker defaultCity="عمّان" labels={false} />
      </ActionForm>
    </div>
  );
}
