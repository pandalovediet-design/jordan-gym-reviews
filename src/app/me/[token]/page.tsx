import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createPublicClient } from "@/lib/supabase/public";
import { dateAr, waNumber } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { SectionPrintButton as PrintButton } from "@/components/SectionPrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/me/[token]">): Promise<Metadata> {
  const { token } = await params;
  return { title: "عضويتي", robots: { index: false, follow: false }, manifest: `/me/${token}/manifest.webmanifest` };
}

const visit = (iso: string) => new Intl.DateTimeFormat("ar-JO", { timeZone: "Asia/Amman", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export default async function MemberPage({ params }: PageProps<"/me/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const db = createPublicClient();
  const [{ data }, { data: programs }, { data: visits }, { data: files }] = await Promise.all([
    db.rpc("get_member_page", { p_token: token }),
    db.rpc("get_member_programs", { p_token: token }),
    db.rpc("get_member_attendance", { p_token: token }),
    db.rpc("get_member_files", { p_token: token }),
  ]);
  const m = data?.[0];
  if (!m) notFound();
  const qr = await QRCode.toString(`${await siteUrl()}/c/${token}`, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#07211c", light: "#ffffff" } });
  const wa = waNumber(m.org_whatsapp);
  const left = m.days_left;
  const [chip, chipTone] = left < 0 ? ["منتهي", "bg-red-500/20 text-red-200"] : left <= 7 ? ["ينتهي قريباً", "bg-yellow-400/20 text-yellow-200"] : ["فعّال", "bg-accent text-accent-foreground"];
  const workout = (programs ?? []).filter((p) => p.kind === "workout");
  const nutrition = (programs ?? []).filter((p) => p.kind === "nutrition");
  const monthCount = Number(visits?.[0]?.month_count ?? 0);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const tile = "rounded-2xl bg-surface p-4 text-center ring-1 ring-white/10";
  const program = (kindLabel: string, icon: string, list: typeof workout, id: string) => (
    <section id={id} data-sec className={box}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{icon} {kindLabel}</h2>
        {list.length > 0 && <PrintButton target={id} label="تنزيل PDF" />}
      </div>
      {list.length === 0 ? <p className="text-sm text-muted">لسا ما أضاف لك مدربك {kindLabel}.</p> : list.map((p, i) => (
        <div key={i} className={i > 0 ? "mt-5 border-t border-white/10 pt-4" : ""}>
          <p className="text-sm font-semibold">{p.title} <span className="text-xs font-normal text-muted">· {dateAr(p.created_at)}</span></p>
          <div className="mt-2 whitespace-pre-line leading-8">{p.body}</div>
        </div>))}
    </section>
  );
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <section id="sec-hero" data-sec className="rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.03] p-5 ring-1 ring-white/10">
        <div className="flex items-start gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-2xl font-extrabold text-accent-foreground ring-4 ring-white/10">{m.member_name.trim().charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold">{m.member_name}</h1>
            <p className="text-sm text-muted">{m.org_name}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${chipTone}`}>{chip}</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">{m.plan_name ? `${m.plan_name} · ` : ""}ينتهي {dateAr(m.ends_on)}</p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <div className={tile}><p className={`text-2xl font-extrabold ${left < 0 ? "text-red-300" : "text-accent"}`}>{left < 0 ? 0 : left}</p><p className="text-xs text-muted">يوم باقي</p></div>
        <div className={tile}><p className="text-2xl font-extrabold text-accent">{monthCount}</p><p className="text-xs text-muted">حضور هالشهر</p></div>
        <div className={tile}><p className="text-sm font-bold text-accent">{visits?.[0] ? new Intl.DateTimeFormat("ar-JO", { timeZone: "Asia/Amman", day: "numeric", month: "short" }).format(new Date(visits[0].checked_in_at)) : "—"}</p><p className="mt-1 text-xs text-muted">آخر زيارة</p></div>
      </div>

      <section id="sec-qr" data-sec className={`${box} text-center`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">رمز الدخول للنادي</p>
          <PrintButton target="sec-qr" label="تنزيل PDF" />
        </div>
        <div className="mx-auto w-56 rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="mt-3 text-sm font-bold">{m.member_name} · {m.org_name}</p>
        <p className="mt-1 text-xs text-muted">وريه للموظف عند الدخول، ولا تشاركه مع حدا.</p>
      </section>

      {m.coach_note && (
        <section data-sec className={`${box} border-r-4 border-accent`}>
          <h2 className="mb-1 text-sm font-bold text-accent">💬 ملاحظة من المدرب</h2>
          <p className="whitespace-pre-line leading-7">{m.coach_note}</p>
        </section>
      )}

      {program("برنامج التمرين", "🏋️", workout, "sec-workout")}
      {program("البرنامج الغذائي", "🥗", nutrition, "sec-nutrition")}

      {(files ?? []).length > 0 && (
        <section data-sec className={box}>
          <h2 className="mb-3 text-lg font-bold">📄 ملفاتي</h2>
          <ul className="space-y-2">{(files ?? []).map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{f.title} <span className="text-xs text-muted">· {dateAr(f.created_at)}</span></span>
              <a href={`/me/${token}/file/${f.id}`} className="no-print shrink-0 rounded-lg bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">تنزيل</a>
            </li>))}</ul>
        </section>
      )}

      <section data-sec className={box}>
        <h2 className="mb-3 text-lg font-bold">🗓️ سجل حضوري</h2>
        {(visits ?? []).length === 0 ? <p className="text-sm text-muted">ما في زيارات مسجّلة بعد.</p> : (
          <ul className="space-y-2 text-sm">{(visits ?? []).map((v, i) => <li key={i} className="flex items-center gap-2"><span className="text-accent">●</span>{visit(v.checked_in_at)}</li>)}</ul>
        )}
      </section>

      {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`مرحباً، أنا ${m.member_name}`)}`} target="_blank" rel="noopener noreferrer" className="no-print block rounded-xl bg-green-600 py-3 text-center font-bold text-white">راسل ناديك على واتساب</a>}
      <p className="no-print text-center text-xs text-muted">ثبّت هالصفحة على جوالك: أندرويد «تثبيت»، آيفون: مشاركة ← «إضافة إلى الشاشة الرئيسية».</p>
    </div>
  );
}
