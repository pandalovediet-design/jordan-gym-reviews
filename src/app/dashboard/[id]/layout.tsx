import { DashTabs } from "@/components/DashTabs";
import { createClient } from "@/lib/supabase/server";

export default async function DashLayout({ children, params }: LayoutProps<"/dashboard/[id]">) {
  const { id } = await params;
  let showMembers = true;
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const supabase = await createClient();
    const { data } = await supabase.from("organizations").select("type").eq("id", id).maybeSingle();
    showMembers = !!data && data.type !== "store"; // stores sell to walk-in customers; no subscriptions
  }
  return (<><DashTabs id={id} showMembers={showMembers} />{children}</>);
}
