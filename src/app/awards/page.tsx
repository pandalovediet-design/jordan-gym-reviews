import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { searchOrgs } from "@/lib/queries";
import { ammanMonthStart } from "@/lib/format";
import { castVote } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "نادي الشهر ومدرب الشهر",
  description: "صوّت لأفضل نادي ومدرب مستقل في الأردن هالشهر. صوت واحد لكل حساب بكل فئة.",
  alternates: { canonical: "/awards" },
};

const ERR: Record<string, string> = {
  new: "حسابك جديد: بتقدر تصوّت بعد 24 ساعة من إنشائه (عشان نمنع التصويت الوهمي).",
  own: "ما بتقدر تصوّت لنشاطك.",
  fail: "تعذّر التصويت، جرّب مرة ثانية.",
};
const CATS = [["gym", "🏋️ نادي الشهر", "gym"], ["coach", "🧑‍🏫 مدرب الشهر", "independent_coach"]] as const;

export default async function Awards({ searchParams }: PageProps<"/awards">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const err = one(sp.err), ok = one(sp.ok);
  const q = (one(sp.q) ?? "").slice(0, 60);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: mine } = auth.user ? await supabase.from("monthly_votes").select("category,nominee_org_id").eq("voter_id", auth.user.id) : { data: [] };
  const pub = createPublicClient();
  const prev = ammanMonthStart(-1);
  const blocks = await Promise.all(CATS.map(async ([cat, title, type]) => {
    const [{ data: top }, { data: last }, nominees] = await Promise.all([
      pub.rpc("get_vote_results", { p_category: cat }),
      pub.rpc("get_vote_results", { p_category: cat, p_month: prev }),
      searchOrgs({ type, q, page: 1 }).catch(() => ({ total: 0, items: [] })),
    ]);
    return { cat, title, top: top ?? [], winner: last?.[0] ?? null, nominees: nominees.items };
  }));
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">🏆 نادي الشهر ومدرب الشهر</h1>
      <p className="mt-2 text-muted">صوت واحد لكل فئة بالشهر. بتقدر تغيّر صوتك بأي وقت قبل نهاية الشهر. الفايز بياخد شارة على صفحته.</p>
      {ok && <p className="mt-4 rounded-xl bg-accent/15 px-4 py-2 text-accent">تم تسجيل صوتك 💚</p>}
      {err && <p role="alert" className="mt-4 rounded-xl bg-red-500/15 px-4 py-2 text-red-200">{ERR[err] ?? ERR.fail}</p>}
      {!auth.user && <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm ring-1 ring-white/10">لازم <Link href="/login?next=/awards" className="text-accent underline">تسجّل دخول</Link> أو <Link href="/login?mode=signup" className="text-accent underline">تنشئ حساب</Link> عشان تصوّت.</p>}
      <form className="mt-5 flex gap-2" action="/awards">
        <input name="q" defaultValue={q} placeholder="دوّر على نادي أو مدرب بالاسم" className="w-full rounded-xl bg-surface px-4 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent" />
        <button className="rounded-xl bg-accent px-5 font-bold text-accent-foreground">بحث</button>
      </form>
      {blocks.map((b) => {
        const myVote = (mine ?? []).find((v) => v.category === b.cat)?.nominee_org_id;
        return (
          <section key={b.cat} className="mt-8">
            <h2 className="text-xl font-bold">{b.title}</h2>
            {b.winner && <p className="mt-1 text-sm text-accent">👑 فايز الشهر الماضي: <Link href={`/g/${b.winner.slug}`} className="underline">{b.winner.name_ar}</Link></p>}
            {b.top.length > 0 && (
              <ol className="mt-3 space-y-1 rounded-2xl bg-surface p-4 text-sm ring-1 ring-white/10">{b.top.map((t, i) => (
                <li key={t.slug} className="flex justify-between"><span>{i + 1}. <Link href={`/g/${t.slug}`} className="hover:text-accent">{t.name_ar}</Link> <span className="text-muted">· {t.city}</span></span><span className="text-accent">{Number(t.votes)} صوت</span></li>))}</ol>)}
            <h3 className="mb-2 mt-5 text-sm text-muted">اختار مرشحك</h3>
            <ul className="grid gap-2 sm:grid-cols-2">{b.nominees.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3 ring-1 ring-white/10">
                <span className="min-w-0 truncate text-sm">{o.name_ar} <span className="text-muted">· {o.city}</span></span>
                <form action={castVote.bind(null, b.cat, o.id)}>
                  <button disabled={myVote === o.id} className="shrink-0 rounded-lg bg-accent px-3 py-1 text-xs font-bold text-accent-foreground disabled:opacity-50">{myVote === o.id ? "صوتك ✓" : "صوّت"}</button>
                </form></li>))}
              {b.nominees.length === 0 && <li className="text-sm text-muted">ما في نتائج.</li>}</ul>
          </section>);
      })}
    </div>
  );
}
