/** Spec §8 — status-driven hotspot colors (primary). */
export const STATUS_HOTSPOT_COLORS: Record<string, string> = {
  available: '#2D6B42',
  occupied: '#8B2D2D',
  reserved: '#7A4818',
  maintenance: '#5A5A58',
};

/** Fallback cycle when status unknown */
export const HSPOT_COLORS = [
  '#2D6B42',
  '#1b6b93',
  '#bc6c25',
  '#6c4ab6',
  '#c1121f',
  '#0077b6',
  '#fb8500',
] as const;

export function hotspotColorForStatus(status: string | null | undefined, index: number): string {
  const k = (status ?? 'available').toLowerCase();
  return STATUS_HOTSPOT_COLORS[k] ?? HSPOT_COLORS[index % HSPOT_COLORS.length];
}
