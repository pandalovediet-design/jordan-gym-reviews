import { baseUrl } from "@/lib/base-url";
import { listExercises } from "@/lib/exercises";
import { listHomeWorkouts } from "@/lib/home-workouts";
import { listNutrition } from "@/lib/nutrition";
import { listSitemapEntries } from "@/lib/queries";

export const revalidate = 3600;

/** llms.txt: a plain-text map of the site for AI assistants (what it is, where the facts live, how to cite). */
export async function GET() {
  const base = baseUrl();
  const [ex, hw, nu, { orgs }] = await Promise.all([
    listExercises().catch(() => []),
    listHomeWorkouts().catch(() => []),
    listNutrition().catch(() => []),
    listSitemapEntries().catch(() => ({ orgs: [] as { slug: string }[], products: [] })),
  ]);
  const lines = [
    "# Jordan Gym Reviews",
    "",
    "> دليل عربي للأندية الرياضية والمدربين والمتاجر الرياضية وأخصائيي التغذية في الأردن: الأسعار، ساعات الدوام، الموقع، وطرق التواصل (واتساب/هاتف)، مع دليل تمارين بشرح من مدربين أردنيين.",
    "",
    "## ملاحظات للاستشهاد",
    "- البيانات يدخلها أصحاب الأنشطة أنفسهم وقد تتغير؛ ينصح بالتأكد منهم قبل الحجز أو الدفع.",
    "- الأنشطة التي تحمل علامة ✓ موثّق راجعتها الإدارة. اسم الصفحة والمدينة هما المرجع.",
    "- معلومات التمارين للتوعية فقط وليست بديلاً عن مدرب مؤهل أو طبيب.",
    "",
    "## الصفحات الرئيسية",
    `- [الدليل (نوادي، مدربين، ملاعب، متاجر)](${base}/directory)`,
    `- [دليل التمارين بالعربي](${base}/exercises)`,
    `- [من غير جيم: تمارين منزلية بالفيديو](${base}/no-gym)`,
    `- [من غير حرمان: حاسبة سعرات ووصفات وخطط أكل](${base}/no-deprivation)`,
    `- [ريلز رياضية](${base}/reels)`,
    `- [أكواد خصم](${base}/deals)`,
    `- [سوق المعدات](${base}/market)`,
    `- [Pink Zone: أماكن نسائية](${base}/pink)`,
    `- [أدلة](${base}/guides)`,
    "",
    "## التمارين",
    ...ex.map((e) => `- [${e.name_ar}](${base}/exercises/${e.slug})`),
    "",
    "## تمارين منزلية (من غير جيم)",
    ...hw.map((w) => `- [${w.title}](${base}/no-gym/${w.slug})`),
    "",
    "## وصفات وخطط أكل (من غير حرمان)",
    ...nu.map((w) => `- [${w.title}](${base}/no-deprivation/${w.slug})`),
    "",
    "## الأنشطة",
    ...orgs.filter((o) => !o.slug.startsWith("demo-")).slice(0, 200).map((o) => `- ${base}/g/${o.slug}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
