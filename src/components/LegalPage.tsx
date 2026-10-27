import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
        <header className="border-b border-border/70 pb-5 sm:pb-6">
          <h1 className="break-words text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">آخر تحديث: {updated}</p>
        </header>
        <div className="mt-6 space-y-6 break-words leading-8 [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-transparent [&_a:hover]:decoration-current [&_a:focus-visible]:rounded [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:leading-7 [&_h2]:sm:text-xl [&_li]:mr-5 [&_li]:list-disc [&_li]:ps-1 [&_ol]:mr-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:text-foreground/90 [&_ul]:space-y-2">
          {children}
        </div>
      </article>
    </main>
  );
}

export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
