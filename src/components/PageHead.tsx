import type { ReactNode } from "react";

/** The opening of every inner page: a big Changa title, one line of help, optional actions. No box around it. */
export function PageHead({ title, note, pink, children }: { title: ReactNode; note?: ReactNode; pink?: boolean; children?: ReactNode }) {
  return (
    <header className="mb-8 border-b-2 border-foreground pb-6">
      <h1 className={`text-4xl font-extrabold sm:text-5xl ${pink ? "text-pink-600" : ""}`}>{title}</h1>
      {note && <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">{note}</p>}
      {children && <div className="mt-5 flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/** Shared button shapes so inner pages stop inventing their own. */
export const btn = {
  primary: "inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-accent-foreground",
  ghost: "inline-flex min-h-12 items-center justify-center rounded-full bg-surface px-6 font-semibold ring-1 ring-line transition-colors hover:ring-foreground",
  chip: "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold ring-1 ring-line transition-colors hover:ring-foreground",
  chipOn: "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground",
};
