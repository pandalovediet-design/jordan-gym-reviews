import Link from "next/link";
import { DashTabs } from "@/components/DashTabs";
import { createClient } from "@/lib/supabase/server";

export default async function DashLayout({ children, params }: LayoutProps<"/dashboard/[id]">) {
  const { id } = await params;
  let showMembers = true;
  let newInquiries = 0;
  let adminView: { orgName: string } | null = null;
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const supabase = await createClient();
    const [{ data: org }, { data: auth }, { data: isAdmin }] = await Promise.all([
      supabase.from("organizations").select("type,name_ar").eq("id", id).maybeSingle(),
      supabase.auth.getUser(),
      supabase.rpc("is_platform_admin"),
    ]);
    const { count } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("organization_id", id).eq("status", "new");
    newInquiries = count ?? 0;
    showMembers = !!org && ["gym", "independent_coach", "sports_facility", "nutritionist"].includes(org.type); // private subscriber tool only for places with subscribers
    if (org && isAdmin && auth.user) {
      const { data: mine } = await supabase.from("organization_members").select("user_id").eq("organization_id", id).eq("user_id", auth.user.id).maybeSingle();
      if (!mine) adminView = { orgName: org.name_ar };
    }
  }
  return (
    <>
      {adminView && (
        <div className="bg-yellow-400/15 px-4 py-2 text-center text-sm text-yellow-100">
          وضع الأدمن: أنت تدير حساب «{adminView.orgName}» وأي تعديل بيطبّق مباشرة عليه. <Link href="/admin/orgs" className="underline">← رجوع للوحة الإدارة</Link>
        </div>
      )}
      <DashTabs id={id} showMembers={showMembers} newInquiries={newInquiries} />
      {children}
    </>
  );
}
