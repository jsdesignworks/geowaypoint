/** Short marker label for guest map (DB column, name pattern, or grid fallback). */
export function siteDisplayCode(site: {
  display_code?: string | null;
  name: string;
  index: number;
}): string {
  const dc = site.display_code?.trim();
  if (dc) {
    return dc.slice(0, 6).toUpperCase();
  }
  const name = site.name?.trim() ?? '';
  const m = name.match(/^([A-Za-z]{1,3}\d{1,3})\b/);
  if (m) {
    return m[1].toUpperCase();
  }
  if (name.length > 0 && name.length <= 5) {
    return name.toUpperCase();
  }
  const i = site.index;
  const row = String.fromCharCode(65 + (i % 26));
  return `${row}${Math.floor(i / 26) + 1}`;
}
