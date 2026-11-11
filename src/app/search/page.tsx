import Link from "next/link";
import type { Metadata } from "next";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { ProductCard } from "@/components/ProductCard";
import { NearMeButton } from "@/components/NearMe";
import { CityAreaPicker } from "@/components/CityAreaPicker";
import { OrgCard } from "@/components/OrgCard";
import { PAGE_SIZE, listCategories, searchOrgs, searchProducts } from "@/lib/queries";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { PageHead, btn } from "@/components/PageHead";

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
  const activeFilters = mode === "products" ? 0 : [type, city, area, category, women, maxPrice, trial, mosque, quiet, kidsArea, kids, transport, access].filter(Boolean).length + (near ? 1 : 0);
  const field = "min-h-12 w-full rounded-xl bg-surface px-3 ring-1 ring-line outline-none";
  const check = `${field} flex cursor-pointer items-center gap-2.5 text-sm has-[:checked]:ring-2 has-[:checked]:ring-foreground`;
  const title = q ? `نتائج «${q}»` : mode === "products" ? "المنتجات الرياضية" : "دوّر بالدليل";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <SponsoredSlot placement="search" className="mb-6" />
      <PageHead title={title} />
      <form className="mb-8">
        {near && mode === "orgs" && <><input type="hidden" name="lat" value={near.lat} /><input type="hidden" name="lng" value={near.lng} /></>}
        <div className="flex gap-2">
          <input name="q" aria-label="كلمات البحث" defaultValue={q} placeholder="اسم نادي، منطقة، أو رياضة" className={`${field} min-w-0 flex-1 text-base`} />
          <button className="min-h-12 shrink-0 rounded-xl bg-accent px-6 font-display text-lg font-bold text-accent-foreground">دوّر</button>
        </div>
        {/* What to search in: two radio pills instead of a dropdown. */}
        <div className="mt-3 flex gap-2 text-sm">
          {([["orgs", "الأماكن"], ["products", "المنتجات"]] as const).map(([value, label]) => (
            <label key={value} className="inline-flex min-h-10 cursor-pointer items-center rounded-full px-4 font-semibold ring-1 ring-line has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:checked]:ring-0">
              <input type="radio" name="in" value={value} defaultChecked={mode === value} className="sr-only" />{label}
            </label>
          ))}
        </div>
        {mode === "orgs" && <details open={activeFilters > 0} className="mt-4 rounded-2xl bg-surface ring-1 ring-line">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">الفلاتر{activeFilters > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground tabular-nums">{activeFilters}</span>}</span>
            {activeFilters > 0 && <Link href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"} className="text-xs font-normal text-muted underline underline-offset-4 hover:text-foreground">مسح الكل</Link>}
          </summary>
          <div className="grid gap-2 border-t border-line p-3 sm:grid-cols-3 lg:grid-cols-4 [&_select]:bg-background [&_input:not([type=checkbox])]:bg-background">
            <select name="type" aria-label="نوع النشاط" defaultValue={type} className={field}>
              <option value="">كل الأنواع</option>
              {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select name="category" aria-label="تصنيف النشاط" defaultValue={category} className={field}>
              <option value="">كل التصنيفات</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name_ar}</option>)}
            </select>
            <select name="women" aria-label="خيارات الوصول النسائي" defaultValue={women} className={field}>
              <option value="">للجميع</option>
              <option value="only">Pink Zone فقط</option>
              <option value="any">يشمل أوقات نسائية</option>
            </select>
            <CityAreaPicker defaultCity={city} defaultArea={area} allowAll labels={false} />
            <input name="max" aria-label="أقصى سعر شهري بالدينار الأردني" type="number" min="1" step="1" defaultValue={maxPrice || ""} placeholder="أقصى سعر شهري (د.أ)" className={field} />
            <label className={check}><input type="checkbox" name="trial" value="1" defaultChecked={trial} /> يوم تجريبي مجاني</label>
            <label className={check}><input type="checkbox" name="mosque" value="1" defaultChecked={mosque} /> فيه مصلى</label>
            <label className={check}><input type="checkbox" name="quiet" value="1" defaultChecked={quiet} /> بدون موسيقى</label>
            <label className={check}><input type="checkbox" name="kidsarea" value="1" defaultChecked={kidsArea} /> Kids Area</label>
            <label className={check}><input type="checkbox" name="kids" value="1" defaultChecked={kids} /> مهيّأ للأطفال (5–12)</label>
            <label className={check}><input type="checkbox" name="transport" value="1" defaultChecked={transport} /> مواصلات للأطفال</label>
            <label className={check}><input type="checkbox" name="access" value="1" defaultChecked={access} /> مهيّأ لذوي الاحتياجات</label>
            <button className="min-h-12 rounded-xl bg-accent px-6 font-semibold text-accent-foreground sm:col-span-3 lg:col-span-4">طبّق الفلاتر</button>
          </div>
        </details>}
      </form>

      {error && <p role="alert" className="rounded-2xl bg-surface p-6 text-center ring-1 ring-line">ما قدرنا نحمّل النتائج. جرّب كمان شوي.</p>}
      {!error && total === 0 && (
        <div className="rounded-2xl bg-surface px-6 py-12 text-center ring-1 ring-line">
          <h2 className="text-2xl font-bold">ما لقينا إشي مطابق</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">غيّر كلمة البحث، أو خفّف الفلاتر (المدينة والسعر).</p>
          <Link href="/search" className={`${btn.primary} mt-5`}>عرض كل الأماكن</Link>
        </div>
      )}
      {!error && total > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p><span className="font-display text-2xl font-bold tabular-nums">{total.toLocaleString("en")}</span> <span className="text-sm text-muted">نتيجة{pages > 1 ? `، صفحة ${page} من ${pages}` : ""}</span></p>
          {mode === "orgs" && <NearMeButton active={!!near} />}
        </div>
      )}
      {near && mode === "orgs" && total > 0 && <p className="mb-4 text-sm text-muted">مرتبة من الأقرب للأبعد (الأماكن اللي موقعها محدد بس).</p>}

      {orgs && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{orgs.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>}
      {prods && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {prods.items.map((p) => <ProductCard key={p.id} p={p} store={p.organizations?.name_ar} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={href(page - 1)} className={btn.ghost}>السابق</Link>}
          <span className="text-muted tabular-nums">{page} / {pages}</span>
          {page < pages && <Link href={href(page + 1)} className={btn.primary}>التالي</Link>}
        </nav>
      )}
    </div>
  );
}
