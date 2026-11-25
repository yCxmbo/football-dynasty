import { POS_GROUP } from './ratings';
import type { Player } from './types';

/** Slot order per formation, matching the design system's FormationBoard. */
export const FORMATIONS = {
  '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LW', 'AM', 'RW', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'DM', 'CM', 'RWB', 'ST', 'ST'],
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

/** Greedy best XI for a formation from available first-team players; tired players drop down the order. */
export function pickLineup(squad: Player[], formation: Formation = '4-3-3'): string[] {
  const slots = slotsOf(formation);
  const pool = squad.filter((p) => p.squad === 'First team' && available(p));
  const used = new Set<string>();
  const order = slots.map((s, i) => ({ s, i })).sort((a, b) => ['gk', 'def', 'mid', 'att'].indexOf(ROLE[a.s]) - ['gk', 'def', 'mid', 'att'].indexOf(ROLE[b.s])).map((x) => x.i);
  const result: string[] = new Array(slots.length).fill('');
  for (const i of order) {
    const slot = slots[i];
    let best: Player | undefined, bestScore = -1;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const c = p.condition ?? 100;
      const s = p.ability * fitFor(p, slot) * (c >= 85 ? 1 : 0.7 + c * 0.0035) * (c < 60 ? 0.85 : 1);
      if (s > bestScore) { bestScore = s; best = p; }
    }
    if (best) { used.add(best.id); result[i] = best.id; }
  }
  return result.filter(Boolean).length === 11 ? result : result.map((id) => id || pool.find((p) => !used.has(p.id))?.id || '');
}

export interface MatchMods { homeBoost?: number; awayBoost?: number; homeInjury?: number; awayInjury?: number; neutral?: boolean; knockout?: boolean }
