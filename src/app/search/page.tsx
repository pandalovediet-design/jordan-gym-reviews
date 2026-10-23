import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { NearMeButton } from "@/components/NearMe";
import { CityAreaPicker } from "@/components/CityAreaPicker";
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
  const area = one(sp.area) ?? "";
  const category = one(sp.category) ?? "";
  const women = one(sp.women) === "only" || one(sp.women) === "any" ? one(sp.women)! : "";
  const maxPriceRaw = Number.parseFloat(one(sp.max) ?? "");
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : 0;
  const trial = one(sp.trial) === "1";
  const mosque = one(sp.mosque) === "1";
  const quiet = one(sp.quiet) === "1";
  const kidsArea = one(sp.kidsarea) === "1", kids = one(sp.kids) === "1", transport = one(sp.transport) === "1", access = one(sp.access) === "1";
  const lat = Number.parseFloat(one(sp.lat) ?? ""), lng = Number.parseFloat(one(sp.lng) ?? "");
  const near = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
  const mode = one(sp.in) === "products" ? "products" : "orgs";
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);

  let error = false;
  const categories = await listCategories().catch(() => []);
  const orgs = mode === "orgs" ? await searchOrgs({ q, type, city, area, category, women, maxPrice, trial, mosque, quiet, kidsArea, kids, transport, access, near, page }).catch(() => (error = true, null)) : null;
  const prods = mode === "products" ? await searchProducts({ q, page }).catch(() => (error = true, null)) : null;
  const total = (orgs ?? prods)?.total ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q); if (type) u.set("type", type); if (city) u.set("city", city); if (area) u.set("area", area);
    if (category) u.set("category", category); if (women) u.set("women", women);
    if (maxPrice) u.set("max", String(maxPrice)); if (trial) u.set("trial", "1"); if (mosque) u.set("mosque", "1"); if (quiet) u.set("quiet", "1");
    if (kidsArea) u.set("kidsarea", "1"); if (kids) u.set("kids", "1"); if (transport) u.set("transport", "1"); if (access) u.set("access", "1");
    if (near) { u.set("lat", String(near.lat)); u.set("lng", String(near.lng)); }
    if (mode === "products") u.set("in", "products"); u.set("page", String(p));
    return `/search?${u}`;
  };
  const field = "rounded-xl bg-surface px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <form className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
        <CityAreaPicker defaultCity={city} defaultArea={area} allowAll labels={false} />
        <input name="max" type="number" min="1" step="1" defaultValue={maxPrice || ""} placeholder="أقصى سعر شهري (د.أ)" className={field} />
        <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="trial" value="1" defaultChecked={trial} /> 🎟 يوم تجريبي مجاني</label>
        <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="mosque" value="1" defaultChecked={mosque} /> 🕌 فيه مصلى</label>
        <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="quiet" value="1" defaultChecked={quiet} /> 🔇 بدون موسيقى</label>
        <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="kidsarea" value="1" defaultChecked={kidsArea} /> 🧒 Kids Area</label>
        <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="kids" value="1" defaultChecked={kids} /> 👶 مهيّأ للأطفال (5–12)</label>
        <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="transport" value="1" defaultChecked={transport} /> 🚌 مواصلات للأطفال</label>
        <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="access" value="1" defaultChecked={access} /> ♿ مهيّأ لذوي الاحتياجات</label>
        <button className="rounded-xl bg-accent px-6 font-bold text-accent-foreground">بحث</button>
      </form>

      {mode === "orgs" && <div className="mb-4 flex flex-wrap items-center gap-3"><NearMeButton active={!!near} />{near && <span className="text-sm text-muted">مرتبة من الأقرب للأبعد (الأنشطة اللي حدّدت موقعها فقط)</span>}</div>}

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
