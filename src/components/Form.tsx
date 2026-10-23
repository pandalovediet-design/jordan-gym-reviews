"use client";
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { FormState } from "@/app/dashboard/actions";

export const field = "w-full rounded-xl bg-background px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";

/**
 * Server-action form that KEEPS what the user typed when the action returns an error.
 * (React 19 resets uncontrolled fields after a form `action` finishes, even on failure.)
 * The form is cleared only after a successful result.
 */
type Res = { ok?: string; notice?: string } | undefined;
export function useKeepForm<State extends Res>(action: (s: State, fd: FormData) => Promise<State>) {
  const [state, setState] = useState<State>(undefined as State);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    start(async () => { setState(await action(state, fd)); });
  };
  useEffect(() => { if (state?.ok || state?.notice) ref.current?.reset(); }, [state]);
  return { state, onSubmit, pending, ref };
}

export function ActionForm({ action, children, submit = "حفظ", className = "space-y-3" }: {
  action: (s: FormState, fd: FormData) => Promise<FormState>; children: ReactNode; submit?: string; className?: string;
}) {
  const { state, onSubmit, pending, ref } = useKeepForm(action);
  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      {children}
      {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
      {state?.ok && <p className="text-sm text-accent">{state.ok}</p>}
      <button disabled={pending} className="rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground disabled:opacity-60">{pending ? "لحظة..." : submit}</button>
    </form>
  );
}
