import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { RevealCode } from "@/components/RevealCode";
import { dateAr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "أكواد خصم الأندية والمتاجر الرياضية بالأردن",
  description: "أكواد خصم حصرية لزوار Jordan Gym Reviews من أندية ومتاجر ومدربين. جيب الكود واستخدمه مباشرة عند النشاط.",
  alternates: { canonical: "/deals" },
};

export default async function Deals() {
  const { data } = await createPublicClient().rpc("list_public_codes", {});
  const list = data ?? [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">🎟️ أكواد خصم حصرية</h1>
      <p className="mt-2 text-muted">أنشطة بتعطي زوار المنصة خصم خاص. اضغط «جيب الكود» وقول الكود عند الاشتراك أو الشراء.</p>
      <ul className="mt-6 space-y-3">
        {list.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
            <div className="min-w-0">
              <p className="font-bold">{c.title_ar}</p>
              {c.details_ar && <p className="mt-1 text-sm text-muted">{c.details_ar}</p>}
              <p className="mt-1 text-xs text-muted"><Link href={`/g/${c.org_slug}`} className="text-accent hover:underline">{c.org_name}</Link> · {c.org_city}{c.ends_at && <> · ينتهي {dateAr(c.ends_at)}</>}</p>
            </div>
            <RevealCode id={c.id} />
          </li>
        ))}
        {list.length === 0 && <li className="rounded-2xl bg-surface p-6 text-center text-muted ring-1 ring-white/10">ما في أكواد حالياً. صاحب نشاط؟ أضف كود خصم من لوحة التحكم، أو <Link href="/sponsors" className="text-accent underline">كن راعياً</Link>.</li>}
      </ul>
    </div>
  );
}
