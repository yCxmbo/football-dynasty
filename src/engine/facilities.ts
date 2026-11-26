/* Stadium and facilities. Expand the ground (the seats open next season), and upgrade the training
   ground and youth academy (levels 1–5). Better facilities help development and the youth intake, and cost upkeep. */
import { clamp } from './ratings';
import type { Club, GameState } from './types';

export interface Facilities { training: number; youth: number; expansion?: { seats: number; ready: number } }
export type FacilityKind = 'training' | 'youth';

export const MAX_LEVEL = 5;
export const MAX_CAPACITY = 95_000;
const defaultLevel = (rep: number) => clamp(Math.round(rep / 20), 1, MAX_LEVEL);

export function facilitiesOf(s: GameState, clubId: string): Facilities {
  const c = s.clubs[clubId];
  return c.facilities ?? { training: defaultLevel(c.reputation), youth: defaultLevel(c.reputation) };
}

const scale = (c: Club) => 0.5 + c.reputation / 100;
export const upgradeCost = (c: Club, level: number) => Math.round(3_000_000 * (level + 1) * scale(c) / 100_000) * 100_000;
export const seatCost = (c: Club, seats: number) => Math.round(seats * 3000 * (0.7 + c.reputation / 100) / 100_000) * 100_000;
export const upkeepPerWeek = (s: GameState, clubId: string) => { const f = facilitiesOf(s, clubId); return Math.round((f.training + f.youth) * 4000 * scale(s.clubs[clubId])); };

/** Fans who would come: grows with reputation (a big stadium at a small club stays half empty). */
export const fanBase = (c: Club) => Math.round(2500 + c.reputation * c.reputation * 9);

/* effects (1 / 0 = level 3, the average) */
export const trainingFacilityBoost = (s: GameState) => 1 + (facilitiesOf(s, s.userClubId).training - 3) * 0.04;
export const youthFacilityBonus = (s: GameState) => (facilitiesOf(s, s.userClubId).youth - 3) * 4;

/** Building work comes out of the balance, and the board takes it out of the transfer budget too. */
function pay(s: GameState, c: Club, cost: number) {
  c.balance -= cost;
  c.transferBudget = Math.max(0, c.transferBudget - cost);
  if (s.ledger) s.ledger.expenses.facilities = (s.ledger.expenses.facilities ?? 0) + cost;
}

export function upgrade(s: GameState, kind: FacilityKind): string | null {
  const c = s.clubs[s.userClubId];
  const f = { ...facilitiesOf(s, c.id) };
  if (f[kind] >= MAX_LEVEL) return 'Already the best there is.';
  const cost = upgradeCost(c, f[kind]);
  if (c.balance < cost) return `The board won't approve ${Math.round(cost / 1e5) / 10}M while the club has ${Math.round(c.balance / 1e5) / 10}M.`;
  pay(s, c, cost);
  f[kind]++;
  c.facilities = f;
  return null;
}

export function expandStadium(s: GameState, seats: number): string | null {
  const c = s.clubs[s.userClubId];
  const f = { ...facilitiesOf(s, c.id) };
  if (f.expansion) return `Building work is already under way (${f.expansion.seats.toLocaleString()} seats, ready next season).`;
  if (c.capacity + seats > MAX_CAPACITY) return `The site has room for ${MAX_CAPACITY.toLocaleString()} at most.`;
  const cost = seatCost(c, seats);
  if (c.balance < cost) return `The board won't approve ${Math.round(cost / 1e5) / 10}M while the club has ${Math.round(c.balance / 1e5) / 10}M.`;
  pay(s, c, cost);
  f.expansion = { seats, ready: s.year + 1 };
  c.facilities = f;
  return null;
}

/** Season rollover: finished building work opens. Returns a line for the inbox, if any. */
export function finishBuilding(s: GameState) {
  for (const c of Object.values(s.clubs)) {
    const e = c.facilities?.expansion;
    if (!e || e.ready > s.year) continue;
    c.capacity += e.seats;
    c.facilities = { ...c.facilities!, expansion: undefined };
    if (c.id === s.userClubId) return `The new stands are open: ${c.stadium ?? 'the stadium'} now holds ${c.capacity.toLocaleString()}.`;
  }
  return null;
}
