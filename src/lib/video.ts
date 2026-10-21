export type Platform = "youtube" | "instagram" | "tiktok" | "facebook";
export type ParsedVideo = { platform: Platform; url: string; embed: string | null; thumb: string | null };

export const PLATFORM_LABEL: Record<Platform, string> = { youtube: "يوتيوب", instagram: "إنستغرام", tiktok: "تيك توك", facebook: "فيسبوك" };

/** Understands a pasted link from any supported platform. Returns null when it is not a link we can show. */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.|vm\.|vt\.)/, "");
  const clean = `${u.origin}${u.pathname}`;
  if (host === "youtu.be" || host === "youtube.com") {
    const id = host === "youtu.be" ? u.pathname.slice(1).split("/")[0]
      : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1];
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { platform: "youtube", url: `https://www.youtube.com/shorts/${id}`, embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }
  if (host === "instagram.com") {
    const m = u.pathname.match(/^\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    if (!m) return null;
    const kind = m[1] === "reels" ? "reel" : m[1];
    return { platform: "instagram", url: `https://www.instagram.com/${kind}/${m[2]}/`, embed: `https://www.instagram.com/${kind}/${m[2]}/embed`, thumb: null };
  }
  if (host === "tiktok.com") {
    const id = u.pathname.match(/\/video\/(\d{8,25})/)?.[1];
    if (!id) return null; // short links (vm.tiktok.com/xxx) can't be embedded: ask for the full link
    return { platform: "tiktok", url: clean, embed: `https://www.tiktok.com/embed/v2/${id}`, thumb: null };
  }
  if (host === "facebook.com" || host === "fb.watch") {
    if (host === "facebook.com" && !/\/(reel|reels|watch|videos|share\/[rv])/.test(u.pathname) && !u.searchParams.get("v")) return null;
    return { platform: "facebook", url: host === "fb.watch" || u.searchParams.get("v") ? u.toString().split("#")[0] : clean, embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.host === "fb.watch" ? clean : u.searchParams.get("v") ? u.toString() : clean)}&show_text=false&autoplay=true`, thumb: null };
  }
  return null;
}
