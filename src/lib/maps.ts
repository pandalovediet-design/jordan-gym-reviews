/** Resolve a Google Maps share link (incl. short maps.app.goo.gl links) to coordinates. Best effort: null on any failure. */
const ALLOWED = /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.|maps\.)?google\.[a-z.]+\/maps)/i;

function parse(text: string): { lat: number; lng: number } | null {
  const pats = [/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|center)=(-?\d{1,2}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/i];
  for (const re of pats) {
    const m = re.exec(text);
    if (m) {
      const lat = Number(m[1]), lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

export async function resolveMapsCoords(url: string): Promise<{ lat: number; lng: number } | null> {
  if (!ALLOWED.test(url)) return null;
  const direct = parse(url);
  if (direct) return direct;
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5000), headers: { "user-agent": "Mozilla/5.0 (compatible; JordanGymReviews/1.0)" } });
    const final = parse(res.url);
    if (final) return final;
    const body = (await res.text()).slice(0, 400_000);
    return parse(body);
  } catch {
    return null;
  }
}

/** Great-circle distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
