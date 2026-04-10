/** Lowercase hyphenated slug from display name (spec §5 onboarding). */
export function slugifyResortName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'resort';
}
