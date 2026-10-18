import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm, field } from "@/components/Form";
import { domainsEnabled } from "@/lib/vercel-domains";
import { connectDomain, disconnectDomain, verifyDomainAction } from "../../domain-actions";

export const metadata: Metadata = { title: "الدومين الخاص", robots: { index: false } };

type Rec = { type: string; domain: string; value: string };

export default async function DomainPage({ params }: PageProps<"/dashboard/[id]/domain">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,slug").eq("id", id).maybeSingle();
  if (!org) notFound();
  const { data: dom } = await supabase.from("org_domains").select("*").eq("organization_id", id).maybeSingle();
  const enabled = domainsEnabled();
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const recs = Array.isArray(dom?.verification) ? (dom.verification as Rec[]) : [];
  const code = "rounded bg-background px-2 py-1 text-xs";
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">الدومين الخاص</h1>
      <p className="text-sm text-muted">إذا اشتريت دومين (مثل myGym.com) بتقدر تربطه بصفحتك، وتضل صفحتك على رابط المنصة كمان. الستكر المطبوع بيضل شغّال في الحالتين.</p>
      {!enabled && <p className="rounded-xl bg-yellow-400/15 p-3 text-sm text-yellow-100">ربط الدومين الخاص غير مفعّل بعد. بيتفعّل لما تربط إدارة المنصة دومينها الرئيسي.</p>}

      {enabled && !dom && (
        <section className={box}>
          <ActionForm action={connectDomain.bind(null, id)} submit="ربط الدومين">
            <input name="domain" required placeholder="mygym.com" dir="ltr" className={field} />
          </ActionForm>
        </section>
      )}

      {dom && (
        <section className={`${box} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold" dir="ltr">{dom.domain}</p>
            <span className={`rounded-full px-3 py-1 text-xs ${dom.status === "verified" ? "bg-accent text-accent-foreground" : "bg-white/10"}`}>{dom.status === "verified" ? "مربوط وشغّال" : "بانتظار ضبط DNS"}</span>
          </div>
          {dom.status !== "verified" && (
            <div className="space-y-3 text-sm">
              <p>افتح لوحة مزوّد الدومين (حيث اشتريته) وأضف هالسجلات، وبعدها اضغط «تحقق». ممكن ياخد من دقائق لعدة ساعات.</p>
              <ul className="space-y-2">
                <li>دومين رئيسي (مثل mygym.com): سجل <span className={code}>A</span> الاسم <span className={code}>@</span> القيمة <span className={code} dir="ltr">76.76.21.21</span></li>
                <li>دومين فرعي (مثل www.mygym.com): سجل <span className={code}>CNAME</span> القيمة <span className={code} dir="ltr">cname.vercel-dns.com</span></li>
                {recs.map((r, i) => <li key={i}>سجل إثبات الملكية: <span className={code}>{r.type}</span> الاسم <span className={code} dir="ltr">{r.domain}</span> القيمة <span className={code} dir="ltr">{r.value}</span></li>)}
              </ul>
              <form action={verifyDomainAction.bind(null, id)}><button className="rounded-xl bg-accent px-5 py-2 font-bold text-accent-foreground">تحقق</button></form>
            </div>
          )}
          <form action={disconnectDomain.bind(null, id)}><button className="text-sm text-red-300 underline">فصل الدومين</button></form>
        </section>
      )}
    </div>
  );
}
