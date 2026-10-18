import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { ORG_TYPE_LABEL, dateAr, isoDaysFromNow, jod, waNumber } from "@/lib/format";
import { addSubscription, deleteSubscription } from "../actions";

export const metadata: Metadata = { title: "الاشتراكات", robots: { index: false } };

export default async function Subscriptions({ searchParams }: PageProps<"/admin/subscriptions">) {
  const sp = await searchParams;
  const filter = (Array.isArray(sp.f) ? sp.f[0] : sp.f) ?? "";
  const { supabase } = await requireUser();
  const [orgs, subs] = await Promise.all([
    supabase.from("organizations").select("id,name_ar,type,status,whatsapp").order("name_ar").limit(500),
    supabase.from("org_subscriptions").select("*").order("period_end", { ascending: false }).limit(2000),
  ]);
  const today = isoDaysFromNow(0).slice(0, 10);
  const in7 = isoDaysFromNow(7).slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const all = subs.data ?? [];
  const revenueTotal = all.reduce((s, x) => s + Number(x.amount_jod), 0);
  const revenueMonth = all.filter((x) => x.paid_at >= monthStart).reduce((s, x) => s + Number(x.amount_jod), 0);
  const rows = (orgs.data ?? []).map((o) => {
    const mine = all.filter((x) => x.organization_id === o.id);
    const end = mine[0]?.period_end ?? null;
    const state: "none" | "expired" | "soon" | "active" = !end ? "none" : end < today ? "expired" : end <= in7 ? "soon" : "active";
    return { o, mine, end, state };
  });
  const LABEL = { none: ["بدون اشتراك", "text-muted"], expired: ["منتهي", "text-red-300"], soon: ["ينتهي قريباً", "text-yellow-300"], active: ["فعّال", "text-accent"] } as const;
  const shown = filter ? rows.filter((r) => r.state === filter) : rows;
  const count = (s: string) => rows.filter((r) => r.state === s).length;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const chip = (k: string, label: string) => (
    <a key={k} href={k ? `?f=${k}` : "?"} className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 ${filter === k ? "bg-accent font-bold text-accent-foreground" : "bg-surface"}`}>{label}</a>
  );
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">اشتراكات الأنشطة</h1>
      <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className={box}><p className="text-2xl font-extrabold text-accent">{jod(revenueMonth)}</p><p className="text-xs text-muted">مقبوضات هالشهر</p></div>
        <div className={box}><p className="text-2xl font-extrabold text-accent">{jod(revenueTotal)}</p><p className="text-xs text-muted">المجموع الكلي</p></div>
        <div className={box}><p className="text-2xl font-extrabold text-accent">{count("active")}</p><p className="text-xs text-muted">اشتراك فعّال</p></div>
        <div className={box}><p className="text-2xl font-extrabold text-yellow-300">{count("soon")}</p><p className="text-xs text-muted">ينتهي خلال 7 أيام</p></div>
      </div>
      <div className="flex flex-wrap gap-2">{chip("", "الكل")}{chip("soon", "ينتهي قريباً")}{chip("expired", "منتهي")}{chip("active", "فعّال")}{chip("none", "بدون اشتراك")}</div>

      <ul className="space-y-3">{shown.map(({ o, mine, end, state }) => {
        const wa = waNumber(o.whatsapp);
        const msg = `مرحبا، اشتراك ${o.name_ar} على Jordan Gym Reviews ${state === "expired" ? "انتهى" : `بنتهي بتاريخ ${end ? dateAr(end) : ""}`}. بتحب نجدده؟`;
        return (
          <li key={o.id} className={box}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-semibold">{o.name_ar}</p><p className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]}{end && ` · حتى ${dateAr(end)}`}</p></div>
              <div className="flex items-center gap-2"><span className={`text-sm ${LABEL[state][1]}`}>{LABEL[state][0]}</span>
                {wa && (state === "soon" || state === "expired") && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className={`${btn} !bg-accent text-accent-foreground`}>تذكير بواتساب</a>}</div>
            </div>
            <details className="mt-3"><summary className="cursor-pointer text-sm text-accent">تسجيل دفعة / السجل ({mine.length})</summary>
              <div className="mt-3 space-y-3">
                <ActionForm action={addSubscription.bind(null, o.id)} submit="تسجيل الدفعة">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input name="plan_name" required placeholder="الباقة (مثلاً: شهري)" className={field} />
                    <input name="amount_jod" type="number" step="0.01" min="0" required placeholder="المبلغ (دينار)" className={field} />
                    <input name="days" type="number" min="1" required placeholder="المدة بالأيام" className={field} />
                  </div>
                  <input name="notes" placeholder="ملاحظات" className={field} />
                </ActionForm>
                <ul className="space-y-1 text-sm">{mine.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-2"><span>{x.plan_name} · {jod(x.amount_jod)} · {dateAr(x.period_start)} ← {dateAr(x.period_end)}</span>
                    <form action={deleteSubscription.bind(null, x.id)}><button className="text-xs text-red-300 underline">حذف</button></form></li>))}</ul>
              </div></details>
          </li>);
      })}
        {shown.length === 0 && <li className="text-muted">لا توجد نتائج.</li>}</ul>
    </div>
  );
}
