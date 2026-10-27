"use client";

/** Prints only the section with the given id (the browser's print dialog offers "Save as PDF"). */
export function SectionPrintButton({ target, label }: { target: string; label: string }) {
  const go = () => {
    const el = document.getElementById(target);
    if (!el) return;

    el.setAttribute("data-print-active", "");
    document.body.classList.add("printing-one");

    let cleaned = false;
    const done = () => {
      if (cleaned) return;
      cleaned = true;
      el.removeAttribute("data-print-active");
      document.body.classList.remove("printing-one");
      window.removeEventListener("afterprint", done);
    };

    window.addEventListener("afterprint", done);
    try {
      window.print();
    } catch {
      // Restore the page if the browser blocks or cannot open its print dialog.
      done();
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      className="no-print inline-flex min-h-11 items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-xs transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
    >
      {label}
    </button>
  );
}
