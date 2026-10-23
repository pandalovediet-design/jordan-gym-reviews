"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signout } from "@/app/login/actions";

/**
 * Header buttons that know whether you are signed in. The pages stay static (cached), so the
 * session is read in the browser: logged-out people see دخول + سجّل نشاطك, signed-in people see
 * لوحتي + خروج. The row keeps its space until the check finishes, so nothing jumps.
 */
export function HeaderAuth() {
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => { if (alive) setState(data.session ? "in" : "out"); }, () => { if (alive) setState("out"); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (alive) setState(session ? "in" : "out"); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const hide = state === "checking" ? "invisible" : "";
  if (state === "in") {
    return (
      <>
        <Link href="/dashboard" className="rounded-xl bg-accent px-3 py-2 font-bold text-accent-foreground">لوحتي</Link>
        <form action={signout}><button className="rounded-xl px-3 py-2 ring-1 ring-white/20 hover:text-accent">خروج</button></form>
      </>
    );
  }
  return (
    <>
      <Link href="/login" className={`rounded-xl px-3 py-2 ring-1 ring-white/20 hover:text-accent ${hide}`}>دخول</Link>
      <Link href="/join" className={`rounded-xl bg-accent px-3 py-2 font-bold text-accent-foreground ${hide}`}>سجّل نشاطك</Link>
    </>
  );
}
