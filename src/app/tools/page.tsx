import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "./Calculator";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = {
  title: "حاسبة السعرات والبروتين",
  description: "احسب احتياجك اليومي من السعرات والبروتين والكارب والدهون حسب هدفك.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHead title="حاسبة السعرات والبروتين" note="بدون تسجيل ولا حفظ بيانات، الحساب بجهازك." />
      <Calculator />
      <p className="mt-8 text-sm">بدك أخصائي تغذية؟ <Link href="/search?type=nutritionist" className="text-accent underline">تصفح الأخصائيين</Link>، أو <Link href="/search?type=healthy_food" className="text-accent underline">أكل صحي</Link></p>
    </div>
  );
}
