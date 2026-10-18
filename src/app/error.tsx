"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-extrabold">صار خطأ غير متوقع</h1>
    <button onClick={reset} className="mt-6 rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground">جرّب مرة ثانية</button></div>;
}
