import Link from "next/link";
export default function NotFound() {
  return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-3xl font-extrabold">الصفحة غير موجودة</h1>
    <p className="mt-3 text-muted">يمكن تم حذفها أو لسا ما انتشرت.</p><Link href="/" className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground">الرئيسية</Link></div>;
}
