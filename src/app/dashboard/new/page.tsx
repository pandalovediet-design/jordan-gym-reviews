import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { createOrg } from "../actions";
import { ORG_TYPE_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "إضافة نشاط", robots: { index: false } };

export default async function NewOrg() {
  await requireUser();
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">إضافة نشاط</h1>
      <ActionForm action={createOrg} submit="إنشاء">
        <input name="name_ar" required placeholder="اسم النشاط" className={field} />
        <select name="type" className={field}>{Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input name="city" required defaultValue="عمّان" placeholder="المدينة" className={field} />
      </ActionForm>
    </div>
  );
}
