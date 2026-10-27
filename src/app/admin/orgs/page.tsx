import type { Metadata } from "next";
import Link from "next/link";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { GLOW_COLORS, GLOW_NAME, ORG_TYPE_LABEL, isVerified, jordanTodayStartIso } from "@/lib/format";
import { cleanQuery } from "@/lib/format";
import { isOrgType } from "@/lib/queries";
import { ActionForm } from "@/components/Form";
import { assignOrgOwner, createOwnerAccount, clearWomenAccess, clearOrgBadge, setFeatured, setGlow, setOrgStatus, setOrgCategory, setOrgType, setReviewDone, setVerified } from "../actions";

export const metadata: Metadata = { title: "الأنشطة", robots: { index: false } };
const STATUSES = ["draft", "pending", "published", "suspended"] as const;
const STATUS_LABEL = { draft: "مسودة", pending: "بانتظار المراجعة", published: "منشور", suspended: "موقوف" } as const;

const tempPassword = () => "Gym" + randomBytes(4).toString("hex");

export default async function AdminOrgs({ searchParams }: PageProps<"/admin/orgs">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = cleanQuery(one(sp.q));
  const status = one(sp.status);
  const type = one(sp.type);
  const review = one(sp.review) === "done" ? "done" : one(sp.review) === "all" ? "all" : "pending";
  const PAGE = 40;
  const page = Math.max(1, Math.floor(Number(one(sp.p)) || 1));
  const { supabase } = await requireUser();
  // Start of "today" in Jordan time (UTC+3), for the daily goal counter.
  const todayStart = jordanTodayStartIso();
  const [pendingCount, doneCount, todayCount] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).is("review_done_at", null),
    supabase.from("organizations").select("id", { count: "exact", head: true }).not("review_done_at", "is", null),
    supabase.from("organizations").select("id", { count: "exact", head: true }).gte("review_done_at", todayStart),
  ]);
  const nPending = pendingCount.count ?? 0, nDone = doneCount.count ?? 0, nToday = todayCount.count ?? 0;
  const DAILY_GOAL = 20;
  let query = supabase.from("organizations").select("id,review_done_at,name_ar,type,category_id,city,area,is_claimed,status,verified_at,verified_until,slug,women_access,has_mosque,no_music,has_kids_area,kids_friendly,kids_transport,accessibility", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (review === "pending") query = query.is("review_done_at", null);
  if (review === "done") query = query.not("review_done_at", "is", null).order("review_done_at", { ascending: false });
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%`);
  if ((STATUSES as readonly string[]).includes(status)) query = query.eq("status", status as (typeof STATUSES)[number]);
  if (isOrgType(type)) query = query.eq("type", type);
  const [orgs, promos, owners, users, cats] = await Promise.all([
    query,
    supabase.from("org_promotions").select("organization_id,featured_until,featured_rank,glow_color,glow_until"),
    supabase.from("organization_members").select("organization_id,user_id,role").eq("role", "owner"),
    supabase.rpc("admin_list_users"),
    supabase.from("org_categories").select("id,slug,org_type,name_ar,sort_order").eq("is_active", true).order("sort_order"),
  ]);
  const emailOf = (orgId: string) => {
    const m = (owners.data ?? []).find((x) => x.organization_id === orgId);
    return (users.data ?? []).find((u) => u.id === m?.user_id)?.email ?? null;
  };
  const promoOf = (id: string) => (promos.data ?? []).find((p) => p.organization_id === id);
  const isLive = (id: string) => { const p = promoOf(id); return !!p?.featured_until && new Date(p.featured_until) > new Date(); };
  const total = orgs.count ?? (orgs.data ?? []).length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const pageHref = (n: number) => ({ pathname: "/admin/orgs", query: { review, p: String(n), ...(q ? { q } : {}), ...(status ? { status } : {}), ...(type ? { type } : {}) } });
  const pager = pages > 1 && (
    <nav className="flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="الصفحات">
      {page > 1 && <Link href={pageHref(page - 1)} className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 ring-1 ring-white/10 transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none">→ السابق</Link>}
      <span className="px-2 text-center text-muted" aria-live="polite">صفحة {page} من {pages} · {total} نشاط</span>
      {page < pages && <Link href={pageHref(page + 1)} className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 ring-1 ring-white/10 transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none">التالي ←</Link>}
    </nav>
  );
  const box = "rounded-2xl bg-surface p-4 ring-1 ring-white/10 sm:p-5";
  const btn = "inline-flex min-h-10 items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-xs transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none";
  const fld = "min-h-11 min-w-0 rounded-xl bg-surface px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus-visible:ring-2 focus-visible:ring-accent";
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-extrabold">إدارة الأنشطة</h1><p className="mt-1 text-sm text-muted">مراجعة الأنشطة وتحديث بياناتها وحالتها.</p></div>
        <span className="rounded-full bg-accent/10 px-3 py-1.5 text-sm font-bold text-accent ring-1 ring-accent/20">{total} نشاط</span>
      </div>
      <div className={`${box} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-bold">هدف اليوم: {nToday} / {DAILY_GOAL}{nToday >= DAILY_GOAL ? " 🎉" : ""}</span>
          <span className="text-muted">المنجز الكلي: {nDone} من {nDone + nPending}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="التقدم نحو هدف مراجعة الأنشطة اليومي" aria-valuenow={Math.min(nToday, DAILY_GOAL)} aria-valuemin={0} aria-valuemax={DAILY_GOAL}>
          <div className="h-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: `${Math.min(100, (nToday / DAILY_GOAL) * 100)}%` }} />
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="تصفية حسب إنجاز المراجعة">
          {([["pending", `غير منجز (${nPending})`], ["done", `منجز (${nDone})`], ["all", "الكل"]] as const).map(([k, label]) => (
            <Link key={k} href={{ pathname: "/admin/orgs", query: { review: k, ...(q ? { q } : {}), ...(status ? { status } : {}), ...(type ? { type } : {}) } }} aria-current={review === k ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 ring-1 ring-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none ${review === k ? "bg-accent font-bold text-accent-foreground" : "bg-background hover:ring-accent"}`}>{label}</Link>
          ))}
        </nav>
      </div>
      <form className={`${box} grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end`} role="search" aria-label="البحث عن الأنشطة">
        <input type="hidden" name="review" value={review} />
        <label className="grid gap-1 text-xs font-semibold text-muted">بحث بالاسم أو المدينة أو المنطقة
          <input name="q" defaultValue={q} placeholder="اكتب اسم النشاط أو المنطقة" className={`${fld} w-full`} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">الحالة
          <select name="status" defaultValue={status} className={fld}><option value="">كل الحالات</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">النوع
          <select name="type" defaultValue={type} className={fld}><option value="">كل الأنواع</option>{Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <button className="min-h-11 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:transition-none">تطبيق الفلاتر</button>
      </form>
      {pager}
      <ul className="space-y-3">{(orgs.data ?? []).map((o) => (
          <li key={o.id} className={`${box} space-y-3`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1"><p className="break-words font-semibold">{o.name_ar} {isVerified(o) && <span className="text-accent" aria-label="موثّق">✓</span>} {isLive(o.id) && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">مميّز</span>}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{ORG_TYPE_LABEL[o.type]} · {[o.city, o.area].filter(Boolean).join("، ")} · {STATUS_LABEL[o.status]} · {o.review_done_at ? "✔ منجز" : "غير منجز"}</p>
              {o.is_claimed === false
                ? <p className="mt-1 text-xs text-yellow-200">غير مُستلَم (بيانات أولية)</p>
                : emailOf(o.id) && <p className="mt-1 break-all text-xs text-muted">المالك: <span dir="ltr">{emailOf(o.id)}</span></p>}</div>
            <div className="flex flex-wrap gap-2 sm:max-w-[52%] sm:justify-end">
              <Link href={`/dashboard/${o.id}/overview`} className={`${btn} !bg-accent text-accent-foreground`}>تعديل البيانات</Link>
              {o.status === "published" ? <Link href={`/g/${o.slug}`} className={btn}>الصفحة العامة</Link> : <span className="flex min-h-10 items-center px-2 text-xs text-muted">الصفحة العامة بعد النشر</span>}
              {o.review_done_at
                ? <form action={setReviewDone.bind(null, o.id, false)}><button className={btn}>↩ رجّعه لغير منجز</button></form>
                : <form action={setReviewDone.bind(null, o.id, true)}><button className={`${btn} !bg-green-600 font-bold text-white`}>✔ تم</button></form>}
              {o.status !== "published" && <form action={setOrgStatus.bind(null, o.id, "published")}><button className={`${btn} !bg-accent text-accent-foreground`}>نشر</button></form>}
              {o.status === "published" && <form action={setOrgStatus.bind(null, o.id, "suspended")}><button className={btn}>إيقاف</button></form>}
            </div></div>
            <details className="rounded-xl bg-background/40 p-3 text-xs ring-1 ring-white/5">
              <summary className="min-h-11 cursor-pointer list-none py-2 font-semibold text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">⚙️ أدوات أكثر (صاحب النشاط، التوثيق، التصنيف، التمييز، QR)</summary>
              <div className="mt-3 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/qr/${o.id}/sticker`} className={btn}>ستكر QR</Link>
              {o.women_access !== "none" && <form action={clearWomenAccess.bind(null, o.id)}><button className={btn}>💗 إزالة {o.women_access === "women_only" ? "Pink Zone" : "الأوقات النسائية"}</button></form>}
              {o.has_mosque && <form action={clearOrgBadge.bind(null, o.id, "has_mosque")}><button className={btn}>🕌 إزالة شارة المصلى</button></form>}
              {o.no_music && <form action={clearOrgBadge.bind(null, o.id, "no_music")}><button className={btn}>🔇 إزالة شارة بدون موسيقى</button></form>}
              {o.has_kids_area && <form action={clearOrgBadge.bind(null, o.id, "has_kids_area")}><button className={btn}>🧒 إزالة Kids Area</button></form>}
              {o.kids_friendly && <form action={clearOrgBadge.bind(null, o.id, "kids_friendly")}><button className={btn}>👶 إزالة شارة الأطفال</button></form>}
              {o.kids_transport && <form action={clearOrgBadge.bind(null, o.id, "kids_transport")}><button className={btn}>🚌 إزالة المواصلات</button></form>}
              {(o.accessibility ?? []).length > 0 && <form action={clearOrgBadge.bind(null, o.id, "accessibility")}><button className={btn}>♿ إزالة التهيئة</button></form>}
            </div>
            <details className="text-xs">
              <summary className="min-h-11 cursor-pointer py-3 text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">🔗 ربط النشاط بحساب صاحبه</summary>
              <ActionForm action={assignOrgOwner.bind(null, o.id)} submit="ربط" className="mt-2 flex flex-wrap items-center gap-2">
                <input name="email" type="email" dir="ltr" required placeholder="إيميل حساب صاحب النشاط" className={`${fld} min-w-56`} />
                <select name="mode" defaultValue="move" className={fld}>
                  <option value="move">انقل الملكية له (أشيل حسابي)</option>
                  <option value="add">أضفه وأبقى معه</option>
                </select>
              </ActionForm>
              <p className="mt-2 leading-5 text-muted">تأكد أنه صاحبه فعلاً قبل الربط (مثلاً من واتساب النادي)، وهو لازم يكون عامل حساب أول.</p>
            </details>
            <details className="text-xs">
              <summary className="min-h-11 cursor-pointer py-3 text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">🔑 أنشئ حساب لصاحب النادي (إيميل + كلمة مؤقتة)</summary>
              <ActionForm action={createOwnerAccount.bind(null, o.id)} submit="إنشاء وربط" className="mt-2 flex flex-wrap items-center gap-2">
                <input name="email" type="email" dir="ltr" required placeholder="إيميل صاحب النادي" className={`${fld} min-w-56`} />
                <input name="password" dir="ltr" minLength={8} defaultValue={tempPassword()} className={`${fld} w-40`} aria-label="كلمة مؤقتة" />
                <select name="mode" defaultValue="move" className={fld}>
                  <option value="move">انقل الملكية له</option>
                  <option value="add">أضفه وأبقى معه</option>
                </select>
              </ActionForm>
              <p className="mt-2 leading-5 text-muted">بيدخل بالإيميل والكلمة المؤقتة، وأول ما يدخل بينجبر يختار كلمة خاصة فيه. ابعتله البيانات على واتساب.</p>
            </details>
            <form action={setVerified.bind(null, o.id)} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">التوثيق {isVerified(o) ? (o.verified_until ? `(حتى ${o.verified_until.slice(0, 10)})` : "(بدون انتهاء)") : o.verified_at ? "(منتهي)" : ""}:</span>
              <select name="days" defaultValue="365" className={fld}>
                <option value="365">سنة</option><option value="180">6 شهور</option><option value="90">3 شهور</option><option value="0">بدون انتهاء</option><option value="off">إلغاء التوثيق</option>
              </select>
              <button className={btn}>حفظ</button>
            </form>
            <form action={setOrgCategory.bind(null, o.id)} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">نقل لتصنيف:</span>
              <select name="cat" defaultValue={(cats.data ?? []).find((c) => c.id === o.category_id) ? `${o.type}:${(cats.data ?? []).find((c) => c.id === o.category_id)!.slug}` : ""} className={fld}>
                <option value="" disabled>اختر…</option>
                {Object.entries(ORG_TYPE_LABEL).map(([t, label]) => (
                  <optgroup key={t} label={label}>
                    {(cats.data ?? []).filter((c) => c.org_type === t).map((c) => <option key={c.id} value={`${t}:${c.slug}`}>{c.name_ar}</option>)}
                  </optgroup>
                ))}
              </select>
              <button className={btn}>نقل</button>
            </form>
            <form action={setOrgType.bind(null, o.id)} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">نوع النشاط ({ORG_TYPE_LABEL[o.type]}):</span>
              <select name="type" defaultValue={o.type} className={fld}>
                {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className={btn}>تغيير</button>
              <span className="text-muted">(بيتصفّر التصنيف وصاحب النشاط بيختار تصنيف جديد)</span>
            </form>
            <form action={setFeatured.bind(null, o.id)} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">تمييز بالبحث:</span>
              <input name="days" type="number" min="0" max="366" placeholder="عدد الأيام (0 = إلغاء)" defaultValue={0} className={`${fld} w-40`} />
              <input name="rank" type="number" min="0" max="100" placeholder="الأولوية" defaultValue={promoOf(o.id)?.featured_rank ?? 0} className={`${fld} w-24`} />
              <button className={btn}>حفظ</button>
              {promoOf(o.id)?.featured_until && <span className="text-muted">حتى {promoOf(o.id)!.featured_until!.slice(0, 10)}</span>}
            </form>
            <form action={setGlow.bind(null, o.id)} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">توهج العضوية:</span>
              <select name="color" defaultValue={promoOf(o.id)?.glow_color ?? "gold"} className={fld}>
                {GLOW_COLORS.map((c) => <option key={c} value={c}>{GLOW_NAME[c]}</option>)}
              </select>
              <input name="days" type="number" min="0" max="1100" placeholder="عدد الأيام (0 = إلغاء)" defaultValue={0} className={`${fld} w-40`} />
              <button className={btn}>حفظ</button>
              {promoOf(o.id)?.glow_until && new Date(promoOf(o.id)!.glow_until!) > new Date() && <span className="text-muted">{GLOW_NAME[promoOf(o.id)!.glow_color as keyof typeof GLOW_NAME] ?? ""} حتى {promoOf(o.id)!.glow_until!.slice(0, 10)}</span>}
            </form>
              </div>
            </details></li>))}
          {(orgs.data ?? []).length === 0 && <li className={`${box} text-center text-sm text-muted`}>لا توجد أنشطة مطابقة. جرّب تغيير البحث أو الفلاتر.</li>}</ul>
      {pager}
    </div>
  );
}
