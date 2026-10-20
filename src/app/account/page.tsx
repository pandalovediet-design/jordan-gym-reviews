import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const metadata: Metadata = { title: "حسابي", robots: { index: false } };

export default async function Account() {
  const { user } = await requireUser();
  const box = "rounded-2xl bg-surface p-6 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Link href="/dashboard" className="text-sm text-muted underline">← لوحة التحكم</Link>
      <h1 className="text-2xl font-extrabold">حسابي</h1>
      <p className="text-sm text-muted" dir="ltr">{user.email}</p>
      <section className={box}>
        <h2 className="font-bold">تصدير بياناتي</h2>
        <p className="mt-1 text-sm text-muted">ملف JSON فيه أنشطتك وخدماتها وأسعارها وأوقات دوامها واستفساراتها.</p>
        <a href="/account/export" className="mt-4 inline-block rounded-xl bg-accent px-5 py-2 text-sm font-bold text-accent-foreground">تنزيل الملف</a>
      </section>
      <section className={`${box} ring-red-500/40`}>
        <h2 className="font-bold text-red-400">حذف الحساب نهائياً</h2>
        <p className="mt-1 text-sm text-muted">بيتحذف حسابك وكل الأنشطة اللي أنشأتها مع صورها وأسعارها واستفساراتها. ما في رجعة.</p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
