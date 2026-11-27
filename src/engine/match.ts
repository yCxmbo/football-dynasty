import { POS_GROUP } from './ratings';
import type { Player } from './types';

/** Slot order per formation, matching the design system's FormationBoard. */
export const FORMATIONS = {
  '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LW', 'AM', 'RW', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'DM', 'CM', 'RWB', 'ST', 'ST'],
  '4-3-3 DM': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '4-1-4-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'LM', 'CM', 'CM', 'RM', 'ST'],
  '4-4-1-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'AM', 'ST'],
  '4-4-2 diamond': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'AM', 'ST', 'ST'],
  '3-4-3': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'LW', 'ST', 'RW'],
  '3-4-2-1': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'AM', 'AM', 'ST'],
  '5-3-2': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'DM', 'CM', 'ST', 'ST'],
  '5-4-1': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'LM', 'CM', 'CM', 'RM', 'ST'],
} as const;
export type Formation = keyof typeof FORMATIONS;
export const ROLE: Record<string, 'gk' | 'def' | 'mid' | 'att'> = { GK: 'gk', CB: 'def', LB: 'def', RB: 'def', LWB: 'def', RWB: 'def', DM: 'mid', CM: 'mid', AM: 'mid', LM: 'att', RM: 'att', LW: 'att', RW: 'att', ST: 'att' };
export const slotsOf = (f: Formation) => FORMATIONS[f] as readonly string[];

const FIT_PENALTY: Record<string, number> = { natural: 1, accomplished: 0.96, competent: 0.9, unconvincing: 0.8, awkward: 0.65 };

export function fitFor(p: Player, slot: string) {
  if (p.pos === slot) return 1;
  if ((({ LW: 'LM', RW: 'RM', LB: 'LWB', RB: 'RWB' }) as Record<string, string>)[p.pos] === slot) return FIT_PENALTY.accomplished;
  const f = p.positions[slot];
  if (f) return FIT_PENALTY[f];
  if (POS_GROUP[p.pos] === POS_GROUP[slot]) return 0.95;
  return slot === 'GK' || p.pos === 'GK' ? 0.3 : 0.65;
}

export function available(p: Player) { return p.injuredFor === 0 && p.suspendedFor === 0; }

/** Best XI for a formation from available first-team players (tired players drop down the order): a greedy
    pick by unit (keeper, defence, midfield, attack), then swaps that fix anyone stranded out of position. */
export function pickLineup(squad: Player[], formation: Formation = '4-3-3'): string[] {
  const slots = slotsOf(formation);
  const pool = squad.filter((p) => p.squad === 'First team' && available(p));
  // each candidate's value in each slot, worked out once
  const V = pool.map((p) => slots.map((s) => slotValue(p, s)));
  const used = new Set<number>();
  const order = slots.map((s, i) => ({ s, i })).sort((a, b) => ['gk', 'def', 'mid', 'att'].indexOf(ROLE[a.s]) - ['gk', 'def', 'mid', 'att'].indexOf(ROLE[b.s])).map((x) => x.i);
  const pick: number[] = new Array(slots.length).fill(-1);
  for (const i of order) {
    let best = -1, bestScore = -1;
    for (let k = 0; k < pool.length; k++) if (!used.has(k) && V[k][i] > bestScore) { bestScore = V[k][i]; best = k; }
    if (best >= 0) { used.add(best); pick[i] = best; }
  }
  // usually everyone is already in a natural position: nothing to improve
  const natural = pick.every((k, i) => k >= 0 && fitFor(pool[k], slots[i]) === 1 && (pool[k].condition ?? 100) >= 85);
  const xi = natural ? pick : improveIndices(pick, V, pool.length);
  return xi.map((k) => (k >= 0 ? pool[k].id : ''));
}

/** Selection value of a player in a slot: ability, position fit and (for tired players) condition. */
function slotValue(p: Player, slot: string) {
  const c = p.condition ?? 100;
  return p.ability * fitFor(p, slot) * (c >= 85 ? 1 : 0.7 + c * 0.0035) * (c < 60 ? 0.85 : 1);
}

/** Swaps pairs in the eleven, and starters with unused candidates, while the total value rises. `xi` holds
    candidate indices (-1 for an empty slot, which stays empty). */
function improveIndices(start: number[], V: number[][], n: number): number[] {
  const xi = [...start];
  const val = (k: number, i: number) => (k < 0 ? 0 : V[k][i]);
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (let i = 0; i < xi.length; i++) for (let j = i + 1; j < xi.length; j++) {
      const a = xi[i], b = xi[j];
      if (a < 0 || b < 0) continue;
      if (V[b][i] + V[a][j] > V[a][i] + V[b][j] + 0.01) { xi[i] = b; xi[j] = a; changed = true; }
    }
    const inXi = new Set(xi);
    for (let i = 0; i < xi.length; i++) {
      if (xi[i] < 0) continue;
      for (let k = 0; k < n; k++) {
        if (inXi.has(k)) continue;
        if (V[k][i] > val(xi[i], i) + 0.01) { inXi.delete(xi[i]); xi[i] = k; inXi.add(k); changed = true; }
      }
    }
    if (!changed) break;
  }
  return xi;
}

/** Greedy filling can strand a player out of position (a striker on the wing because he can play there, the winger
    then up front). Improves a given eleven by swaps; an empty slot (a player sent off) stays empty. */
export function improveLineup(ids: string[], slots: readonly string[], pool: Player[]): string[] {
  const idx = new Map(pool.map((p, k) => [p.id, k]));
  const V = pool.map((p) => slots.map((s) => slotValue(p, s)));
  const xi = improveIndices(ids.map((id) => idx.get(id) ?? -1), V, pool.length);
  return xi.map((k, i) => (k < 0 ? ids[i] : pool[k].id));
}

export interface MatchMods { homeBoost?: number; awayBoost?: number; homeInjury?: number; awayInjury?: number; neutral?: boolean; knockout?: boolean; /** A derby's name: more fouls and cards. */ derby?: string }
