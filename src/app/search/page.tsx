import Link from "next/link";
import type { Metadata } from "next";
import { SponsoredSlot } from "@/components/SponsoredSlot";
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
  const activeFilters = mode === "products" ? 0 : [type, city, area, category, women, maxPrice, trial, mosque, quiet, kidsArea, kids, transport, access].filter(Boolean).length + (near ? 1 : 0);
  const field = "min-h-11 w-full rounded-xl bg-surface px-3 py-2.5 ring-1 ring-white/10 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <SponsoredSlot placement="search" className="mb-5" />
      <div className="mb-7 rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(54,120,246,.16),transparent_45%),linear-gradient(135deg,rgba(255,255,255,.035),transparent)] p-4 sm:p-7"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-bold tracking-wider text-cyan-200">اكتشف خياراتك</p><h1 className="text-2xl font-black sm:text-3xl">{q ? `نتائج البحث عن «${q}»` : mode === "products" ? "السوق الرياضي" : "دليل الأنشطة الرياضية"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">قارن الأماكن والخدمات حسب المدينة والسعر والمرافق، واختار الأنسب لهدفك.</p></div><Link href="/sections" className="rounded-full border border-white/10 bg-surface px-4 py-2 text-sm font-bold transition hover:border-cyan-300/40">تصفّح الأقسام ←</Link></div><form className="mb-0">
        {near && mode === "orgs" && <><input type="hidden" name="lat" value={near.lat} /><input type="hidden" name="lng" value={near.lng} /></>}
        <div className="flex gap-2">
          <input name="q" aria-label="كلمات البحث" defaultValue={q} placeholder="ابحث..." className={`${field} min-w-0 flex-1`} />
          <button className="min-h-11 shrink-0 rounded-xl bg-accent px-5 font-bold text-accent-foreground transition hover:brightness-110 sm:px-6">بحث</button>
        </div>
        <label className="mt-3 block text-sm font-semibold text-muted">نوع النتائج
          <select name="in" aria-label="نوع النتائج" defaultValue={mode} className={`${field} mt-1`}>
            <option value="orgs">الأنشطة والأماكن</option><option value="products">المنتجات الرياضية</option>
          </select>
        </label>
        {mode === "orgs" && <details open={activeFilters > 0} className="mt-3 rounded-2xl bg-surface/60 ring-1 ring-white/10">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span>⚙️ الفلاتر</span>
            {activeFilters > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{activeFilters}</span>}
          </summary>
          {activeFilters > 0 && <div className="px-4 pb-3"><Link href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"} className="rounded-lg py-1 text-xs text-muted underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">مسح الفلاتر</Link></div>}
          <div className="grid gap-2 p-3 pt-0 sm:grid-cols-3 lg:grid-cols-4">
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
              <option value="only">💗 Pink Zone فقط</option>
              <option value="any">يشمل أوقات نسائية</option>
            </select>
            <CityAreaPicker defaultCity={city} defaultArea={area} allowAll labels={false} />
            <input name="max" aria-label="أقصى سعر شهري بالدينار الأردني" type="number" min="1" step="1" defaultValue={maxPrice || ""} placeholder="أقصى سعر شهري (د.أ)" className={field} />
            <label className={`${field} flex items-center gap-2` }><input type="checkbox" name="trial" value="1" defaultChecked={trial} /> 🎟 يوم تجريبي مجاني</label>
            <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="mosque" value="1" defaultChecked={mosque} /> 🕌 فيه مصلى</label>
            <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="quiet" value="1" defaultChecked={quiet} /> 🔇 بدون موسيقى</label>
            <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="kidsarea" value="1" defaultChecked={kidsArea} /> 🧒 Kids Area</label>
            <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="kids" value="1" defaultChecked={kids} /> 👶 مهيّأ للأطفال (5–12)</label>
            <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="transport" value="1" defaultChecked={transport} /> 🚌 مواصلات للأطفال</label>
            <label className={`${field} flex items-center gap-2`}><input type="checkbox" name="access" value="1" defaultChecked={access} /> ♿ مهيّأ لذوي الاحتياجات</label>
            <button className="rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground">تطبيق</button>
          </div>
        </details>}
      </form></div>

      {mode === "orgs" && <div className="mb-4 flex flex-wrap items-center gap-3"><NearMeButton active={!!near} />{near && <span className="text-sm text-muted">مرتبة من الأقرب للأبعد (الأنشطة اللي حدّدت موقعها فقط)</span>}</div>}

      {error && <p className="rounded-2xl bg-surface p-6 text-center">تعذّر تحميل النتائج حالياً، جرّب مرة ثانية بعد قليل.</p>}
      {!error && total === 0 && <div className="rounded-3xl border border-dashed border-white/15 bg-surface/50 px-6 py-14 text-center"><span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-blue-400/10 text-3xl">⌕</span><h2 className="text-xl font-extrabold">ما لقينا نتائج مطابقة</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">جرّب تغيّر كلمة البحث أو توسّع خيارات المدينة والسعر، ويمكن تلاقي المكان المناسب.</p><Link href="/search" className="mt-5 inline-flex rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground">عرض كل الأنشطة</Link></div>}
      {!error && <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-lg font-extrabold">{total} <span className="text-sm font-normal text-muted">نتيجة مطابقة</span></p><p className="text-xs text-muted">الصفحة {page}{pages > 1 ? ` من ${pages}` : ""}</p></div>}

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
