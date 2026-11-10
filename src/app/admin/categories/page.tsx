import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { addCategory, deleteCategory, setCategoryActive, updateCategory } from "../actions";

export const metadata: Metadata = { title: "التصنيفات", robots: { index: false } };

export default async function CategoriesAdmin() {
  const { supabase } = await requireUser();
  const [cats, orgs] = await Promise.all([
    supabase.from("org_categories").select("*").order("sort_order"),
    supabase.from("organizations").select("category_id").not("category_id", "is", null).limit(5000),
  ]);
  const count = (id: string) => (orgs.data ?? []).filter((o) => o.category_id === id).length;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold">التصنيفات ({(cats.data ?? []).length})</h1>
        <p className="mt-1 text-sm text-muted">كل تصنيف بيصير قسم بالصفحة الرئيسية، وصاحب النشاط بيختاره وقت التسجيل. الترتيب بالرقم: الأصغر أول.</p>
      </div>
      <section className={box}><h2 className="mb-3 text-lg font-bold">إضافة تصنيف</h2>
        <ActionForm action={addCategory} submit="إضافة">
          <div className="grid gap-3 sm:grid-cols-4">
            <select name="org_type" className={field}>{Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input name="name_ar" required placeholder="الاسم بالعربي" className={field} />
            <input name="slug" required dir="ltr" placeholder="رمز إنجليزي: swimming" className={field} />
            <input name="sort_order" type="number" min="0" defaultValue={200} dir="ltr" className={field} />
          </div>
        </ActionForm>
      </section>
      <ul className="space-y-2">{(cats.data ?? []).map((c) => (
        <li key={c.id} className={`${box} flex flex-wrap items-center justify-between gap-3 ${c.is_active ? "" : "opacity-60"}`}>
          <form action={updateCategory.bind(null, c.id)} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{ORG_TYPE_LABEL[c.org_type]}</span>
            <input name="name_ar" defaultValue={c.name_ar} className="w-48 rounded-lg bg-background px-2 py-1 ring-1 ring-white/10" />
            <input name="sort_order" type="number" defaultValue={c.sort_order} dir="ltr" className="w-20 rounded-lg bg-background px-2 py-1 ring-1 ring-white/10" />
            <button className={btn}>حفظ</button>
            <span className="text-xs text-muted" dir="ltr">{c.slug} · {count(c.id)} نشاط</span>
          </form>
          <div className="flex gap-2">
            <form action={setCategoryActive.bind(null, c.id, !c.is_active)}><button className={btn}>{c.is_active ? "إخفاء" : "إظهار"}</button></form>
            <form action={deleteCategory.bind(null, c.id)}><button className={`${btn} text-red-300`}>حذف</button></form>
          </div>
        </li>))}</ul>
    </div>
  );
}
