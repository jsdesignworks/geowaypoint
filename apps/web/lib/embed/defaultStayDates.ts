/** Default quote window for guest book flow (mirrors apps/embed `defaultStayDates`). */
export function defaultStayDates(): { Arrival: string; Departure: string } {
  const a = new Date();
  const d = new Date(a);
  d.setDate(d.getDate() + 7);
  return { Arrival: a.toISOString().slice(0, 10), Departure: d.toISOString().slice(0, 10) };
}
