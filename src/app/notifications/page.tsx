import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateAr } from "@/lib/format";
import { clearNotifications, markAllRead } from "./actions";

export const metadata: Metadata = { title: "الإشعارات", robots: { index: false } };
const KIND: Record<string, [string, string]> = { post: ["📣", "منشور جديد"], offer: ["🎟️", "عرض جديد"] };

export default async function Notifications() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("notifications")
    .select("id,kind,body,created_at,read_at,organizations(name_ar,slug)")
    .order("created_at", { ascending: false })
    .limit(100);
  const list = data ?? [];
  const unread = list.filter((n) => !n.read_at).length;
  const btn = "inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">الإشعارات</h1>
          <p className="mt-1 text-sm text-muted">{unread > 0 ? `${unread} جديد` : "ما في جديد"} · من الأماكن اللي بالمفضلة</p>
        </div>
        {list.length > 0 && (
          <div className="flex gap-2">
            {unread > 0 && <form action={markAllRead}><button className={`${btn} bg-accent text-accent-foreground hover:brightness-110`}>تمّت القراءة</button></form>}
            <form action={clearNotifications}><button className={`${btn} text-muted ring-1 ring-white/15 hover:bg-white/5 hover:text-foreground`}>مسح الكل</button></form>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-surface/60 px-6 py-12 text-center">
          <p aria-hidden className="text-3xl">🔔</p>
          <p className="mt-3 text-lg font-extrabold">لسا ما في إشعارات</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">حط ناديك المفضّل بالمفضلة ❤️، ولما ينزّل عرض أو خبر بيوصلك هون.</p>
          <Link href="/search" className={`${btn} mt-5 bg-accent text-accent-foreground hover:brightness-110`}>اكتشف الأماكن</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((n) => {
            const [icon, label] = KIND[n.kind] ?? ["🔔", "تحديث"];
            const org = n.organizations;
            return (
              <li key={n.id}>
                <Link href={org ? `/g/${org.slug}` : "/favorites"} className={`flex gap-3 rounded-2xl bg-surface p-4 ring-1 transition hover:ring-accent/60 ${n.read_at ? "ring-white/10" : "ring-accent/40"}`}>
                  <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-xl">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-extrabold">{org?.name_ar ?? "مكان من المفضلة"}</span>
                      <span className="text-xs text-muted">{label}</span>
                      {!n.read_at && <span className="size-2 rounded-full bg-accent" aria-label="جديد" />}
                    </p>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">{dateAr(n.created_at)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
