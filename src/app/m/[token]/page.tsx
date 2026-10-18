import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { dateAr } from "@/lib/format";

export const metadata: Metadata = { title: "برنامجك", robots: { index: false, follow: false } };

export default async function Program({ params }: PageProps<"/m/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const { data } = await createPublicClient().rpc("get_program_by_token", { p_token: token });
  const p = data?.[0];
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-muted">{p.org_name} · {p.kind === "workout" ? "برنامج تمرين" : "نظام غذائي"}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{p.title}</h1>
      <p className="mt-1 text-sm text-muted">لـ {p.member_name} · {dateAr(p.created_at)}</p>
      <div className="mt-6 whitespace-pre-line rounded-2xl bg-surface p-6 leading-8 ring-1 ring-white/10">{p.body}</div>
    </div>
  );
}
