"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signout } from "@/app/login/actions";

/** Header actions reflect the current browser session without causing layout shifts. */
export function HeaderAuth() {
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase.auth.getSession().then(
      ({ data }) => { if (alive) setState(data.session ? "in" : "out"); },
      () => { if (alive) setState("out"); },
    );
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setState(session ? "in" : "out");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const base = "inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const hide = state === "checking" ? "invisible" : "";

  if (state === "in") {
    return (
      <>
        <Link href="/dashboard" className={`${base} bg-accent text-accent-foreground hover:brightness-110`}>
          لوحتي
        </Link>
        <form action={signout}>
          <button type="submit" className={`${base} ring-1 ring-white/20 hover:bg-white/5 hover:text-accent`}>
            خروج
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link href="/login" aria-hidden={state === "checking"} tabIndex={state === "checking" ? -1 : undefined} className={`${base} ring-1 ring-white/20 hover:bg-white/5 hover:text-accent ${hide}`}>
        دخول
      </Link>
      <Link href="/join" aria-hidden={state === "checking"} tabIndex={state === "checking" ? -1 : undefined} className={`${base} bg-accent text-accent-foreground hover:brightness-110 ${hide}`}>
        سجّل نشاطك
      </Link>
    </>
  );
}
