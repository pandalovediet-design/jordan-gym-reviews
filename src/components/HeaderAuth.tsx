"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signout } from "@/app/login/actions";
import { clearMemberLocalData } from "@/lib/member-sync";

/** Header actions reflect the current browser session without causing layout shifts. */
export function HeaderAuth() {
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    let alive = true;
    let receivedAuthEvent = false;
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      if (!session) clearMemberLocalData();
      if (alive) setState(session ? "in" : "out");
    });
    supabase.auth.getSession().then(
      ({ data }) => {
        // Signed out: drop the account's copy from this device (no-op for anonymous visitors' own data).
        if (!data.session) clearMemberLocalData();
        if (alive && !receivedAuthEvent) setState(data.session ? "in" : "out");
      },
      () => { if (alive && !receivedAuthEvent) setState("out"); },
    );
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const base = "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none";
  const hide = state === "checking" ? "invisible" : "";

  if (state === "in") {
    return (
      <>
        <Link href="/account" aria-label="حسابي" className={`${base} bg-accent text-accent-foreground hover:brightness-110`}>
          حسابي
        </Link>
        <form action={signout}>
          <button type="submit" className={`${base} ring-1 ring-line hover:bg-foreground/5`}>خروج</button>
        </form>
      </>
    );
  }
  return (
    <>
      <Link href="/login" aria-hidden={state === "checking"} tabIndex={state === "checking" ? -1 : undefined} className={`${base} ring-1 ring-line hover:bg-foreground/5 ${hide}`}>دخول</Link>
      <Link href="/join" aria-hidden={state === "checking"} tabIndex={state === "checking" ? -1 : undefined} className={`${base} bg-accent text-accent-foreground max-sm:hidden ${hide}`}>أضف ناديك</Link>
    </>
  );
}
