/** Safe inline JSON-LD (escapes "<" so data can never close the script tag). */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
export type Faq = { q: string; a: string };
export const faqLd = (items: Faq[]) => items.length ? {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
} : null;

/** Visible Q&A block. The same items feed the FAQPage JSON-LD, so what machines read is what people see. */
export function FaqSection({ items, title = "أسئلة شائعة" }: { items: Faq[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="space-y-2">
        {items.map((f) => (
          <details key={f.q} className="rounded-xl bg-surface p-4 ring-1 ring-white/10" open>
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
