/* The players picked for comparison, kept while the game is open (up to three). */
export const MAX_COMPARE = 3;
let ids: string[] = [];
const listeners = new Set<() => void>();
export const compareIds = () => ids;
export function setCompare(next: string[]) { ids = next.slice(0, MAX_COMPARE); listeners.forEach((f) => f()); }
/** Adds a player (dropping the oldest when full), or removes him if he's already there. */
export function toggleCompare(id: string) {
  setCompare(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-MAX_COMPARE));
}
export function onCompareChange(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }
