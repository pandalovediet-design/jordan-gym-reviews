import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AdminTabs } from "@/components/AdminTabs";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) notFound();
  return (<><AdminTabs />{children}</>);
}
