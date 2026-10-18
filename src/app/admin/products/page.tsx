import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { moderateProduct } from "../actions";

export const metadata: Metadata = { title: "المنتجات بانتظار الاعتماد", robots: { index: false } };

export default async function ProductsAdmin() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("products").select("id,name_ar,brand,organizations(name_ar)").eq("moderation_status", "pending").limit(100);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-extrabold">منتجات بانتظار الاعتماد</h1>
      <ul className="space-y-2">{(data ?? []).map((p) => (
        <li key={p.id} className={`${box} flex items-center justify-between gap-3`}>
          <span>{p.name_ar} {p.brand && `· ${p.brand}`} <span className="text-xs text-muted">({p.organizations?.name_ar})</span></span>
          <div className="flex gap-2"><form action={moderateProduct.bind(null, p.id, "approved")}><button className={btn}>اعتماد</button></form>
            <form action={moderateProduct.bind(null, p.id, "rejected")}><button className={btn}>رفض</button></form></div></li>))}
        {(data ?? []).length === 0 && <li className="text-muted">ما في شي بالانتظار.</li>}</ul>
    </div>
  );
}
