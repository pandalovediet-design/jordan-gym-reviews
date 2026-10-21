"use client";

/** Prints only the section with the given id (the browser's print dialog offers "Save as PDF"). */
export function SectionPrintButton({ target, label }: { target: string; label: string }) {
  const go = () => {
    const el = document.getElementById(target);
    if (!el) return;
    el.setAttribute("data-print-active", "");
    document.body.classList.add("printing-one");
    const done = () => {
      el.removeAttribute("data-print-active");
      document.body.classList.remove("printing-one");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };
  return <button type="button" onClick={go} className="no-print rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20">{label}</button>;
}
