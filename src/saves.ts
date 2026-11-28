/* Save slots and automatic backups for a career. The saves live in IndexedDB beside the career's own save; a
   small index per career lives in localStorage. Automatic backups: one per new in-game day (the latest two kept)
   and one at the start of each season (the latest kept). Manual slots: up to five, named. */
import { seasonLabel, type GameState } from './engine/types';
import { idbDel, idbGet, idbPut } from './idb';

export type SlotKind = 'manual' | 'day' | 'season';
export interface SlotMeta { key: string; kind: SlotKind; name: string; day: string; season: string; club: string; at: number }
export const MAX_MANUAL = 5, KEEP_DAYS = 2, KEEP_SEASONS = 1;

const indexKey = (careerId: string) => `football-dynasty:slots:${careerId}`;
export function readSlots(careerId: string): SlotMeta[] {
  try { return JSON.parse(localStorage.getItem(indexKey(careerId)) ?? '[]') as SlotMeta[]; } catch { return []; }
}
function writeSlots(careerId: string, list: SlotMeta[]) { try { localStorage.setItem(indexKey(careerId), JSON.stringify(list)); } catch { /* ignore */ } }

const dayOf = (g: GameState) => g.today ?? g.calendar[Math.min(g.matchday, g.calendar.length) - 1]?.date ?? '';
const meta = (key: string, kind: SlotKind, name: string, g: GameState): SlotMeta => ({ key, kind, name, day: dayOf(g), season: seasonLabel(g.year), club: g.clubs[g.userClubId]?.name ?? '', at: Date.now() });

/** Which automatic backups to make now, and which old ones to drop (pure: works on the index only). */
export function planBackups(careerId: string, list: SlotMeta[], g: GameState): { add: SlotMeta[]; drop: SlotMeta[] } {
  const add: SlotMeta[] = [], day = dayOf(g), season = seasonLabel(g.year);
  const days = list.filter((s) => s.kind === 'day'), seasons = list.filter((s) => s.kind === 'season');
  if (day && !days.some((s) => s.day === day)) add.push(meta(`${careerId}:day:${day}`, 'day', 'Automatic backup', g));
  if (!seasons.some((s) => s.season === season)) add.push(meta(`${careerId}:season:${season}`, 'season', `Start of ${season}`, g));
  const keepDays = [...add.filter((s) => s.kind === 'day'), ...days].sort((a, b) => b.day.localeCompare(a.day)).slice(0, KEEP_DAYS);
  const keepSeasons = [...add.filter((s) => s.kind === 'season'), ...seasons].sort((a, b) => b.season.localeCompare(a.season)).slice(0, KEEP_SEASONS);
  const keep = new Set([...keepDays, ...keepSeasons].map((s) => s.key));
  return { add: add.filter((s) => keep.has(s.key)), drop: [...days, ...seasons].filter((s) => !keep.has(s.key)) };
}

/** After an autosave: make due backups and drop stale ones. */
export async function autoBackup(careerId: string, g: GameState) {
  const list = readSlots(careerId);
  const { add, drop } = planBackups(careerId, list, g);
  if (!add.length && !drop.length) return;
  for (const s of add) await idbPut(s.key, g);
  for (const s of drop) await idbDel(s.key).catch(() => undefined);
  const dropped = new Set(drop.map((s) => s.key));
  writeSlots(careerId, [...add, ...list.filter((s) => !dropped.has(s.key))]);
}

export async function saveManual(careerId: string, g: GameState, name: string): Promise<string | null> {
  const list = readSlots(careerId);
  if (list.filter((s) => s.kind === 'manual').length >= MAX_MANUAL) return `You have ${MAX_MANUAL} saves already. Delete one first.`;
  const s = meta(`${careerId}:slot:${Date.now()}`, 'manual', name.trim() || `Save · ${dayOf(g)}`, g);
  await idbPut(s.key, g);
  writeSlots(careerId, [s, ...list]);
  return null;
}
export async function loadSlot(key: string) { return idbGet<GameState>(key); }
export async function deleteSlot(careerId: string, key: string) {
  await idbDel(key).catch(() => undefined);
  writeSlots(careerId, readSlots(careerId).filter((s) => s.key !== key));
}
/** Removes every slot of a career (when the career is deleted). */
export async function deleteAllSlots(careerId: string) {
  for (const s of readSlots(careerId)) await idbDel(s.key).catch(() => undefined);
  try { localStorage.removeItem(indexKey(careerId)); } catch { /* ignore */ }
}
