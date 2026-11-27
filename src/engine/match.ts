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
  '4-3-2-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'DM', 'CM', 'AM', 'AM', 'ST'],
  '4-2-2-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'AM', 'AM', 'ST', 'ST'],
  '4-2-4': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW'],
  '4-5-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'CM', 'RM', 'ST'],
  '3-4-1-2': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'AM', 'ST', 'ST'],
  '3-5-1-1': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'DM', 'CM', 'RWB', 'AM', 'ST'],
  '5-2-3': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '5-2-1-2': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'AM', 'ST', 'ST'],
} as const;
export type Formation = keyof typeof FORMATIONS;
export const ROLE: Record<string, 'gk' | 'def' | 'mid' | 'att'> = { GK: 'gk', CB: 'def', LB: 'def', RB: 'def', LWB: 'def', RWB: 'def', DM: 'mid', CM: 'mid', AM: 'mid', LM: 'att', RM: 'att', LW: 'att', RW: 'att', ST: 'att' };
export const slotsOf = (f: Formation) => FORMATIONS[f] as readonly string[];

/** Where each slot sits on the pitch (x, y in %), in slot order. */
export const FORMATION_LAYOUT: Record<Formation, Array<[number, number]>> = {
  '4-3-3': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [25, 50], [50, 55], [75, 50], [17, 24], [50, 14], [83, 24]],
  '4-4-2': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [14, 45], [38, 50], [62, 50], [86, 45], [38, 16], [62, 16]],
  '4-2-3-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [37, 57], [63, 57], [17, 35], [50, 37], [83, 35], [50, 14]],
  '3-5-2': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 50], [32, 46], [50, 60], [68, 46], [90, 50], [38, 16], [62, 16]],
  '4-3-3 DM': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [50, 61], [32, 46], [68, 46], [17, 24], [50, 14], [83, 24]],
  '4-1-4-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [50, 61], [14, 40], [37, 44], [63, 44], [86, 40], [50, 15]],
  '4-4-1-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [14, 46], [38, 52], [62, 52], [86, 46], [50, 32], [50, 14]],
  '4-4-2 diamond': [[50, 90], [14, 68], [37, 75], [63, 75], [86, 68], [50, 62], [30, 48], [70, 48], [50, 34], [38, 16], [62, 16]],
  '3-4-3': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 48], [37, 52], [63, 52], [90, 48], [18, 24], [50, 15], [82, 24]],
  '3-4-2-1': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 50], [37, 56], [63, 56], [90, 50], [35, 32], [65, 32], [50, 14]],
  '5-3-2': [[50, 90], [8, 62], [28, 75], [50, 78], [72, 75], [92, 62], [30, 46], [50, 56], [70, 46], [38, 17], [62, 17]],
  '5-4-1': [[50, 90], [8, 64], [28, 76], [50, 78], [72, 76], [92, 64], [14, 42], [38, 48], [62, 48], [86, 42], [50, 16]],
  '4-3-2-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [28, 50], [50, 58], [72, 50], [35, 30], [65, 30], [50, 14]],
  '4-2-2-2': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [37, 57], [63, 57], [22, 36], [78, 36], [38, 16], [62, 16]],
  '4-2-4': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [37, 52], [63, 52], [14, 24], [38, 15], [62, 15], [86, 24]],
  '4-5-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [14, 44], [30, 50], [50, 46], [70, 50], [86, 44], [50, 15]],
  '3-4-1-2': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 50], [37, 54], [63, 54], [90, 50], [50, 34], [38, 16], [62, 16]],
  '3-5-1-1': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 50], [32, 48], [50, 59], [68, 48], [90, 50], [50, 32], [50, 14]],
  '5-2-3': [[50, 90], [8, 62], [28, 75], [50, 78], [72, 75], [92, 62], [37, 52], [63, 52], [18, 26], [50, 16], [82, 26]],
  '5-2-1-2': [[50, 90], [8, 62], [28, 75], [50, 78], [72, 75], [92, 62], [37, 54], [63, 54], [50, 35], [38, 16], [62, 16]],
};

const mapMemo = new Map<string, number[]>();
/** Where each player of one shape goes in another (by slot index): the nearest free slot on the pitch, goalkeeper
    to goalkeeper. Used for a separate out-of-possession shape: wingers drop to wide midfield, a 10 alongside the 9. */
export function shapeMap(from: Formation, to: Formation): number[] {
  const key = from + '>' + to;
  let v = mapMemo.get(key);
  if (v) return v;
  const A = FORMATION_LAYOUT[from], B = FORMATION_LAYOUT[to];
  const pairs: Array<[number, number, number]> = [];
  for (let i = 1; i < A.length; i++) for (let j = 1; j < B.length; j++) pairs.push([Math.hypot(A[i][0] - B[j][0], (A[i][1] - B[j][1]) * 1.2), i, j]);
  pairs.sort((a, b) => a[0] - b[0]);
  v = new Array(A.length).fill(-1); v[0] = 0;
  const used = new Set<number>([0]);
  for (const [, i, j] of pairs) if (v[i] < 0 && !used.has(j)) { v[i] = j; used.add(j); }
  // nearest-first can leave someone a long way out (a winger dropping to wing-back because the wing-back took the
  // wide-midfield slot): swap pairs while the total distance falls
  const d = (i: number, j: number) => Math.hypot(A[i][0] - B[j][0], (A[i][1] - B[j][1]) * 1.2);
  for (let pass = 0; pass < 8; pass++) {
    let better = false;
    for (let i = 1; i < v.length; i++) for (let k = i + 1; k < v.length; k++) {
      if (d(i, v[k]) + d(k, v[i]) < d(i, v[i]) + d(k, v[k]) - 0.01) { const x = v[i]; v[i] = v[k]; v[k] = x; better = true; }
    }
    if (!better) break;
  }
  mapMemo.set(key, v);
  return v;
}


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
