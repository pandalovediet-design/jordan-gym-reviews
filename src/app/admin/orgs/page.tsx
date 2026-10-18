import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { cleanQuery } from "@/lib/format";
import { isOrgType } from "@/lib/queries";
import { setFeatured, setOrgStatus, setVerified } from "../actions";

export const metadata: Metadata = { title: "الأنشطة", robots: { index: false } };
const STATUSES = ["draft", "pending", "published", "suspended"] as const;
const STATUS_LABEL = { draft: "مسودة", pending: "بانتظار المراجعة", published: "منشور", suspended: "موقوف" } as const;

export default async function AdminOrgs({ searchParams }: PageProps<"/admin/orgs">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = cleanQuery(one(sp.q));
  const status = one(sp.status);
  const type = one(sp.type);
  const { supabase } = await requireUser();
  let query = supabase.from("organizations").select("id,name_ar,type,city,status,verified_at,slug").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,city.ilike.%${q}%`);
  if ((STATUSES as readonly string[]).includes(status)) query = query.eq("status", status as (typeof STATUSES)[number]);
  if (isOrgType(type)) query = query.eq("type", type);
  const [orgs, promos, owners, users] = await Promise.all([
    query,
    supabase.from("org_promotions").select("organization_id,featured_until,featured_rank"),
    supabase.from("organization_members").select("organization_id,user_id,role").eq("role", "owner"),
    supabase.rpc("admin_list_users"),
  ]);
  const emailOf = (orgId: string) => {
    const m = (owners.data ?? []).find((x) => x.organization_id === orgId);
    return (users.data ?? []).find((u) => u.id === m?.user_id)?.email ?? null;
  };
  const promoOf = (id: string) => (promos.data ?? []).find((p) => p.organization_id === id);
  const isLive = (id: string) => { const p = promoOf(id); return !!p?.featured_until && new Date(p.featured_until) > new Date(); };
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const fld = "rounded-xl bg-surface px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-accent";
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <h1 className="text-2xl font-extrabold">الأنشطة ({(orgs.data ?? []).length})</h1>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="ابحث بالاسم أو المدينة" className={fld} />
        <select name="status" defaultValue={status} className={fld}><option value="">كل الحالات</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <select name="type" defaultValue={type} className={fld}><option value="">كل الأنواع</option>{Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground">فلترة</button>
      </form>
      <ul className="space-y-2">{(orgs.data ?? []).map((o) => (
          <li key={o.id} className={`${box} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">{o.name_ar} {o.verified_at && <span className="text-accent">✓</span>} {isLive(o.id) && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">مميّز</span>}</p>
              <p className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]} · {o.city} · {STATUS_LABEL[o.status]}</p>
              {emailOf(o.id) && <p className="text-xs text-muted">المالك: <span dir="ltr">{emailOf(o.id)}</span></p>}</div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/${o.id}/overview`} className={`${btn} !bg-accent text-accent-foreground`}>إدارة الحساب</Link>
              {o.status === "published" ? <Link href={`/g/${o.slug}`} className={btn}>الصفحة العامة</Link> : <span className="px-2 py-1 text-xs text-muted">الصفحة العامة بعد النشر</span>}
              <Link href={`/admin/qr/${o.id}/sticker`} className={btn}>ستكر QR</Link>
              {o.status !== "published" && <form action={setOrgStatus.bind(null, o.id, "published")}><button className={`${btn} !bg-accent text-accent-foreground`}>نشر</button></form>}
              {o.status === "published" && <form action={setOrgStatus.bind(null, o.id, "suspended")}><button className={btn}>إيقاف</button></form>}
              <form action={setVerified.bind(null, o.id, !o.verified_at)}><button className={btn}>{o.verified_at ? "إلغاء التوثيق" : "توثيق"}</button></form>
            </div></div>
            <form action={setFeatured.bind(null, o.id)} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">تمييز بالبحث:</span>
              <input name="days" type="number" min="0" max="366" placeholder="عدد الأيام (0 = إلغاء)" defaultValue={0} className="w-40 rounded-lg bg-background px-2 py-1 ring-1 ring-white/10" />
              <input name="rank" type="number" min="0" max="100" placeholder="الأولوية" defaultValue={promoOf(o.id)?.featured_rank ?? 0} className="w-24 rounded-lg bg-background px-2 py-1 ring-1 ring-white/10" />
              <button className={btn}>حفظ</button>
              {promoOf(o.id)?.featured_until && <span className="text-muted">حتى {promoOf(o.id)!.featured_until!.slice(0, 10)}</span>}
            </form></li>))}
          {(orgs.data ?? []).length === 0 && <li className="text-muted">لا توجد أنشطة مطابقة.</li>}</ul>
    </div>
  );
}
