const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Uploaded SVG art is served by the API itself and comes back as a path, so it has to be pointed at the API's host. */
export function badgeArtUrl(b: { image_url: string | null; fallback_url?: string | null }): string | null {
  const url = b.image_url ?? b.fallback_url ?? null;
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  try { return new URL(API_URL).origin + url; } catch { return url; }
}

export const BADGE_ART_ACCEPT = "image/png,image/svg+xml";
const RASTER_MAX = 1024 * 1024;
const SVG_MAX = 200 * 1024;

/** A friendly reason the file can't be used, or null when it can. The server checks again. */
export function badgeArtProblem(file: File): string | null {
  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
  if (!isSvg && !isPng) return "Use a PNG or SVG file.";
  if (isSvg && file.size > SVG_MAX) return "SVG files must be under 200 KB.";
  if (isPng && file.size > RASTER_MAX) return "PNG files must be under 1 MB.";
  return null;
}
