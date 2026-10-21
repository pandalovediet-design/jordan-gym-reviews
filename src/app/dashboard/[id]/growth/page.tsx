import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ImageInput } from "@/components/ImageInput";
import { ActionForm, field } from "@/components/Form";
import { PLATFORM_LABEL, type Platform } from "@/lib/video";
import { EQUIP_COND, dateAr, isPast, jod, publicMediaUrl } from "@/lib/format";
import { addEquipment, addOfferCode, addVideo, deleteVideo, deleteEquipment, deleteOfferCode, setEquipmentStatus, setOfferCodeActive } from "../../actions";

export const metadata: Metadata = { title: "أكواد الخصم وسوق المعدات", robots: { index: false } };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function Growth({ params }: PageProps<"/dashboard/[id]/growth">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("id,name_ar,type,status").eq("id", id).maybeSingle();
  if (!org) notFound();
  const canMarket = org.type === "gym" || org.type === "sports_facility" || org.type === "store";
  const [{ data: codes }, { data: items }, { data: vids }] = await Promise.all([
    supabase.from("offer_codes").select("*").eq("organization_id", id).order("created_at", { ascending: false }),
    canMarket ? supabase.from("equipment_listings").select("*").eq("organization_id", id).neq("status", "removed").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("videos").select("id,kind,platform,url,title_ar,status,views").eq("organization_id", id).order("created_at", { ascending: false }),
  ]);
  const STATUS_VID: Record<string, string> = { pending: "بانتظار موافقة الإدارة", approved: "ظاهر للعامة", rejected: "مرفوض" };
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const btn = "rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20";
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href={`/dashboard/${id}`} className="text-sm text-accent underline">← رجوع للوحة {org.name_ar}</Link>
      <h1 className="text-2xl font-extrabold">الفيديو وأكواد الخصم وسوق المعدات</h1>

      <section className={box}>
        <h2 className="text-lg font-bold">🎬 فيديوهاتك (ريلز)</h2>
        <p className="mb-3 mt-1 text-sm text-muted">الصق رابط فيديو من يوتيوب أو إنستغرام أو تيك توك أو فيسبوك. بيظهر بصفحتك وبصفحة «ريلز» بعد موافقة الإدارة، وبنعدّلك المشاهدات. الحد 3 فيديوهات.</p>
        <ul className="mb-4 space-y-2">
          {(vids ?? []).filter((x) => x.kind === "reel").map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background p-3 text-sm">
              <div className="min-w-0"><p className="truncate font-semibold">{x.title_ar ?? x.url}</p><p className="text-xs text-muted">{PLATFORM_LABEL[x.platform as Platform]} · {STATUS_VID[x.status]} · {x.views} مشاهدة</p></div>
              <form action={deleteVideo.bind(null, id, x.id)}><button className={btn}>حذف</button></form>
            </li>
          ))}
          {(vids ?? []).filter((x) => x.kind === "reel").length === 0 && <li className="text-sm text-muted">ما أضفت فيديوهات.</li>}
        </ul>
        <ActionForm action={addVideo.bind(null, id)} submit="إضافة الفيديو">
          <input name="url" required dir="ltr" placeholder="https://www.youtube.com/shorts/..." className={field} />
          <input name="title" maxLength={80} placeholder="عنوان قصير (اختياري)" className={field} />
          <label className="block text-sm text-muted">صورة غلاف (اختياري، مفيدة لإنستغرام وتيك توك)<ImageInput name="cover" accept="image/jpeg,image/png,image/webp" className="mt-1 text-xs" /></label>
        </ActionForm>
      </section>

      <section className={box}>
        <h2 className="text-lg font-bold">🎟️ أكواد خصم لزوار المنصة</h2>
        <p className="mb-3 mt-1 text-sm text-muted">اعمل كود خصم خاص بزوار Jordan Gym Reviews. بنعرضه بصفحة «أكواد خصم» وبنعدّلك كم واحد جاب الكود. الخصم بتطبقه إنت عند الاشتراك أو الشراء.</p>
        <ul className="mb-4 space-y-2">
          {(codes ?? []).map((c) => (
            <li key={c.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background p-3 ${c.is_active ? "" : "opacity-60"}`}>
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{c.title_ar} · <code dir="ltr" className="text-accent">{c.code}</code></p>
                <p className="text-xs text-muted">ظهر الكود {c.reveals} مرة{c.ends_at && <> · ينتهي {dateAr(c.ends_at)}</>}{!c.is_active && " · متوقف"}</p>
              </div>
              <div className="flex gap-2">
                <form action={setOfferCodeActive.bind(null, id, c.id, !c.is_active)}><button className={btn}>{c.is_active ? "إيقاف" : "تفعيل"}</button></form>
                <form action={deleteOfferCode.bind(null, id, c.id)}><button className={btn}>حذف</button></form>
              </div>
            </li>
          ))}
          {(codes ?? []).length === 0 && <li className="text-sm text-muted">ما أضفت أكواد بعد.</li>}
        </ul>
        <ActionForm action={addOfferCode.bind(null, id)} submit="إضافة الكود">
          <input name="title_ar" required maxLength={80} placeholder="العرض (مثال: خصم 15% على الاشتراك الشهري)" className={field} />
          <input name="code" required maxLength={30} dir="ltr" placeholder="الكود (مثال: JGR15)" className={field} />
          <input name="details_ar" maxLength={200} placeholder="شروط أو تفاصيل (اختياري)" className={field} />
          <label className="block text-sm text-muted">ينتهي بتاريخ (اختياري)<input name="ends_at" type="date" className={`${field} mt-1`} /></label>
        </ActionForm>
      </section>

      {canMarket ? (
        <section className={box}>
          <h2 className="text-lg font-bold">🔄 سوق المعدات (بيع / تبديل)</h2>
          <p className="mb-3 mt-1 text-sm text-muted">صوّر جهاز وبيعه أو بدّله مع نادي ثاني. الإعلان بينزل 30 يوم، والتواصل بيصير على واتساب نشاطك. المنصة ما بتتدخل بالدفع.</p>
          {org.status !== "published" && <p className="mb-3 rounded-xl bg-yellow-400/10 p-3 text-sm text-yellow-200">نشاطك لازم يكون منشور عشان تقدر تنزّل إعلان.</p>}
          <ul className="mb-4 space-y-2">
            {(items ?? []).map((l) => {
              const expired = l.status === "active" && isPast(l.expires_at);
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {l.image_path && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={publicMediaUrl(l.image_path)} alt="" className="size-12 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">{l.title_ar} <span className="text-xs text-muted">· {EQUIP_COND[l.condition]}</span></p>
                      <p className="text-xs text-muted">{l.kind === "sale" ? jod(l.price_jod) : `تبديل${l.swap_for ? ` بـ ${l.swap_for}` : ""}`} · {l.status === "sold" ? "تم البيع/التبديل" : expired ? "انتهى (جدّده)" : `ينتهي ${dateAr(l.expires_at)}`}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {l.status === "active" && !expired && <form action={setEquipmentStatus.bind(null, id, l.id, "sold")}><button className={btn}>تم البيع</button></form>}
                    {(l.status === "sold" || expired) && <form action={setEquipmentStatus.bind(null, id, l.id, "active")}><button className={btn}>{expired ? "تجديد 30 يوم" : "إعادة نشر"}</button></form>}
                    <form action={deleteEquipment.bind(null, id, l.id)}><button className={btn}>حذف</button></form>
                  </div>
                </li>
              );
            })}
            {(items ?? []).length === 0 && <li className="text-sm text-muted">ما في إعلانات.</li>}
          </ul>
          <ActionForm action={addEquipment.bind(null, id)} submit="نشر الإعلان">
            <input name="title_ar" required minLength={3} maxLength={80} placeholder="الجهاز (مثال: تردميل Technogym)" className={field} />
            <div className="grid grid-cols-2 gap-3">
              <select name="kind" className={field} defaultValue="sale"><option value="sale">للبيع</option><option value="swap">للتبديل</option></select>
              <select name="condition" className={field} defaultValue="used"><option value="new">جديد</option><option value="like_new">كالجديد</option><option value="used">مستعمل</option></select>
            </div>
            <input name="price_jod" type="number" min="0" step="0.5" inputMode="decimal" placeholder="السعر بالدينار (للبيع فقط)" className={field} />
            <input name="swap_for" maxLength={120} placeholder="بدك تبدّله بإيش؟ (للتبديل فقط)" className={field} />
            <textarea name="description_ar" rows={2} maxLength={600} placeholder="وصف قصير (العمر، الحالة، سبب البيع)" className={field} />
            <ImageInput name="image" accept="image/jpeg,image/png,image/webp" />
          </ActionForm>
        </section>
      ) : (
        <p className={`${box} text-sm text-muted`}>سوق المعدات متاح للنوادي والملاعب والمتاجر.</p>
      )}
    </div>
  );
}
