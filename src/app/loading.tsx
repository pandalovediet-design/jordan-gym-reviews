/** Shown instantly while a page loads, so navigation never looks frozen. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">جاري التحميل…</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface motion-reduce:animate-none" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-surface motion-reduce:animate-none" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
