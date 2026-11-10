import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { MemberProfileForm } from "./MemberProfileForm";
import { ActivityHeatmap, type DayActivity } from "@/components/ActivityHeatmap";
import { isHealthyDay, isMeal, isRating, type FoodLog } from "@/lib/food-log";
import { addDays, ammanToday } from "@/lib/workout-log";

export const metadata: Metadata = { title: "حسابي الرياضي", robots: { index: false } };

const spaces = [
  { href: "/favorites", icon: "♡", title: "نواديي المفضلة", note: "ارجع للأماكن والعروض اللي حفظتها", tone: "from-rose-500/20 to-transparent" },
  { href: "/log", icon: "🔥", title: "سجل تماريني", note: "سجّل تمرينك والعضلات اللي اشتغلت عليها", tone: "from-orange-500/20 to-transparent" },
  { href: "/food", icon: "🥗", title: "سجل أكلي", note: "سجّل وجباتك بضغطة، بدون عدّ سعرات", tone: "from-emerald-500/20 to-transparent" },
  { href: "/exercises", icon: "💪", title: "مكتبة التمارين", note: "اكتشف التمارين والعضلات المستهدفة", tone: "from-lime-400/20 to-transparent" },
  { href: "/deals", icon: "🎟️", title: "العروض والخصومات", note: "اكتشف التوفير في الأنشطة الرياضية", tone: "from-violet-500/20 to-transparent" },
  { href: "/reels", icon: "🎬", title: "الفيديوهات الرياضية", note: "شاهد محتوى من مجتمع الرياضة", tone: "from-sky-500/20 to-transparent" },
  { href: "/tools", icon: "🧮", title: "أدواتي الرياضية", note: "حاسبات وأدوات تساعدك في رحلتك", tone: "from-emerald-500/20 to-transparent" },
  { href: "/challenges", icon: "🏆", title: "التحديات والإنجازات", note: "شارك بتحديات أسبوعية وتابع تقدمك", tone: "from-amber-500/20 to-transparent" },
];

export default async function Account() {
  const { user, supabase } = await requireUser();
  const { count: unreadCount } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  const unread = unreadCount ?? 0;
  const today = ammanToday();
  const since = addDays(today, -190);
  const [workouts, meals] = await Promise.all([
    supabase.from("user_workout_logs").select("workout_date").eq("user_id", user.id).gte("workout_date", since),
    supabase.from("user_food_logs").select("log_date,meal,rating").eq("user_id", user.id).gte("log_date", since),
  ]);
  // The map is optional: if the member tables are not there yet, the page still renders.
  const activity: Record<string, DayActivity> = {};
  for (const w of workouts.data ?? []) activity[w.workout_date] = { workout: true, healthy: false };
  const food: FoodLog = {};
  for (const m of meals.data ?? []) if (isMeal(m.meal) && isRating(m.rating)) (food[m.log_date] ??= {})[m.meal] = { note: "", rating: m.rating };
  for (const [date, day] of Object.entries(food)) if (isHealthyDay(day)) activity[date] = { workout: activity[date]?.workout ?? false, healthy: true };
  const showMap = !workouts.error && !meals.error;
  const displayName = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : "عضو GymJo";
  const initial = displayName.slice(0, 1);
  const joined = new Intl.DateTimeFormat("ar-JO", { month: "long", year: "numeric" }).format(new Date(user.created_at));

  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_15%_10%,rgba(212,255,0,.18),transparent_45%),linear-gradient(135deg,#20291b,#11160f)] p-5 shadow-2xl shadow-black/20 sm:p-8">
        <div aria-hidden className="absolute -end-12 -top-16 -z-10 size-56 rounded-full border-[32px] border-[#d4ff00]/5" />
        <p className="text-xs font-black tracking-[.2em] text-[#d4ff00]">GYMJO MEMBER SPACE</p>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-[1.7rem] border border-[#d4ff00]/30 bg-[#d4ff00]/15 text-4xl font-black text-[#eaff8c] shadow-lg shadow-black/20">{initial}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black sm:text-3xl">أهلاً، {displayName}</h1>
            <p className="mt-1 break-all text-sm text-white/65" dir="ltr">{user.email}</p>
            <p className="mt-2 text-xs text-white/50">عضو من {joined}</p>
          </div>
          <Link href="/search" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#d4ff00] px-5 font-black text-[#151a0b] transition hover:-translate-y-0.5">اكتشف ناديك القادم ←</Link>
        </div>
      </section>

      {showMap && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-surface p-5">
          <h2 className="mb-1 font-black">خريطة نشاطك</h2>
          <p className="mb-4 text-sm text-muted">كل مربّع يوم. سجّل تمرينك وأكلك وشوف الخريطة تتعبّى.</p>
          <ActivityHeatmap days={activity} today={today} />
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link href="/log" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-bold text-accent-foreground">🔥 سجّل تمرين</Link>
            <Link href="/food" className="inline-flex min-h-11 items-center rounded-xl bg-background px-4 font-bold ring-1 ring-white/10 hover:ring-accent">🥗 سجّل أكل</Link>
          </div>
        </section>
      )}

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-black tracking-widest text-accent">YOUR GYMJO</p><h2 className="mt-1 text-2xl font-black">مساحتك الرياضية</h2><p className="mt-1 text-sm text-muted">كل ما تحتاجه لمتابعة رحلتك الرياضية بمكان واحد.</p></div>
          <Link href="/sections" className="text-sm font-bold text-accent">كل الأقسام ←</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((item) => (
            <Link key={item.href} href={item.href} className={`group relative isolate min-h-36 overflow-hidden rounded-2xl border border-white/10 bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10`}>
              <div aria-hidden className={`absolute inset-0 -z-10 bg-gradient-to-br ${item.tone} opacity-80`} />
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-background/70 text-2xl ring-1 ring-white/10">{item.icon}</span>
                <span className="text-lg text-muted transition group-hover:-translate-x-1 group-hover:text-accent">←</span>
              </div>
              <h3 className="mt-4 text-lg font-black">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{item.note}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9"><MemberProfileForm initialName={displayName === "عضو GymJo" ? "" : displayName} /></section>

      <section className="mt-9 grid gap-3 sm:grid-cols-2">
        <Link href="/notifications" className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-accent/40 sm:col-span-2">
          <div><span className="text-xl">🔔</span><h2 className="mt-2 font-bold">الإشعارات</h2><p className="mt-1 text-sm text-muted">منشورات وعروض الأماكن اللي بالمفضلة.</p></div>
          {unread > 0 && <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-accent px-3 py-1 text-sm font-black tabular-nums text-accent-foreground">{unread}</span>}
        </Link>
        <Link href="/dashboard" className="rounded-2xl border border-accent/30 bg-surface p-5 transition hover:border-accent/60 sm:col-span-2">
          <span className="text-xl">🏋️</span><h2 className="mt-2 font-bold">صاحب نادي أو نشاط رياضي؟</h2><p className="mt-1 text-sm text-muted">سجّل ناديك أو أدِر صفحته: الأسعار، الدوام، الصور، العروض والإحصائيات.</p>
        </Link>
        <Link href="/account/export" className="rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-accent/40">
          <span className="text-xl">📦</span><h2 className="mt-2 font-bold">تنزيل بيانات الحساب</h2><p className="mt-1 text-sm text-muted">احتفظ بنسخة من البيانات المرتبطة بحسابك.</p>
        </Link>
        <Link href="/privacy" className="rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-accent/40">
          <span className="text-xl">🔐</span><h2 className="mt-2 font-bold">الخصوصية والأمان</h2><p className="mt-1 text-sm text-muted">اطّلع على كيفية التعامل مع بياناتك.</p>
        </Link>
      </section>

      <details className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
        <summary className="cursor-pointer font-bold text-red-300">إعدادات الحساب الحساسة</summary>
        <div className="mt-4 border-t border-red-500/15 pt-4">
          <h2 className="font-bold">حذف الحساب نهائياً</h2>
          <p className="mt-1 text-sm leading-6 text-muted">هذا الإجراء نهائي. راجع البيانات المرتبطة بحسابك قبل المتابعة.</p>
          <DeleteAccountForm />
        </div>
      </details>
    </main>
  );
}
