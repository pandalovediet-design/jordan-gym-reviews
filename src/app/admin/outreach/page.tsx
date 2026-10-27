import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL, cleanQuery, dateAr } from "@/lib/format";
import { waNumber } from "@/lib/phone";
import { getSiteSettings } from "@/lib/site-settings";
import { siteUrl } from "@/lib/site";
import { approveClaim, rejectClaim, setOutreach } from "./actions";

export const metadata: Metadata = { title: "التواصل والاستلام", robots: { index: false } };

const PAGE = 50;
const STATES = [["todo", "لسا ما راسلتهم"], ["done", "راسلتهم"], ["all", "الكل"]] as const;

export default async function Outreach({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = cleanQuery(one(sp.q));
  const state = (["todo", "done", "all"] as const).find((s) => s === one(sp.state)) ?? "todo";
  const waOnly = one(sp.wa) !== "0";
  const page = Math.max(1, Math.floor(Number(one(sp.p)) || 1));
  const { supabase } = await requireUser();

  let query = supabase.from("organizations")
    .select("id,name_ar,slug,type,city,area,phone,outreach_at", { count: "exact" })
    .eq("is_claimed", false).eq("status", "published")
    .order("city").order("area").order("name_ar")
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (state === "todo") query = query.is("outreach_at", null);
  if (state === "done") query = query.not("outreach_at", "is", null);
  if (waOnly) query = query.like("phone", "+9627%");
  if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,area.ilike.%${q}%,city.ilike.%${q}%`);

  const [orgs, claims, users, cfg, base, todoCount, doneCount] = await Promise.all([
    query,
    supabase.from("claim_requests").select("id,organization_id,user_id,contact_name,phone,role,note,created_at,organizations(name_ar,slug,city,area)").eq("status", "pending").order("created_at"),
    supabase.rpc("admin_list_users"),
    getSiteSettings(),
    siteUrl(),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("is_claimed", false).is("outreach_at", null),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("is_claimed", false).not("outreach_at", "is", null),
  ]);
  const emailOf = (id: string) => (users.data ?? []).find((u) => u.id === id)?.email ?? "";
  const pendingOrgs = new Set((claims.data ?? []).map((c) => c.organization_id));
  const message = (o: { name_ar: string; slug: string }) =>
    cfg.outreachTemplate.replaceAll("{name}", o.name_ar).replaceAll("{page}", `${base}/g/${o.slug}`).replaceAll("{claim}", `${base}/claim/${o.slug}`);
  const total = orgs.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (over: Record<string, string>) => ({ pathname: "/admin/outreach", query: { state, ...(q ? { q } : {}), ...(waOnly ? {} : { wa: "0" }), ...over } });

  const box = "rounded-2xl bg-surface p-4 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20";
  const pill = (on: boolean) => `rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 ${on ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`;
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold">📞 التواصل والاستلام</h1>
        <p className="mt-1 text-sm text-muted">راسل النوادي اللي لسا ما استلمت صفحاتها. كل رسالة فيها رابط صفحة النادي ورابط الاستلام، وصاحب النادي بيسجّل وبيبعت طلب، وإنت بتوافق من فوق. نص الرسالة بتغيّره من <Link href="/admin/settings" className="underline">إعدادات الموقع</Link>.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">طلبات الاستلام ({(claims.data ?? []).length})</h2>
        {(claims.data ?? []).length === 0 && <p className={`${box} text-sm text-muted`}>ما في طلبات هسا. أول ما حدا يطلب، بيوصلك تنبيه على تيليجرام وبيطلع هون.</p>}
        <ul className="space-y-2">
          {(claims.data ?? []).map((c) => {
            const wa = waNumber(c.phone);
            return (
              <li key={c.id} className={`${box} space-y-2 ring-accent/50`}>
                <p className="font-bold">{c.organizations?.name_ar} <span className="text-xs font-normal text-muted">{[c.organizations?.city, c.organizations?.area].filter(Boolean).join("، ")}</span></p>
                <p className="text-sm">{c.contact_name}{c.role ? ` · ${c.role}` : ""} · <span dir="ltr">{c.phone}</span> · <span dir="ltr" className="text-muted">{emailOf(c.user_id)}</span></p>
                {c.note && <p className="text-sm text-muted">«{c.note}»</p>}
                <p className="text-xs text-muted">{dateAr(c.created_at)}</p>
                <div className="flex flex-wrap gap-2">
                  {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={`${btn} !bg-green-600 text-white`}>💬 تأكد منه واتساب</a>}
                  {c.organizations && <Link href={`/g/${c.organizations.slug}`} className={btn}>صفحة النادي</Link>}
                  <form action={approveClaim.bind(null, c.id)}><button className={`${btn} !bg-accent font-bold text-accent-foreground`}>✔ موافق، سلّمه الصفحة</button></form>
                  <form action={rejectClaim.bind(null, c.id)}><button className={btn}>✕ رفض</button></form>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted">قبل الموافقة تأكد إنه فعلاً صاحب النادي، مثلاً اتصل على رقم النادي المسجّل بالصفحة.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">النوادي غير المستلمة</h2>
        <nav className="flex flex-wrap gap-2" aria-label="الحالة">
          {STATES.map(([k, label]) => (
            <Link key={k} href={{ pathname: "/admin/outreach", query: { state: k, ...(q ? { q } : {}), ...(waOnly ? {} : { wa: "0" }) } }} className={pill(state === k)}>
              {label}{k === "todo" ? ` (${todoCount.count ?? 0})` : k === "done" ? ` (${doneCount.count ?? 0})` : ""}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="state" value={state} />
          <input name="q" defaultValue={q} placeholder="ابحث بالاسم أو المنطقة" className="rounded-xl bg-surface px-3 py-2 ring-1 ring-white/10 outline-none focus:ring-accent" />
          <label className="flex items-center gap-2"><input type="checkbox" name="wa" value="1" defaultChecked={waOnly} /> اللي إلهم رقم موبايل بس</label>
          <input type="hidden" name="wa" value="0" />
          <button className="rounded-xl bg-accent px-5 py-2 font-bold text-accent-foreground">بحث</button>
        </form>
        <p className="text-sm text-muted">{total} نادي{pages > 1 ? ` · صفحة ${page} من ${pages}` : ""}</p>
        <ul className="space-y-2">
          {(orgs.data ?? []).map((o) => {
            const wa = waNumber(o.phone);
            const msg = message(o);
            return (
              <li key={o.id} className={`${box} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="font-semibold">{o.name_ar} {pendingOrgs.has(o.id) && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">طلب استلام</span>}</p>
                  <p className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]} · {[o.city, o.area].filter(Boolean).join("، ")}{o.phone && <> · <span dir="ltr">{o.phone}</span></>}</p>
                  {o.outreach_at && <p className="text-xs text-accent">راسلته {dateAr(o.outreach_at)}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className={`${btn} !bg-green-600 font-bold text-white`}>💬 واتساب</a>}
                  <CopyButton text={msg} label="📋 نسخ الرسالة" className={btn} />
                  <CopyButton text={`${base}/claim/${o.slug}`} label="🔗 رابط الاستلام" className={btn} />
                  <Link href={`/g/${o.slug}`} className={btn}>صفحته</Link>
                  {o.outreach_at
                    ? <form action={setOutreach.bind(null, o.id, false)}><button className={btn}>↩ لسا</button></form>
                    : <form action={setOutreach.bind(null, o.id, true)}><button className={`${btn} !bg-accent font-bold text-accent-foreground`}>✔ راسلته</button></form>}
                </div>
              </li>
            );
          })}
          {(orgs.data ?? []).length === 0 && <li className={`${box} text-sm text-muted`}>ما في نوادي بهالفلتر.</li>}
        </ul>
        {pages > 1 && (
          <nav className="flex items-center justify-center gap-2 text-sm">
            {page > 1 && <Link href={href({ p: String(page - 1) })} className={pill(false)}>→ السابق</Link>}
            <span className="text-muted">{page} / {pages}</span>
            {page < pages && <Link href={href({ p: String(page + 1) })} className={pill(false)}>التالي ←</Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
