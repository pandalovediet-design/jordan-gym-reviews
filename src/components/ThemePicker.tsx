import { THEMES, asTheme } from "@/lib/themes";

/** Radio swatches for the activity's color theme (used inside an ActionForm). */
export function ThemePicker({ current }: { current: string | null }) {
  const cur = asTheme(current) ?? "emerald";
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((t) => (
        <label key={t.key} className="cursor-pointer">
          <input type="radio" name="theme" value={t.key} defaultChecked={cur === t.key} className="peer sr-only" />
          <span className="block overflow-hidden rounded-2xl ring-2 ring-white/10 transition peer-checked:ring-accent peer-focus-visible:ring-accent">
            <span className="flex h-16 items-end gap-1.5 p-2" style={{ background: `linear-gradient(135deg, ${t.swatch[1]}, ${t.swatch[0]})` }}>
              <span className="h-6 w-10 rounded-lg" style={{ background: t.swatch[2] }} />
              <span className="h-3 w-14 rounded-full bg-white/25" />
            </span>
            <span className="block bg-black/30 px-3 py-2 text-sm font-semibold">{t.label}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
