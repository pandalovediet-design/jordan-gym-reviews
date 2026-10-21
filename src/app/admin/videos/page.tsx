import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateAr } from "@/lib/format";
import { PLATFORM_LABEL, type Platform } from "@/lib/video";
import { ActionForm, field } from "@/components/Form";
import { addReviewVideo, adminDeleteVideo, clearVideoReports, setVideoStatus } from "../actions";

export const metadata: Metadata = { title: "الفيديو", robots: { index: false } };

export default async function VideosAdmin() {
  const { supabase } = await requireUser();
  const [{ data: vids }, { data: reps }, { data: orgs }] = await Promise.all([
    supabase.from("videos").select("*,organizations(slug,name_ar)").order("created_at", { ascending: false }).limit(200),
    supabase.from("video_reports").select("video_id,reason").limit(500),
    supabase.from("organizations").select("slug,name_ar,city").eq("status", "published").order("name_ar").limit(1000),
  ]);
  const rc = new Map<string, string[]>();
  for (const r of reps ?? []) rc.set(r.video_id, [...(rc.get(r.video_id) ?? []), r.reason ?? "بدون سبب"]);
  const list = vids ?? [];
  const pending = list.filter((v) => v.status === "pending");
  const rest = list.filter((v) => v.status !== "pending");
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  const row = (v: (typeof list)[number]) => {
    const r = rc.get(v.id) ?? [];
    return (
      <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-semibold">{v.title_ar ?? "بدون عنوان"} <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{v.kind === "review" ? "مراجعة" : "ريل"} · {PLATFORM_LABEL[v.platform as Platform]} · {v.status}</span></p>
          <p className="text-xs text-muted">{v.organizations?.name_ar} · {dateAr(v.created_at)} · {v.views} مشاهدة</p>
          <a href={v.url} target="_blank" rel="noopener noreferrer" dir="ltr" className="block truncate text-xs text-accent underline">{v.url}</a>
          {r.length > 0 && <p className="text-sm text-red-200">🚩 {r.length} بلاغ: {r.slice(0, 3).join(" / ")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {v.organizations && <Link href={`/g/${v.organizations.slug}`} className={btn}>الصفحة</Link>}
          {v.status !== "approved" && <form action={setVideoStatus.bind(null, v.id, "approved")}><button className={`${btn} !bg-accent text-accent-foreground`}>موافقة</button></form>}
          {v.status === "pending" && <form action={setVideoStatus.bind(null, v.id, "rejected")}><button className={btn}>رفض</button></form>}
          {r.length > 0 && <form action={clearVideoReports.bind(null, v.id)}><button className={btn}>مسح البلاغات</button></form>}
          <form action={adminDeleteVideo.bind(null, v.id)}><button className={`${btn} !bg-red-500/30`}>حذف</button></form>
        </div>
      </li>
    );
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">الفيديو</h1>
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-lg font-bold">➕ مراجعة جديدة (بتظهر فوراً)</h2>
        <ActionForm action={addReviewVideo} submit="نشر المراجعة">
          <input name="slug" required list="orgs" dir="ltr" placeholder="ابدأ باسم النادي واختر من القائمة" className={field} />
          <datalist id="orgs">{(orgs ?? []).map((o) => <option key={o.slug} value={o.slug}>{o.name_ar} — {o.city}</option>)}</datalist>
          <input name="url" required dir="ltr" placeholder="رابط الفيديو (يوتيوب / إنستغرام / تيك توك / فيسبوك)" className={field} />
          <input name="title" maxLength={80} placeholder="عنوان قصير (اختياري)" className={field} />
        </ActionForm>
      </section>
      <section><h2 className="mb-3 text-lg font-bold">بانتظار الموافقة ({pending.length})</h2><ul className="space-y-3">{pending.map(row)}{pending.length === 0 && <li className="text-muted">ما في شي.</li>}</ul></section>
      <section><h2 className="mb-3 text-lg font-bold">باقي الفيديوهات</h2><ul className="space-y-3">{rest.map(row)}{rest.length === 0 && <li className="text-muted">ما في فيديوهات.</li>}</ul></section>
    </div>
  );
}
