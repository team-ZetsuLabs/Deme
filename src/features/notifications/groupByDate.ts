export type DateGroup = 'today' | 'week' | 'earlier';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Regroupe des éléments datés : aujourd'hui, 7 derniers jours, plus ancien. Garde l'ordre reçu. */
export function groupByDate<T extends { createdAt: string }>(
  items: T[],
  now = new Date(),
): { group: DateGroup; items: T[] }[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const groups: Record<DateGroup, T[]> = { today: [], week: [], earlier: [] };
  for (const item of items) {
    const time = new Date(item.createdAt).getTime();
    const group: DateGroup =
      time >= startOfToday ? 'today' : time >= startOfToday - 6 * DAY_MS ? 'week' : 'earlier';
    groups[group].push(item);
  }
  return (['today', 'week', 'earlier'] as DateGroup[])
    .filter((group) => groups[group].length)
    .map((group) => ({ group, items: groups[group] }));
}
