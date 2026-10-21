import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { dateAr } from "@/lib/format";

export const metadata: Metadata = { title: "طلبات الرعاية", robots: { index: false } };

export default async function LeadsAdmin() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("sponsor_leads").select("*").order("created_at", { ascending: false }).limit(200);
  const list = data ?? [];
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">طلبات الرعاة ({list.length})</h1>
      <ul className="space-y-3">
        {list.map((l) => {
          const num = l.phone.replace(/\D/g, "");
          return (
            <li key={l.id} className="space-y-1 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
              <p className="font-semibold">{l.name}{l.company && <span className="text-muted"> — {l.company}</span>} {l.package && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">{l.package}</span>}</p>
              {l.message && <p className="text-sm">{l.message}</p>}
              <p className="text-xs text-muted">{dateAr(l.created_at)} · <span dir="ltr">{l.phone}</span> · <a className="text-accent underline" href={`https://wa.me/${num}`} target="_blank" rel="noopener noreferrer">واتساب</a></p>
            </li>
          );
        })}
        {list.length === 0 && <li className="text-muted">لا توجد طلبات.</li>}
      </ul>
    </div>
  );
}
