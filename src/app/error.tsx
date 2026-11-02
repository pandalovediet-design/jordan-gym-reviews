"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-extrabold">صار خطأ غير متوقع</h1>
      <p className="mt-3 text-muted">ممكن يكون الاتصال ضعيف أو في مشكلة مؤقتة. جرّب مرة ثانية، وإذا ضلّت ارجع للرئيسية.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-accent px-6 font-bold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">جرّب مرة ثانية</button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-surface px-6 font-bold ring-1 ring-white/10 hover:ring-accent">الرئيسية</Link>
      </div>
    </div>
  );
}
