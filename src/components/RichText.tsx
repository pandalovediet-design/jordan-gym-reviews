/** Tiny safe renderer for admin-written plans: "# " heading, "- " bullet, blank line = new paragraph. No HTML. */
export function RichText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(<ul key={`u${out.length}`} className="list-disc space-y-1 ps-5">{list.map((l, i) => <li key={i}>{l}</li>)}</ul>); list = []; } };
  for (const raw of text.split("\n")) {
    const l = raw.trim();
    if (l.startsWith("- ")) { list.push(l.slice(2)); continue; }
    flush();
    if (!l) continue;
    if (l.startsWith("# ")) out.push(<h3 key={out.length} className="mt-4 text-base font-extrabold text-accent first:mt-0">{l.slice(2)}</h3>);
    else out.push(<p key={out.length}>{l}</p>);
  }
  flush();
  return <div className="space-y-2 text-sm leading-relaxed">{out}</div>;
}
