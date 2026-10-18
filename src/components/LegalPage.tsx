import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 leading-8">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-muted">آخر تحديث: {updated}</p>
      <div className="mt-8 space-y-6 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mr-5 [&_li]:list-disc [&_ul]:space-y-1">{children}</div>
    </article>
  );
}

export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
