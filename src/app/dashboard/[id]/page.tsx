import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { AVAILABILITY_LABEL, BILLING_LABEL, DELIVERY_LABEL, publicMediaUrl, WEEKDAYS, hhmm, jod } from "@/lib/format";
import { CityAreaPicker } from "@/components/CityAreaPicker";
import { missingForPublish, suggestionsFor } from "@/lib/completeness";
import { addOffer, addProduct, deleteMedia, deleteOffer, deleteProduct, setProductImage, uploadMedia, addService, deleteService, saveHours, submitForReview, updateProfile, addClass, deleteClass, addBranch, updateBranch, deleteBranch, setBranchActive, addTrainer, deleteTrainer, setProductAvailability, addMenuItem, deleteMenuItem, setMenuAvailability, setMenuImage } from "../actions";

export const metadata: Metadata = { title: "تعديل النشاط", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const STATUS = { draft: "مسودة (غير ظاهرة للعامة)", pending: "بانتظار مراجعة الإدارة", published: "منشور", suspended: "موقوف" } as const;

export default async function EditOrg({ params }: PageProps<"/dashboard/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const [{ data: org }, { data: services }, { data: hours }, { data: media }, { data: offers }, { data: products }, { data: cats }, { data: orgCats }, { data: classes }, { data: branches }, { data: trainers }, { data: menu }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", id).maybeSingle(),
    supabase.from("organization_services").select("*").eq("organization_id", id).order("sort_order").order("created_at"),
    supabase.from("organization_hours").select("*").eq("organization_id", id),
    supabase.from("organization_media").select("*").eq("organization_id", id).order("sort_order"),
    supabase.from("offers").select("*").eq("organization_id", id).order("ends_at", { ascending: false }),
    supabase.from("products").select("id,name_ar,price_jod,availability,moderation_status,image_path,branch_id").eq("organization_id", id).order("created_at", { ascending: false }),
    supabase.from("product_categories").select("id,name_ar").order("sort_order"),
    supabase.from("org_categories").select("id,org_type,name_ar").eq("is_active", true).order("sort_order"),
    supabase.from("org_classes").select("*").eq("organization_id", id).order("weekday").order("starts_at"),
    supabase.from("org_branches").select("*").eq("organization_id", id).order("is_main", { ascending: false }).order("sort_order"),
    supabase.from("org_trainers").select("*").eq("organization_id", id).order("sort_order"),
    supabase.from("menu_items").select("*").eq("organization_id", id).order("sort_order").order("created_at"),
  ]);
  if (!org) notFound();
  const missing = org.status === "draft" ? await missingForPublish(supabase, id) : [];
  const tips = org.status === "draft" ? await suggestionsFor(supabase, id) : [];
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const lbl = "block space-y-1 text-sm text-muted";
  const allBranches = branches ?? [];
  const multi = allBranches.length > 1;
  const bName = (bid: string | null) => (bid ? allBranches.find((b) => b.id === bid)?.name_ar ?? "" : "");
  const bTag = (bid: string | null) => (multi ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted">{bid ? bName(bid) : "كل الفروع"}</span> : null);
  const branchSelect = multi ? (
    <label className={lbl}>الفرع
      <select name="branch_id" defaultValue="" className={field}>
        <option value="">كل الفروع</option>
        {allBranches.map((b) => <option key={b.id} value={b.id}>{b.name_ar}{b.city ? ` — ${b.city}` : ""}</option>)}
      </select>
    </label>
  ) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{org.name_ar}</h1>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{STATUS[org.status]}</span>
      </div>

      {org.status === "draft" && (
        <form action={submitForReview.bind(null, id)} className={`${box} flex items-center justify-between gap-3`}>
          <p className="text-sm">لما تخلص البيانات، أرسله للمراجعة عشان يظهر للعامة.</p>
          <button disabled={missing.length > 0} className="rounded-xl bg-accent px-5 py-2 font-bold text-accent-foreground disabled:opacity-40">إرسال للمراجعة</button>
        </form>
      )}
      {org.status === "draft" && missing.length > 0 && <p className="rounded-xl bg-yellow-400/10 p-3 text-sm text-yellow-200">ناقص قبل الإرسال: {missing.join("، ")}.</p>}
      {org.status === "draft" && missing.length === 0 && tips.length > 0 && <p className="rounded-xl bg-white/5 p-3 text-sm text-muted">تقدر ترسل للمراجعة هسا. وتحسّن صفحتك بعدين: {tips.join("، ")}.</p>}
      {org.status === "published" && <Link href={`/g/${org.slug}`} className="text-accent underline">عرض الصفحة العامة</Link>}

      <section className={box}><h2 className="mb-3 text-lg font-bold">البيانات الأساسية</h2>
        <ActionForm action={updateProfile.bind(null, id)}>
          <label className={lbl}>الاسم<input name="name_ar" required defaultValue={org.name_ar} className={field} /></label>
          <label className={lbl}>الاسم بالإنجليزي<input name="name_en" defaultValue={org.name_en ?? ""} dir="ltr" className={field} /></label>
          <label className={lbl}>الوصف<textarea name="description_ar" rows={4} defaultValue={org.description_ar ?? ""} className={field} /></label>
          <label className={lbl}>التصنيف
            <select name="category_id" defaultValue={org.category_id ?? ""} className={field}>
              <option value="">بدون تصنيف</option>
              {(orgCats ?? []).filter((c) => c.org_type === org.type).map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </label>
          <CityAreaPicker defaultCity={org.city} defaultArea={org.area ?? ""} />
          <input type="hidden" name="address" defaultValue={org.address ?? ""} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>الهاتف<input name="phone" defaultValue={org.phone ?? ""} dir="ltr" placeholder="0791234567" className={field} /></label>
            <label className={lbl}>واتساب<input name="whatsapp" defaultValue={org.whatsapp ?? ""} dir="ltr" placeholder="0791234567" className={field} /></label>
            <label className={lbl}>انستغرام (بدون @)<input name="instagram" defaultValue={org.instagram ?? ""} dir="ltr" className={field} /></label>
            <label className={lbl}>الموقع الإلكتروني<input name="website" defaultValue={org.website ?? ""} dir="ltr" placeholder="https://" className={field} /></label>
          </div>
          <label className={lbl}>📍 حدّد موقعك على الخريطة
            <input name="maps_url" defaultValue={org.maps_url ?? ""} dir="ltr" placeholder="https://maps.app.goo.gl/..." className={field} />
            <span className="block text-xs">افتح قوقل ماب، دوّر على مكانك، اضغط «مشاركة» ثم «نسخ الرابط» والصقه هون. بنستعمله للعنوان وللمسافة بميزة «قريب مني».</span>
          </label>
          <label className={lbl}>🎟 عرض يوم تجريبي (اختياري)
            <input name="free_trial_note" defaultValue={org.free_trial_note ?? ""} maxLength={120} placeholder="مثال: يوم تجريبي مجاني" className={field} />
            <span className="block text-xs">لو كتبت شي، بيظهر زر «احجز يوم تجريبي» بصفحتك وشارة على بطاقتك، وبيوصل الطلب على واتساب. اتركه فاضي لإخفائه.</span>
          </label>
          {org.type === "healthy_food" && (
            <div className="space-y-2 rounded-xl border border-white/10 p-3">
              <input type="hidden" name="delivery_present" value="1" />
              <p className="text-sm font-semibold">طرق التوصيل</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {Object.entries(DELIVERY_LABEL).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2"><input type="checkbox" name="delivery_modes" value={k} defaultChecked={org.delivery_modes?.includes(k)} /> {v}</label>
                ))}
              </div>
              <label className={lbl}>مناطق التوصيل<input name="delivery_areas" defaultValue={org.delivery_areas ?? ""} maxLength={300} placeholder="مثال: عمّان الغربية، الجبيهة، الصويفية" className={field} /></label>
            </div>
          )}
          <div className="space-y-2 rounded-xl border border-pink-400/30 bg-pink-500/5 p-3">
            <label className={lbl}>💗 Pink Zone (للنساء)
              <select name="women_access" defaultValue={org.women_access} className={field}>
                <option value="none">عادي (للجميع)</option>
                <option value="women_only">خاص بالنساء بالكامل — Pink Zone</option>
                <option value="women_hours">فيه أوقات أو قسم نسائي</option>
              </select>
            </label>
            <label className={lbl}>أوقات القسم النسائي (إذا اخترت «أوقات نسائية»)
              <input name="women_hours_note" defaultValue={org.women_hours_note ?? ""} maxLength={200} placeholder="مثال: الأحد والثلاثاء من 4 إلى 8 مساءً" className={field} />
            </label>
            <p className="text-xs text-muted">اختار «خاص بالنساء بالكامل» فقط إذا النشاط كله للنساء. الإدارة بتراجع وبتقدر تشيل الشارة عند أي إساءة.</p>
          </div>
          {org.type === "nutritionist" && (
            <div className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-2">
              <label className={lbl}>رقم الترخيص<input name="license_number" defaultValue={org.license_number ?? ""} dir="ltr" className={field} /></label>
              <label className={lbl}>الجهة المرخِّصة<input name="license_authority" defaultValue={org.license_authority ?? ""} className={field} /></label>
              <p className="text-xs text-muted sm:col-span-2">بنراجع الترخيص قبل ما نعطي علامة «موثّق». كتابة الترخيص لحاله ما بتعني توثيق.</p>
            </div>
          )}
        </ActionForm>
      </section>

      <section className={box}><h2 className="mb-1 text-lg font-bold">الفروع</h2>
        <p className="mb-3 text-xs text-muted">الفرع الرئيسي بياخد بياناته من «البيانات الأساسية» فوق. أضف فروعك الثانية هون، وكل فرع بيكون إله أسعاره وعروضه ودوامه ومنتجاته وحصصه.</p>
        <ul className="mb-4 space-y-2">
          {allBranches.map((b) => (
            <li key={b.id} className="rounded-xl bg-background/40 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{b.name_ar}{b.is_main && <span className="text-muted"> (الرئيسي — {org.city})</span>}{!b.is_main && b.city && <span className="text-muted"> — {b.city}{b.area ? `، ${b.area}` : ""}</span>}{!b.is_active && <span className="text-yellow-200"> · مخفي</span>}{b.women_access === "women_only" && " 💗"}</span>
                {!b.is_main && (
                  <span className="flex gap-3 text-xs">
                    <form action={setBranchActive.bind(null, id, b.id, !b.is_active)}><button className="underline">{b.is_active ? "إخفاء" : "إظهار"}</button></form>
                    <form action={deleteBranch.bind(null, id, b.id)}><button className="text-red-300 underline">حذف (بيحذف أسعاره وعروضه ومنتجاته)</button></form>
                  </span>
                )}
              </div>
              {!b.is_main && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-accent">تعديل بيانات الفرع</summary>
                  <div className="mt-3">
                    <ActionForm action={updateBranch.bind(null, id, b.id)}>
                      <BranchFields b={b} lbl={lbl} />
                    </ActionForm>
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
        <details className="rounded-xl border border-white/10 p-3">
          <summary className="cursor-pointer font-bold text-accent">+ إضافة فرع</summary>
          <div className="mt-3">
            <ActionForm action={addBranch.bind(null, id)} submit="إضافة الفرع">
              <BranchFields lbl={lbl} />
            </ActionForm>
          </div>
        </details>
      </section>

      {(org.type === "gym" || org.type === "sports_facility") && (
        <section className={box}><h2 className="mb-1 text-lg font-bold">المدربون</h2>
          <p className="mb-3 text-xs text-muted">اعرض مدربينك بصورهم وخبراتهم. بيظهروا بصفحتك للزوار.</p>
          <ul className="mb-4 space-y-3">{(trainers ?? []).map((t) => (
            <li key={t.id} className="flex items-start gap-3 text-sm">
              {t.photo_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicMediaUrl(t.photo_path)} alt={t.name_ar} className="size-14 shrink-0 rounded-full object-cover" />
              ) : <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-background/40 text-xs text-muted">بلا صورة</div>}
              <div className="flex-1"><p className="font-semibold">{t.name_ar} {bTag(t.branch_id)}</p>
                <p className="text-muted">{[t.title_ar, t.experience_years != null ? `${t.experience_years} سنة خبرة` : null].filter(Boolean).join(" · ")}</p></div>
              <form action={deleteTrainer.bind(null, id, t.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
            {(trainers ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت مدربين بعد.</li>}</ul>
          <ActionForm action={addTrainer.bind(null, id)} submit="إضافة مدرب">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name_ar" required placeholder="اسم المدرب" className={field} />
              <input name="title_ar" placeholder="التخصص (مثال: مدرب كمال أجسام)" className={field} />
              <input name="experience_years" type="number" min="0" max="60" placeholder="سنوات الخبرة" className={field} />
              <input name="specialties" placeholder="مجالات الخبرة (مثال: تضخيم، تنشيف، إصابات)" className={field} />
            </div>
            <textarea name="bio_ar" rows={3} placeholder="نبذة وخبرات وشهادات" className={field} />
            {branchSelect}
            <label className={lbl}>صورة المدرب<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" /></label>
          </ActionForm>
        </section>
      )}

      {org.type === "healthy_food" && (
        <section className={box}><h2 className="mb-1 text-lg font-bold">قائمة الوجبات</h2>
          <p className="mb-3 text-xs text-muted">اكتب السعرات والبروتين إذا بتعرفها. بتظهر للزوار مع كل وجبة. زر «خلصت» بيخفي الوجبة من الطلب مؤقتاً.</p>
          <ul className="mb-4 space-y-3">{(menu ?? []).map((m) => (
            <li key={m.id} className="flex items-start gap-3 text-sm">
              {m.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicMediaUrl(m.image_path)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
              ) : <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-background/40 text-xs text-muted">بلا صورة</div>}
              <div className="flex-1 space-y-1">
                <p>{m.name_ar} — <span className="text-accent">{jod(m.price_jod)}</span>{m.section && <span className="text-muted"> · {m.section}</span>} {bTag(m.branch_id)}</p>
                <p className="text-xs text-muted">{[m.calories != null ? `${m.calories} سعرة` : null, m.protein_g != null ? `${m.protein_g}غ بروتين` : null, m.carbs_g != null ? `${m.carbs_g}غ كارب` : null, m.fat_g != null ? `${m.fat_g}غ دهون` : null].filter(Boolean).join(" · ")}</p>
                <ActionForm action={setMenuImage.bind(null, id, m.id)} submit={m.image_path ? "تغيير الصورة" : "رفع صورة"} className="flex flex-wrap items-center gap-2">
                  <input name="image" type="file" required accept="image/jpeg,image/png,image/webp" className="max-w-48 text-xs" />
                </ActionForm>
                <form action={setMenuAvailability.bind(null, id, m.id, !m.is_available)}><button className={`rounded-lg px-2 py-1 text-xs ${m.is_available ? "bg-red-400/20 text-red-200" : "bg-accent/20 text-accent"}`}>{m.is_available ? "✖ خلصت" : "✔ رجعت متوفرة"}</button></form>
              </div>
              <form action={deleteMenuItem.bind(null, id, m.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
            {(menu ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت وجبات بعد.</li>}</ul>
          <ActionForm action={addMenuItem.bind(null, id)} submit="إضافة وجبة">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name_ar" required placeholder="اسم الوجبة" className={field} />
              <input name="section" placeholder="القسم (مثال: سلطات، وجبات رئيسية)" className={field} />
              <input name="price_jod" type="number" step="0.01" min="0" required placeholder="السعر (د.أ)" className={field} />
              <input name="calories" type="number" min="0" max="5000" placeholder="السعرات (اختياري)" className={field} />
              <input name="protein_g" type="number" step="0.1" min="0" placeholder="بروتين غ" className={field} />
              <input name="carbs_g" type="number" step="0.1" min="0" placeholder="كارب غ" className={field} />
              <input name="fat_g" type="number" step="0.1" min="0" placeholder="دهون غ" className={field} />
            </div>
            <textarea name="description_ar" rows={2} placeholder="وصف ومكونات" className={field} />
            {branchSelect}
            <label className={lbl}>صورة الوجبة<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" /></label>
          </ActionForm>
        </section>
      )}

      <section className={box}><h2 className="mb-3 text-lg font-bold">الأسعار والخدمات</h2>
        <ul className="mb-4 space-y-2">{(services ?? []).map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
            <span>{s.name_ar} — <span className="text-accent">{jod(s.price_jod)}</span> {s.billing_period && BILLING_LABEL[s.billing_period]} {bTag(s.branch_id)}</span>
            <form action={deleteService.bind(null, id, s.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
          {(services ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت خدمات بعد.</li>}</ul>
        <ActionForm action={addService.bind(null, id)} submit="إضافة" className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-start">
          <input name="name_ar" required placeholder="مثال: اشتراك شهري" className={field} />
          <input name="price_jod" type="number" step="0.01" min="0" placeholder="السعر (د.أ)" className={field} />
          <select name="billing_period" className={field}><option value="">—</option>{Object.entries(BILLING_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          {branchSelect && <div className="sm:col-span-4">{branchSelect}</div>}
        </ActionForm>
      </section>

      {(org.type === "gym" || org.type === "sports_facility" || org.type === "independent_coach") && (
        <section className={box}><h2 className="mb-1 text-lg font-bold">جدول الحصص الأسبوعي</h2>
          <p className="mb-3 text-xs text-muted">للعرض فقط (بدون حجز). بيظهر للزوار بصفحتك.</p>
          <ul className="mb-4 space-y-2">{(classes ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{WEEKDAYS[c.weekday]} {hhmm(c.starts_at)}{c.ends_at ? `–${hhmm(c.ends_at)}` : ""} — {c.title_ar}{c.women_only && " 💗"} {bTag(c.branch_id)}</span>
              <form action={deleteClass.bind(null, id, c.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
            {(classes ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت حصص بعد.</li>}</ul>
          <ActionForm action={addClass.bind(null, id)} submit="إضافة حصة" className="grid gap-3 sm:grid-cols-2">
            <input name="title_ar" required placeholder="مثال: يوغا" className={field} />
            <select name="weekday" className={field}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
            <label className={lbl}>من<input name="starts_at" type="time" required className={field} /></label>
            <label className={lbl}>إلى (اختياري)<input name="ends_at" type="time" className={field} /></label>
            <input name="note" maxLength={200} placeholder="ملاحظة (اختياري)" className={`${field} sm:col-span-2`} />
            {branchSelect && <div className="sm:col-span-2">{branchSelect}</div>}
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="women_only" /> 💗 للنساء فقط</label>
          </ActionForm>
        </section>
      )}


      <section className={box}><h2 className="mb-3 text-lg font-bold">ساعات الدوام</h2>
        <div className="space-y-3">
          {allBranches.map((b) => (
            <details key={b.id} open={allBranches.length === 1} className="rounded-xl bg-background/40 p-3">
              {multi && <summary className="cursor-pointer font-semibold">{b.name_ar}{b.city ? ` — ${b.city}` : ""}</summary>}
              <div className="mt-3">
                <ActionForm action={saveHours.bind(null, id, b.id)}>
                  {WEEKDAYS.map((name, d) => {
                    const h = hours?.find((x) => x.weekday === d && x.branch_id === b.id);
                    return (<div key={d} className="grid grid-cols-[5rem_1fr_1fr_auto] items-center gap-2 text-sm">
                      <span>{name}</span>
                      <input name={`open_${d}`} type="time" defaultValue={hhmm(h?.opens_at ?? null)} className={field} dir="ltr" />
                      <input name={`close_${d}`} type="time" defaultValue={hhmm(h?.closes_at ?? null)} className={field} dir="ltr" />
                      <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name={`closed_${d}`} defaultChecked={!!h?.is_closed} />مغلق</label></div>);
                  })}
                </ActionForm>
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className={box}><h2 className="mb-3 text-lg font-bold">الصور</h2>
        <div className="mb-4 grid grid-cols-3 gap-3">{(media ?? []).map((m) => (
          <div key={m.id} className="space-y-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicMediaUrl(m.storage_path)} alt={m.alt_text ?? ""} className="aspect-[4/3] w-full rounded-lg object-cover" />
            <form action={deleteMedia.bind(null, id, m.id)}><button className="text-xs text-red-300 underline">حذف</button></form></div>))}
          {(media ?? []).length === 0 && <p className="col-span-3 text-sm text-muted">ما رفعت صور بعد.</p>}</div>
        <ActionForm action={uploadMedia.bind(null, id)} submit="رفع">
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
          <input name="alt_text" placeholder="وصف الصورة (اختياري)" className={field} />
          <p className="text-xs text-muted">JPG / PNG / WebP، حتى 4MB، وحد أقصى 12 صورة.</p>
        </ActionForm>
      </section>

      {org.type === "store" && (
        <section className={box}><h2 className="mb-3 text-lg font-bold">المنتجات</h2>
          <ul className="mb-4 space-y-3">{(products ?? []).map((p) => (
            <li key={p.id} className="flex items-start gap-3 text-sm">
              {p.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicMediaUrl(p.image_path)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
              ) : <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-background/40 text-xs text-muted">بلا صورة</div>}
              <div className="flex-1 space-y-1">
                <p>{p.name_ar} — <span className="text-accent">{jod(p.price_jod)}</span> · {AVAILABILITY_LABEL[p.availability]}{p.moderation_status !== "approved" && <span className="text-muted"> · {p.moderation_status === "pending" ? "بانتظار الموافقة" : "مرفوض"}</span>} {bTag(p.branch_id)}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {p.availability !== "available" && <form action={setProductAvailability.bind(null, id, p.id, "available")}><button className="rounded-lg bg-accent/20 px-2 py-1 text-accent">✔ متوفر</button></form>}
                  {p.availability !== "limited" && <form action={setProductAvailability.bind(null, id, p.id, "limited")}><button className="rounded-lg bg-white/10 px-2 py-1">كمية محدودة</button></form>}
                  {p.availability !== "out_of_stock" && <form action={setProductAvailability.bind(null, id, p.id, "out_of_stock")}><button className="rounded-lg bg-red-400/20 px-2 py-1 text-red-200">✖ خلص</button></form>}
                </div>
                <ActionForm action={setProductImage.bind(null, id, p.id)} submit={p.image_path ? "تغيير الصورة" : "رفع صورة"} className="flex flex-wrap items-center gap-2">
                  <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="text-xs" />
                </ActionForm>
              </div>
              <form action={deleteProduct.bind(null, id, p.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
            {(products ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت منتجات بعد.</li>}</ul>
          <ActionForm action={addProduct.bind(null, id)} submit="إضافة منتج">
            <input name="name_ar" required placeholder="اسم المنتج" className={field} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="brand" placeholder="الماركة" className={field} />
              <select name="category_id" required className={field}><option value="">الفئة</option>{(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select>
              <input name="price_jod" type="number" step="0.01" min="0" required placeholder="السعر (د.أ)" className={field} />
              <select name="availability" className={field}>{Object.entries(AVAILABILITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <label className={lbl}>صورة المنتج<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" /></label>
            <textarea name="description_ar" rows={3} placeholder="شرح المنتج (يظهر تحت الصورة)" className={field} />
            <textarea name="ingredients" rows={2} placeholder="المكونات (للمكملات)" className={field} />
            {branchSelect}
          </ActionForm>
        </section>
      )}

      <section className={box}><h2 className="mb-3 text-lg font-bold">العروض</h2>
        <ul className="mb-4 space-y-2">{(offers ?? []).map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 text-sm"><span>{o.kind === "course" ? "🎓 " : ""}{o.title_ar} <span className="text-muted">حتى {o.ends_at.slice(0, 10)}</span> {bTag(o.branch_id)}</span>
            <form action={deleteOffer.bind(null, id, o.id)}><button className="text-red-300 underline">حذف</button></form></li>))}
          {(offers ?? []).length === 0 && <li className="text-sm text-muted">لا توجد عروض.</li>}</ul>
        <ActionForm action={addOffer.bind(null, id)} submit="إضافة عرض">
          <input name="title_ar" required placeholder="عنوان العرض" className={field} />
          <textarea name="description_ar" rows={2} placeholder="تفاصيل" className={field} />
          <select name="kind" className={field}><option value="offer">عرض</option><option value="course">دورة / برنامج</option></select>
          {branchSelect}
          <div className="grid gap-3 sm:grid-cols-4">
            <input name="discount_percent" type="number" min="1" max="90" placeholder="نسبة الخصم %" className={field} />
            <input name="offer_price_jod" type="number" step="0.01" min="0" placeholder="سعر العرض" className={field} />
            <input name="starts_at" type="date" required className={field} dir="ltr" />
            <input name="ends_at" type="date" required className={field} dir="ltr" />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}

function BranchFields({ b, lbl }: { b?: { name_ar: string; city: string | null; area: string | null; address: string | null; phone: string | null; whatsapp: string | null; maps_url: string | null; women_access: string; women_hours_note: string | null }; lbl: string }) {
  return (
    <>
      <label className={lbl}>اسم الفرع<input name="name_ar" required defaultValue={b?.name_ar ?? ""} placeholder="مثال: فرع عبدون" className={field} /></label>
      <CityAreaPicker defaultCity={b?.city ?? ""} defaultArea={b?.area ?? ""} />
      <input type="hidden" name="address" defaultValue={b?.address ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>هاتف الفرع (اختياري)<input name="phone" defaultValue={b?.phone ?? ""} dir="ltr" placeholder="0791234567" className={field} /></label>
        <label className={lbl}>واتساب الفرع (اختياري)<input name="whatsapp" defaultValue={b?.whatsapp ?? ""} dir="ltr" placeholder="0791234567" className={field} /></label>
      </div>
      <label className={lbl}>📍 حدّد موقع الفرع على الخريطة
        <input name="maps_url" defaultValue={b?.maps_url ?? ""} dir="ltr" placeholder="https://maps.app.goo.gl/..." className={field} />
        <span className="block text-xs">الصق رابط قوقل ماب (مشاركة ثم نسخ الرابط). بنستعمله للمسافة بميزة «قريب مني».</span>
      </label>
      <div className="space-y-2 rounded-xl border border-pink-400/30 bg-pink-500/5 p-3">
        <label className={lbl}>💗 Pink Zone للفرع
          <select name="women_access" defaultValue={b?.women_access ?? "none"} className={field}>
            <option value="none">عادي (للجميع)</option>
            <option value="women_only">خاص بالنساء بالكامل</option>
            <option value="women_hours">فيه أوقات أو قسم نسائي</option>
          </select>
        </label>
        <input name="women_hours_note" defaultValue={b?.women_hours_note ?? ""} maxLength={200} placeholder="أوقات القسم النسائي (إن وجدت)" className={field} />
      </div>
    </>
  );
}
