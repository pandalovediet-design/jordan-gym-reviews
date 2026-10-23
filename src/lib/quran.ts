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
  [2, 45, 45], [2, 152, 152], [3, 160, 160], [3, 173, 173], [3, 200, 200], [8, 46, 46], [9, 51, 51], [11, 112, 112],
  [12, 87, 87], [14, 7, 7], [16, 127, 127], [20, 25, 26], [29, 69, 69], [33, 3, 3], [39, 53, 53], [40, 60, 60],
  [47, 7, 7], [64, 16, 16], [95, 4, 4],
];
const LONG: [number, number, number][] = [
  [94, 1, 8], [112, 1, 4], [113, 1, 5], [114, 1, 6], [2, 285, 286], [2, 255, 255], [59, 22, 24], [93, 1, 11],
  [1, 1, 7], [2, 186, 186], [20, 25, 28], [67, 1, 2], [89, 27, 30], [95, 1, 8], [103, 1, 3], [108, 1, 3], [110, 1, 3],
  // Juz Amma: the short surahs, each as a whole passage
  [91, 1, 15], [97, 1, 5], [98, 1, 8], [99, 1, 8], [100, 1, 11], [101, 1, 11], [102, 1, 8], [104, 1, 9], [105, 1, 5], [106, 1, 4], [107, 1, 7], [109, 1, 6], [111, 1, 5],
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

async function surah(n: number, errs: string[]): Promise<{ name: string; text: Map<number, string>; tafsir: Map<number, string> } | null> {
  try {
    const res = await fetch(`${API}/${n}/editions/${EDITIONS}`, { headers: { accept: "application/json", "user-agent": "JordanGymReviews/1.0 (+https://jordan-gym-reviews.vercel.app)" }, next: { revalidate: 2592000 } }); // text never changes: keep a month
    if (!res.ok) { errs.push(`${n}: HTTP ${res.status}`); console.error(`quran api ${n}: HTTP ${res.status}`); return null; }
    const j = (await res.json()) as { data?: ApiEdition[] };
    if (!Array.isArray(j.data)) { errs.push(`${n}: bad payload`); return null; }
    const q = j.data.find((e) => e.edition.identifier === "quran-uthmani");
    const t = j.data.find((e) => e.edition.identifier === "ar.muyassar");
    if (!q || !t) { errs.push(`${n}: editions missing`); return null; }
    return {
      name: q.name.replace(/^سُورَةُ\s*/, "").replace(/^سورة\s*/, ""),
      text: new Map(q.ayahs.map((a) => [a.numberInSurah, withoutBasmala(a.text, n, a.numberInSurah)])),
      tafsir: new Map(t.ayahs.map((a) => [a.numberInSurah, a.text])),
    };
  } catch (e) { errs.push(`${n}: ${e instanceof Error ? e.message : String(e)}`); return null; }
}

export async function getRestContent(): Promise<RestContent & { errors: string[] }> {
  const errors: string[] = [];
  const refs = [...SHORT, ...LONG];
  const nums = [...new Set(refs.map((r) => r[0]))];
  const loaded = new Map<number, NonNullable<Awaited<ReturnType<typeof surah>>>>();
  // AlQuran.cloud rate-limits bursts (HTTP 429): two surahs at a time, up to two retries with a growing pause.
  let next = 0;
  const worker = async () => {
    while (next < nums.length) {
      const n = nums[next++];
      let s = await surah(n, errors);
      for (let i = 1; !s && i <= 2; i++) { await new Promise((r) => setTimeout(r, 1200 * i)); errors.pop(); s = await surah(n, errors); }
      if (s) loaded.set(n, s);
    }
  };
  await Promise.all(Array.from({ length: 2 }, worker));
  const build = (list: [number, number, number][], kind: string): Passage[] =>
    list.flatMap(([s, from, to]) => {
      const d = loaded.get(s);
      if (!d) return [];
      const verses: Verse[] = [];
      for (let a = from; a <= to; a++) {
        const text = d.text.get(a), tafsir = d.tafsir.get(a);
        if (!text) { errors.push(`${s}:${a}: no text`); return []; }
        verses.push({ n: a, text, tafsir: tafsir ?? "" });
      }
      return [{ id: `${kind}-${s}-${from}-${to}`, surah: s, surahName: d.name, from, to, verses }];
    });
  return { short: build(SHORT, "s"), long: build(LONG, "l"), errors };
}
