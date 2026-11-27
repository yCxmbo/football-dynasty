/* Squad lookups. Inside withSquadIndex an index makes them fast; otherwise they scan all players.
   The index stays correct while players change: entries that left a club (or retired) are dropped on lookup,
   and code that adds a player to a club calls noteJoined. */
import type { GameState, Player } from './types';

let active: { state: GameState; byClub: Map<string, Player[]> } | null = null;

export function withSquadIndex<T>(state: GameState, fn: () => T): T {
  if (active && active.state === state) return fn(); // already indexed: reuse it
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
  if (active && active.state === state) {
    const list = active.byClub.get(clubId);
    if (!list) return [];
    if (list.some((p) => p.clubId !== clubId || state.players[p.id] !== p)) {
      const fresh = list.filter((p, i) => p.clubId === clubId && state.players[p.id] === p && list.indexOf(p) === i);
      active.byClub.set(clubId, fresh);
      return fresh;
    }
    return list;
  }
  return Object.values(state.players).filter((p) => p.clubId === clubId);
}

export const wageBillOf = (s: GameState, clubId: string) => squadOf(s, clubId).reduce((a, p) => a + p.wage, 0);

/** Call after a player is created at, or moves to, a club (state.players[p.id] and p.clubId already set). */
export function noteJoined(state: GameState, p: Player) {
  if (!active || active.state !== state) return;
  const list = active.byClub.get(p.clubId);
  if (!list) active.byClub.set(p.clubId, [p]); else if (!list.includes(p)) list.push(p);
}
