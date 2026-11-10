import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { dateAr } from "@/lib/format";
import { addPost, deletePost } from "../../actions";

export const metadata: Metadata = { title: "المنشورات", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function Posts({ params }: PageProps<"/dashboard/[id]/posts">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,name_ar,slug,status").eq("id", id).maybeSingle();
  if (!org) notFound();
  const { data: posts } = await supabase.from("business_posts").select("id,body,created_at").eq("organization_id", id).order("created_at", { ascending: false }).limit(50);
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-extrabold">المنشورات</h1>
        <p className="mt-1 text-sm leading-6 text-muted">خبر قصير بيظهر على صفحتك تحت «آخر الأخبار»: دوام العيد، كلاس جديد، جهاز وصل، تسجيل دورة. آخر 5 منشورات بتظهر للزوار.</p>
        {org.status !== "published" && <p className="mt-3 rounded-xl bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">صفحتك لسا مش منشورة، فالمنشورات بتظهر للزوار بعد اعتماد الصفحة.</p>}
      </div>

      <section className={box}>
        <h2 className="mb-3 text-lg font-bold">منشور جديد</h2>
        <ActionForm action={addPost.bind(null, id)} submit="انشر">
          <textarea name="body" required rows={4} minLength={2} maxLength={1000} placeholder="مثلاً: دوام الجمعة من 2 الظهر لـ10 بالليل. كلاس الكروس فت الجديد ببلّش الأحد." className={field} />
          <p className="text-xs text-muted">حد أقصى 1000 حرف و5 منشورات باليوم.</p>
        </ActionForm>
      </section>

      <ul className="space-y-3">
        {(posts ?? []).map((p) => (
          <li key={p.id} className={box}>
            <p className="whitespace-pre-line text-sm leading-7">{p.body}</p>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
              <span>{dateAr(p.created_at)}</span>
              <form action={deletePost.bind(null, id, p.id)}><button className="inline-flex min-h-9 items-center rounded-lg px-3 font-bold text-red-300 hover:bg-white/10">حذف</button></form>
            </div>
          </li>
        ))}
        {(posts ?? []).length === 0 && <li className="rounded-2xl border border-dashed border-white/20 px-6 py-10 text-center text-sm text-muted">لسا ما نشرت إشي. أول منشور بيخلّي صفحتك حيّة.</li>}
      </ul>

      {org.status === "published" && <p className="text-sm"><Link href={`/g/${org.slug}`} className="font-bold text-accent underline underline-offset-4">شوف صفحتك</Link></p>}
    </div>
  );
}
