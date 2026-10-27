import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, field } from "@/components/Form";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { requestClaim } from "./actions";

export const metadata: Metadata = { title: "استلم صفحة ناديك", robots: { index: false } };

export default async function Claim({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: org } = await createPublicClient().from("organizations").select("id,name_ar,slug,city,area,is_claimed").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!org) notFound();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  const { data: mine } = user
    ? await supabase.from("claim_requests").select("status,created_at").eq("organization_id", org.id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const here = `/claim/${org.slug}`;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const lbl = "block space-y-1 text-sm text-muted";
  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-10">
      <div>
        <p className="text-sm text-muted">استلام صفحة</p>
        <h1 className="text-2xl font-extrabold">{org.name_ar}</h1>
        <p className="text-sm text-muted">{[org.city, org.area].filter(Boolean).join("، ")} · <Link href={`/g/${org.slug}`} className="text-accent underline">شوف الصفحة</Link></p>
      </div>

      {org.is_claimed !== false ? (
        <p className={box}>هاي الصفحة مستلَمة من صاحبها. إذا إنت صاحب النادي وفي خطأ، راسلنا من <Link href="/join" className="text-accent underline">صفحة التسجيل</Link>.</p>
      ) : (
        <>
          <section className={box}>
            <h2 className="mb-2 font-bold">ليش تستلم صفحتك؟ مجاناً</h2>
            <ul className="list-disc space-y-1 pe-5 text-sm text-muted">
              <li>تضيف أسعارك وصورك وعروضك ودوامك الصحيح.</li>
              <li>زر واتساب مباشر لناديك، والزبائن بيراسلوك إنت.</li>
              <li>بتشوف كم واحد فتح صفحتك وضغط اتصال أو واتساب.</li>
              <li>أدوات للأعضاء والاشتراكات والحضور بـQR.</li>
            </ul>
          </section>

          <section className={box}>
            <h2 className="mb-3 font-bold">كيف تستلمها؟</h2>
            <ol className="list-decimal space-y-1 pe-5 text-sm text-muted">
              <li className={user ? "text-accent" : ""}>أنشئ حساب بالإيميل (أو سجّل دخول إذا عندك حساب).{user && " ✓"}</li>
              <li>عبّي اسمك ورقمك وابعت الطلب.</li>
              <li>بنتأكد منك على الرقم، وبنوافق، وبتلاقي النادي بلوحتك جاهز للتعديل.</li>
            </ol>
            {!user && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/login?mode=signup&next=${encodeURIComponent(here)}`} className="rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground">أنشئ حساب</Link>
                <Link href={`/login?next=${encodeURIComponent(here)}`} className="rounded-xl bg-background px-6 py-2.5 ring-1 ring-white/10">عندي حساب</Link>
              </div>
            )}
          </section>

          {user && mine?.status === "pending" && (
            <p className={`${box} text-accent`}>طلبك وصل وقيد المراجعة ✅ بنتواصل معك قريباً.</p>
          )}
          {user && mine?.status === "rejected" && (
            <p className={`${box} text-sm text-muted`}>ما قدرنا نأكد طلبك السابق. إذا إنت صاحب النادي، ابعت طلب جديد واكتب بالملاحظة شي بيساعدنا نتأكد (مثلاً رقم النادي الرسمي).</p>
          )}
          {user && mine?.status !== "pending" && (
            <section className={box}>
              <h2 className="mb-3 font-bold">طلب الاستلام</h2>
              <ActionForm action={requestClaim.bind(null, org.id)} submit="ابعت الطلب">
                <label className={lbl}>اسمك<input name="contact_name" required minLength={2} maxLength={80} className={field} /></label>
                <label className={lbl}>رقمك (يفضّل واتساب)<input name="phone" required dir="ltr" inputMode="tel" placeholder="0791234567" className={field} /></label>
                <label className={lbl}>صفتك
                  <select name="role" defaultValue="المالك" className={field}><option>المالك</option><option>المدير</option><option>موظف</option></select>
                </label>
                <label className={lbl}>ملاحظة (اختياري)<textarea name="note" rows={2} maxLength={500} className={field} /></label>
                <p className="text-xs text-muted">داخل بحساب <span dir="ltr">{user.email}</span></p>
              </ActionForm>
            </section>
          )}
        </>
      )}
    </div>
  );
}
