import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL } from "@/lib/format";
import Link from "next/link";
import { moderateProduct, setFeatured, setOrgStatus, setVerified } from "./actions";

export const metadata: Metadata = { title: "الإدارة", robots: { index: false } };

export default async function Admin() {
  const { supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) notFound();
  const [orgs, products, promos] = await Promise.all([
    supabase.from("organizations").select("id,name_ar,type,city,status,verified_at,slug").order("created_at", { ascending: false }).limit(100),
    supabase.from("products").select("id,name_ar,brand,organizations(name_ar)").eq("moderation_status", "pending").limit(50),
    supabase.from("org_promotions").select("organization_id,featured_until,featured_rank"),
  ]);
  const promoOf = (id: string) => (promos.data ?? []).find((p) => p.organization_id === id);
  const isLive = (id: string) => { const p = promoOf(id); return !!p?.featured_until && new Date(p.featured_until) > new Date(); };
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <h1 className="text-2xl font-extrabold">لوحة الإدارة</h1>
      <section><h2 className="mb-3 text-lg font-bold">الأنشطة</h2>
        <ul className="space-y-2">{(orgs.data ?? []).map((o) => (
          <li key={o.id} className={`${box} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">{o.name_ar} {o.verified_at && <span className="text-accent">✓</span>} {isLive(o.id) && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">مميّز</span>}</p>
              <p className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]} · {o.city} · {o.status}</p></div>
            <div className="flex flex-wrap gap-2">
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
          {(orgs.data ?? []).length === 0 && <li className="text-muted">لا توجد أنشطة.</li>}</ul></section>
      <section><h2 className="mb-3 text-lg font-bold">منتجات بانتظار الموافقة</h2>
        <ul className="space-y-2">{(products.data ?? []).map((p) => (
          <li key={p.id} className={`${box} flex items-center justify-between gap-3`}>
            <span>{p.name_ar} {p.brand && `· ${p.brand}`} <span className="text-xs text-muted">({p.organizations?.name_ar})</span></span>
            <div className="flex gap-2"><form action={moderateProduct.bind(null, p.id, "approved")}><button className={btn}>اعتماد</button></form>
              <form action={moderateProduct.bind(null, p.id, "rejected")}><button className={btn}>رفض</button></form></div></li>))}
          {(products.data ?? []).length === 0 && <li className="text-muted">ما في شي بالانتظار.</li>}</ul></section>
    </div>
  );
}
