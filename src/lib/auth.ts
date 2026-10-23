import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  // Accounts created by the platform owner start with a temporary password.
  if (data.user.user_metadata?.must_change_password === true) redirect("/auth/change-password");
  return { supabase, user: data.user };
}
