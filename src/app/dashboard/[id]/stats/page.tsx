import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ammanDate, isoDaysFromNow } from "@/lib/format";

export const metadata: Metadata = { title: "الإحصائيات", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;
const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ar = (n: number) => n.toLocaleString("ar-JO-u-nu-latn");
type Ev = { event_type: string; created_at: string };
/** Amman wall-clock parts of an ISO timestamp (UTC+3, no DST). */
const amman = (iso: string) => new Date(+new Date(iso) + 3 * 3_600_000);

export default async function Stats({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,name_ar").eq("id", id).maybeSingle();
  if (!org) notFound();

  // PostgREST caps a response at ~1000 rows, so read the last 30 days page by page (up to 10 000 events).
  const since = isoDaysFromNow(-30);
  const ev: Ev[] = [];
  for (let from = 0; from < 10_000; from += 1000) {
    const { data } = await supabase.from("analytics_events").select("event_type,created_at").eq("organization_id", id).gte("created_at", since).order("created_at").range(from, from + 999);
    ev.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  const of = (t: string) => ev.filter((e) => e.event_type === t);
  const views = of("page_view");
  const contacts = [...of("whatsapp_click"), ...of("phone_click")];
  const qrVisits = of("qr_visit");

  // last 30 Amman days, oldest first
  const days = Array.from({ length: 30 }, (_, i) => ammanDate(i - 29));
  const perDay = (list: Ev[]) => days.map((d) => list.filter((e) => amman(e.created_at).toISOString().slice(0, 10) === d).length);
  const vSeries = perDay(views), cSeries = perDay(contacts);
  const maxV = Math.max(1, ...vSeries);

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const wk = (s: number[]) => ({ now: sum(s.slice(-7)), before: sum(s.slice(-14, -7)) });
  const trend = (s: number[]) => {
    const { now, before } = wk(s);
    if (!before) return now ? "جديد" : "—";
    const p = Math.round(((now - before) / before) * 100);
    return p === 0 ? "نفس الأسبوع الماضي" : `${p > 0 ? "▲" : "▼"} ${ar(Math.abs(p))}٪ عن الأسبوع الماضي`;
  };

  const byHour = Array.from({ length: 24 }, (_, h) => views.filter((e) => amman(e.created_at).getUTCHours() === h).length);
  const byDow = Array.from({ length: 7 }, (_, d) => views.filter((e) => amman(e.created_at).getUTCDay() === d).length);
  const peakH = byHour.indexOf(Math.max(...byHour)), peakD = byDow.indexOf(Math.max(...byDow));
  const rate = views.length ? Math.round((contacts.length / views.length) * 100) : 0;
  const maxH = Math.max(1, ...byHour), maxD = Math.max(1, ...byDow);
  const hourLabel = (h: number) => `${ar(h % 12 === 0 ? 12 : h % 12)} ${h < 12 ? "ص" : "م"}`;

  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link href={`/dashboard/${id}/overview`} className="text-sm text-muted underline">← نظرة عامة</Link>
      <h1 className="text-2xl font-extrabold">📊 إحصائيات {org.name_ar}</h1>
      <p className="text-xs text-muted">آخر 30 يوم، بتوقيت عمّان. بنحسب مشاهدات الصفحة والنقر على واتساب أو الاتصال. ما بنسجّل أسماء ولا أرقام الزوار.</p>

      <section className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
        <div className={box}><p className="text-2xl font-extrabold text-accent">{ar(views.length)}</p><p className="text-xs text-muted">مشاهدة</p></div>
        <div className={box}><p className="text-2xl font-extrabold text-accent">{ar(of("whatsapp_click").length)}</p><p className="text-xs text-muted">نقرة واتساب</p></div>
        <div className={box}><p className="text-2xl font-extrabold text-accent">{ar(of("phone_click").length)}</p><p className="text-xs text-muted">نقرة اتصال</p></div>
        <div className={box}><p className="text-2xl font-extrabold text-accent">{ar(qrVisits.length)}</p><p className="text-xs text-muted">زيارات QR</p></div>
        <div className={box}><p className="text-2xl font-extrabold text-accent">{ar(rate)}٪</p><p className="text-xs text-muted">من الزوار تواصلوا</p></div>
      </section>

      <section className={`${box} space-y-1`}>
        <p className="text-sm">المشاهدات هالأسبوع: <b>{ar(wk(vSeries).now)}</b> <span className="text-xs text-muted">({trend(vSeries)})</span></p>
        <p className="text-sm">التواصل هالأسبوع: <b>{ar(wk(cSeries).now)}</b> <span className="text-xs text-muted">({trend(cSeries)})</span></p>
      </section>

      <section className={box}>
        <h2 className="mb-3 font-bold">المشاهدات يومياً</h2>
        <div className="flex h-28 items-end gap-[3px]" role="img" aria-label="مخطط المشاهدات اليومية لآخر 30 يوم">
          {vSeries.map((v, i) => (
            <div key={days[i]} title={`${days[i]}: ${v} مشاهدة، ${cSeries[i]} تواصل`} className="flex flex-1 flex-col justify-end">
              <div className="rounded-sm bg-accent/80" style={{ height: `${(v / maxV) * 100}%`, minHeight: v ? 3 : 0 }} />
            </div>))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted"><span>قبل 30 يوم</span><span>اليوم</span></div>
      </section>

      {views.length >= 10 ? (
        <section className={`${box} space-y-4`}>
          <p className="text-sm">أنشط وقت: <b>{DAYS[peakD]}</b> حوالي الساعة <b>{hourLabel(peakH)}</b>. هاد أحسن وقت تنزل فيه عرض أو ستوري.</p>
          <div><p className="mb-1 text-xs text-muted">حسب الساعة</p>
            <div className="flex h-16 items-end gap-[2px]">{byHour.map((v, h) => <div key={h} title={`${hourLabel(h)}: ${v}`} className="flex-1 rounded-sm bg-white/25" style={{ height: `${(v / maxH) * 100}%`, minHeight: v ? 2 : 0 }} />)}</div></div>
          <div><p className="mb-1 text-xs text-muted">حسب اليوم</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">{byDow.map((v, d) => (
              <div key={d}><div className="flex h-12 items-end"><div className="w-full rounded-sm bg-white/25" style={{ height: `${(v / maxD) * 100}%`, minHeight: v ? 2 : 0 }} /></div><p className="mt-1 text-muted">{DAYS[d].slice(0, 3)}</p></div>))}</div></div>
        </section>
      ) : (
        <p className={`${box} text-sm text-muted`}>لسا الأرقام قليلة. لما توصل 10 مشاهدات بنحسبلك أنشط وقت وأحسن يوم.</p>
      )}
      <p className="text-xs text-muted">نصيحة: كرت المشاركة وستكر QR بيزيدوا المشاهدات. دوّر عليهم بصفحتك العامة ولوحة «نظرة عامة».</p>
    </div>
  );
}
