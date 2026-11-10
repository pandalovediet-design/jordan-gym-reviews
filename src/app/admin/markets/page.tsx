import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { addCity, addCountry, addCountryManager, deleteCity, removeCountryManager, setCountryActive } from "./actions";

export const metadata: Metadata = { title: "الدول والمدن", robots: { index: false } };

export default async function MarketsAdmin() {
  const { supabase } = await requireUser();
  const [countries, cities, managers, orgs] = await Promise.all([
    supabase.from("countries").select("*").order("sort_order").order("code"),
    supabase.from("cities").select("*").order("sort_order").order("name_ar"),
    supabase.rpc("list_country_managers"),
    supabase.from("organizations").select("country_code,city_id").limit(10000),
  ]);
  const list = countries.data ?? [];
  const orgRows = orgs.data ?? [];
  const inCountry = (code: string) => orgRows.filter((o) => o.country_code === code).length;
  const inCity = (id: string) => orgRows.filter((o) => o.city_id === id).length;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "inline-flex min-h-9 items-center rounded-lg bg-white/10 px-3 text-xs font-bold transition-colors hover:bg-white/20";
  const lbl = "block space-y-1 text-sm text-muted";
  const countryOptions = list.map((c) => <option key={c.code} value={c.code}>{c.name_ar}</option>);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold">الدول والمدن</h1>
        <p className="mt-1 text-sm leading-6 text-muted">كل دولة سوق مستقل باسم GYM + رمزها. السوق المطفي ما بيظهر للزوار، ولا حد بيقدر يسجّل فيه منشأة.</p>
      </div>

      <section className="space-y-3">
        {list.map((c) => {
          const cityList = (cities.data ?? []).filter((x) => x.country_code === c.code);
          const mgrs = (managers.data ?? []).filter((m) => m.country_code === c.code);
          return (
            <article key={c.code} className={`${box} ${c.is_active ? "" : "opacity-80"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-widest text-accent" dir="ltr">{c.market_name}</p>
                  <h2 className="text-xl font-extrabold">{c.name_ar} <span className="text-sm font-normal text-muted">{c.name_en}</span></h2>
                  <p className="mt-1 text-sm text-muted"><span className="font-bold tabular-nums text-foreground">{inCountry(c.code)}</span> منشأة · <span className="font-bold tabular-nums text-foreground">{cityList.length}</span> مدينة</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.is_active ? "bg-accent/15 text-accent" : "bg-white/10 text-muted"}`}>{c.is_active ? "مفعّل" : "مطفي"}</span>
                  {c.code !== "JO" && <form action={setCountryActive.bind(null, c.code, !c.is_active)}><button className={btn}>{c.is_active ? "إطفاء" : "تفعيل"}</button></form>}
                </div>
              </div>

              <details className="mt-4 border-t border-white/10 pt-3">
                <summary className="cursor-pointer text-sm font-bold">المدن ({cityList.length})</summary>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {cityList.map((x) => (
                    <li key={x.id} className="flex items-center gap-2 rounded-full bg-background py-1 pe-1 ps-3 text-sm ring-1 ring-white/10">
                      <span>{x.name_ar}</span><span className="text-xs tabular-nums text-muted">{inCity(x.id)}</span>
                      {inCity(x.id) === 0
                        ? <form action={deleteCity.bind(null, x.id)}><button aria-label={`حذف ${x.name_ar}`} className="inline-flex size-7 items-center justify-center rounded-full text-red-300 hover:bg-white/10">×</button></form>
                        : <span className="size-1" />}
                    </li>
                  ))}
                  {cityList.length === 0 && <li className="text-sm text-muted">ما في مدن بعد.</li>}
                </ul>
              </details>

              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-sm font-bold">مديرو الدولة ({mgrs.length})</p>
                <ul className="mt-2 space-y-1">
                  {mgrs.map((m) => (
                    <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span dir="ltr" className="break-all text-muted">{m.email}</span>
                      <form action={removeCountryManager.bind(null, m.email, c.code)}><button className={`${btn} text-red-300`}>إزالة</button></form>
                    </li>
                  ))}
                  {mgrs.length === 0 && <li className="text-sm text-muted">ما في مدير معيّن. إنت بتدير السوق مباشرة.</li>}
                </ul>
              </div>
            </article>
          );
        })}
      </section>

      <section className={box}>
        <h2 className="text-lg font-bold">تعيين مدير دولة</h2>
        <p className="mb-3 mt-1 text-sm leading-6 text-muted">بيراجع وبيعتمد منشآت دولته بس من صفحة «إدارة السوق». ما بيشوف باقي الدول، وما بيقدر يعطي علامة التوثيق.</p>
        <ActionForm action={addCountryManager} submit="تعيين">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>إيميل حسابه<input name="email" type="email" required dir="ltr" className={field} /></label>
            <label className={lbl}>الدولة<select name="country_code" className={field}>{countryOptions}</select></label>
          </div>
        </ActionForm>
      </section>

      <section className={box}>
        <h2 className="mb-3 text-lg font-bold">إضافة مدينة</h2>
        <ActionForm action={addCity} submit="إضافة المدينة">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>الدولة<select name="country_code" className={field}>{countryOptions}</select></label>
            <label className={lbl}>الاسم بالعربي<input name="name_ar" required maxLength={60} className={field} /></label>
            <label className={lbl}>الاسم بالإنجليزي<input name="name_en" dir="ltr" maxLength={60} className={field} /></label>
            <label className={lbl}>رمز الرابط<input name="slug" required dir="ltr" placeholder="riyadh" maxLength={40} className={field} /></label>
          </div>
        </ActionForm>
      </section>

      <section className={box}>
        <h2 className="text-lg font-bold">إضافة دولة</h2>
        <p className="mb-3 mt-1 text-sm text-muted">بتنضاف مطفية. فعّلها لما تجهز مدنها ومنشآتها.</p>
        <ActionForm action={addCountry} submit="إضافة الدولة">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={lbl}>الرمز (ISO)<input name="code" required dir="ltr" placeholder="AE" maxLength={2} className={field} /></label>
            <label className={lbl}>الاسم بالعربي<input name="name_ar" required maxLength={60} className={field} /></label>
            <label className={lbl}>الاسم بالإنجليزي<input name="name_en" required dir="ltr" maxLength={60} className={field} /></label>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
