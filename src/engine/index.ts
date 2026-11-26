/* Squad lookups. While a calendar slot is played (where nobody changes club) an index makes them O(1);
   otherwise they scan all players. */
import type { GameState, Player } from './types';

let active: { state: GameState; byClub: Map<string, Player[]> } | null = null;

export function withSquadIndex<T>(state: GameState, fn: () => T): T {
  const byClub = new Map<string, Player[]>();
  for (const p of Object.values(state.players)) {
    const list = byClub.get(p.clubId);
    if (list) list.push(p); else byClub.set(p.clubId, [p]);
  }
  const prev = active;
  active = { state, byClub };
  try { return fn(); } finally { active = prev; }
}

export function squadOf(state: GameState, clubId: string): Player[] {
  if (active && active.state === state) return active.byClub.get(clubId) ?? [];
  return Object.values(state.players).filter((p) => p.clubId === clubId);
}

export const wageBillOf = (s: GameState, clubId: string) => squadOf(s, clubId).reduce((a, p) => a + p.wage, 0);
