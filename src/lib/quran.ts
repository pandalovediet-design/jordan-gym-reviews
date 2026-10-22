import "server-only";

/**
 * Quran text + Tafsir al-Muyassar come from AlQuran.cloud (Tanzil Uthmani text, King Fahd Complex tafsir).
 * Nothing is typed by hand: we only keep (surah, ayah) references and fetch the text.
 * The curated references below are PENDING SCHOLAR REVIEW before production.
 */
const API = "https://api.alquran.cloud/v1/surah";
const EDITIONS = "quran-uthmani,ar.muyassar";

export type Verse = { n: number; text: string; tafsir: string };
export type Passage = { id: string; surah: number; surahName: string; from: number; to: number; verses: Verse[] };
export type RestContent = { short: Passage[]; long: Passage[] };

// [surah, fromAyah, toAyah]
const SHORT: [number, number, number][] = [
  [94, 5, 6], [2, 153, 153], [3, 139, 139], [13, 28, 28], [39, 10, 10], [65, 3, 3], [2, 286, 286], [94, 7, 8],
];
const LONG: [number, number, number][] = [
  [94, 1, 8], [112, 1, 4], [113, 1, 5], [114, 1, 6], [2, 285, 286], [2, 255, 255], [59, 22, 24], [93, 1, 11],
];

const strip = (s: string) => s.replace(/[ً-ٰٟۖ-ۭ]/g, "").replace(/ٱ/g, "ا");
/** AlQuran.cloud puts the Bismillah in front of ayah 1 of every surah except 1 and 9; show only the ayah. */
function withoutBasmala(text: string, surah: number, n: number): string {
  if (n !== 1 || surah === 1 || surah === 9) return text;
  const w = text.split(" ");
  const head = strip(w.slice(0, 4).join(" "));
  return head === "بسم الله الرحمن الرحيم" ? w.slice(4).join(" ") : text;
}

type ApiAyah = { numberInSurah: number; text: string };
type ApiEdition = { name: string; ayahs: ApiAyah[]; edition: { identifier: string } };

async function surah(n: number): Promise<{ name: string; text: Map<number, string>; tafsir: Map<number, string> } | null> {
  try {
    const res = await fetch(`${API}/${n}/${EDITIONS}`, { next: { revalidate: 86400 } });
    if (!res.ok) { console.error(`quran api ${n}: HTTP ${res.status}`); return null; }
    const j = (await res.json()) as { data?: ApiEdition[] };
    const q = j.data?.find((e) => e.edition.identifier === "quran-uthmani");
    const t = j.data?.find((e) => e.edition.identifier === "ar.muyassar");
    if (!q || !t) { console.error(`quran api ${n}: editions missing`, j.data?.map((e) => e.edition?.identifier)); return null; }
    return {
      name: q.name.replace(/^سُورَةُ\s*/, "").replace(/^سورة\s*/, ""),
      text: new Map(q.ayahs.map((a) => [a.numberInSurah, withoutBasmala(a.text, n, a.numberInSurah)])),
      tafsir: new Map(t.ayahs.map((a) => [a.numberInSurah, a.text])),
    };
  } catch (e) { console.error(`quran api ${n}: fetch failed`, e instanceof Error ? e.message : e); return null; }
}

export async function getRestContent(): Promise<RestContent> {
  const refs = [...SHORT, ...LONG];
  const nums = [...new Set(refs.map((r) => r[0]))];
  const loaded = new Map<number, NonNullable<Awaited<ReturnType<typeof surah>>>>();
  await Promise.all(nums.map(async (n) => { const s = await surah(n); if (s) loaded.set(n, s); }));
  const build = (list: [number, number, number][], kind: string): Passage[] =>
    list.flatMap(([s, from, to]) => {
      const d = loaded.get(s);
      if (!d) return [];
      const verses: Verse[] = [];
      for (let a = from; a <= to; a++) {
        const text = d.text.get(a), tafsir = d.tafsir.get(a);
        if (!text || !tafsir) return [];
        verses.push({ n: a, text, tafsir });
      }
      return [{ id: `${kind}-${s}-${from}-${to}`, surah: s, surahName: d.name, from, to, verses }];
    });
  return { short: build(SHORT, "s"), long: build(LONG, "l") };
}
