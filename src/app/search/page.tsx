import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { OrgCard } from "@/components/OrgCard";
import { PAGE_SIZE, listCategories, searchOrgs, searchProducts } from "@/lib/queries";
import { ORG_TYPE_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "البحث" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = one(sp.q) ?? "";
  const type = one(sp.type) ?? "";
  const city = one(sp.city) ?? "";
  const category = one(sp.category) ?? "";
  const women = one(sp.women) === "only" || one(sp.women) === "any" ? one(sp.women)! : "";
  const mode = one(sp.in) === "products" ? "products" : "orgs";
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);

  let error = false;
  const categories = await listCategories().catch(() => []);
  const orgs = mode === "orgs" ? await searchOrgs({ q, type, city, category, women, page }).catch(() => (error = true, null)) : null;
  const prods = mode === "products" ? await searchProducts({ q, page }).catch(() => (error = true, null)) : null;
  const total = (orgs ?? prods)?.total ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q); if (type) u.set("type", type); if (city) u.set("city", city);
    if (category) u.set("category", category); if (women) u.set("women", women);
    if (mode === "products") u.set("in", "products"); u.set("page", String(p));
    return `/search?${u}`;
  };
  const field = "rounded-xl bg-surface px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <form className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-[1fr_auto_auto_auto_auto_auto_auto]">
        <input name="q" defaultValue={q} placeholder="ابحث..." className={field} />
        <select name="in" defaultValue={mode} className={field}>
          <option value="orgs">أنشطة</option><option value="products">منتجات</option>
        </select>
        <select name="type" defaultValue={type} className={field}>
          <option value="">كل الأنواع</option>
          {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="category" defaultValue={category} className={field}>
          <option value="">كل التصنيفات</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name_ar}</option>)}
        </select>
        <select name="women" defaultValue={women} className={field}>
          <option value="">للجميع</option>
          <option value="only">💗 Pink Zone فقط</option>
          <option value="any">يشمل أوقات نسائية</option>
        </select>
        <input name="city" defaultValue={city} placeholder="المدينة" className={field} />
        <button className="rounded-xl bg-accent px-6 font-bold text-accent-foreground">بحث</button>
      </form>

      {error && <p className="rounded-2xl bg-surface p-6 text-center">تعذّر تحميل النتائج حالياً، جرّب مرة ثانية بعد قليل.</p>}
      {!error && total === 0 && <p className="rounded-2xl bg-surface p-8 text-center text-muted">ما لقينا نتائج مطابقة.</p>}
      {!error && <p className="mb-3 text-sm text-muted">{total} نتيجة</p>}

      {orgs && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{orgs.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>}
      {prods && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {prods.items.map((p) => <ProductCard key={p.id} p={p} store={p.organizations?.name_ar} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={href(page - 1)} className="rounded-lg bg-surface px-4 py-2">السابق</Link>}
          <span className="text-muted">{page} / {pages}</span>
          {page < pages && <Link href={href(page + 1)} className="rounded-lg bg-surface px-4 py-2">التالي</Link>}
        </nav>
      )}
    </div>
  );
}
