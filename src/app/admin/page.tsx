import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { moderateProduct, setOrgStatus, setVerified } from "./actions";

export const metadata: Metadata = { title: "الإدارة", robots: { index: false } };

export default async function Admin() {
  const { supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) notFound();
  const [orgs, products] = await Promise.all([
    supabase.from("organizations").select("id,name_ar,type,city,status,verified_at,slug").order("created_at", { ascending: false }).limit(100),
    supabase.from("products").select("id,name_ar,brand,organizations(name_ar)").eq("moderation_status", "pending").limit(50),
  ]);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <h1 className="text-2xl font-extrabold">لوحة الإدارة</h1>
      <section><h2 className="mb-3 text-lg font-bold">الأنشطة</h2>
        <ul className="space-y-2">{(orgs.data ?? []).map((o) => (
          <li key={o.id} className={`${box} flex flex-wrap items-center justify-between gap-3`}>
            <div><p className="font-semibold">{o.name_ar} {o.verified_at && <span className="text-accent">✓</span>}</p>
              <p className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]} · {o.city} · {o.status}</p></div>
            <div className="flex gap-2">
              {o.status !== "published" && <form action={setOrgStatus.bind(null, o.id, "published")}><button className={`${btn} !bg-accent text-accent-foreground`}>نشر</button></form>}
              {o.status === "published" && <form action={setOrgStatus.bind(null, o.id, "suspended")}><button className={btn}>إيقاف</button></form>}
              <form action={setVerified.bind(null, o.id, !o.verified_at)}><button className={btn}>{o.verified_at ? "إلغاء التوثيق" : "توثيق"}</button></form>
            </div></li>))}
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
