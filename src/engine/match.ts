import { POS_GROUP, clamp } from './ratings';
import type { Rng } from './rng';
import type { MatchEvent, MatchResult, Player, PlayerRating } from './types';

/** Slot order per formation, matching the design system's FormationBoard. */
export const FORMATIONS = {
  '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LW', 'AM', 'RW', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'DM', 'CM', 'RWB', 'ST', 'ST'],
} as const;
export type Formation = keyof typeof FORMATIONS;
const ROLE: Record<string, 'gk' | 'def' | 'mid' | 'att'> = { GK: 'gk', CB: 'def', LB: 'def', RB: 'def', LWB: 'def', RWB: 'def', DM: 'mid', CM: 'mid', AM: 'mid', LM: 'att', RM: 'att', LW: 'att', RW: 'att', ST: 'att' };
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

/** Greedy best XI for a formation from available first-team players. */
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
      const s = p.ability * fitFor(p, slot);
      if (s > bestScore) { bestScore = s; best = p; }
    }
    if (best) { used.add(best.id); result[i] = best.id; }
  }
  return result.filter(Boolean).length === 11 ? result : result.map((id) => id || pool.find((p) => !used.has(p.id))?.id || '');
}

interface Side { players: Player[]; attack: number; mid: number; defence: number; gk: number; defIdx: number[] }

function sideStrength(xi: Player[], formation: Formation): Side {
  const slots = slotsOf(formation);
  const eff = (p: Player, i: number) => p.ability * fitFor(p, slots[i]) * (p.morale === 'high' ? 1.03 : p.morale === 'low' ? 0.96 : 1);
  const idx = (r: string) => slots.map((s, i) => (ROLE[s] === r ? i : -1)).filter((i) => i >= 0);
  const avg = (ix: number[]) => ix.reduce((s, i) => s + eff(xi[i], i), 0) / ix.length;
  return { players: xi, gk: eff(xi[0], 0), defence: avg(idx('def')), mid: avg(idx('mid')), attack: avg(idx('att')), defIdx: [0, ...idx('def')] };
}

function poisson(rng: Rng, lambda: number) {
  const L = Math.exp(-lambda); let k = 0, p = 1;
  do { k++; p *= rng.next(); } while (p > L);
  return k - 1;
}

const surname = (p: Player) => { const i = p.name.indexOf(' '); return i < 0 ? p.name : p.name.slice(i + 1); };

const SCORER_WEIGHT: Record<string, number> = { GK: 0, CB: 0.6, FB: 0.5, DM: 0.6, CM: 1.2, AM: 2.2, W: 2.6, ST: 4.2 };

export function simulateMatch(rng: Rng, home: Player[], away: Player[], homeName: string, awayName: string, venue: string, homeFormation: Formation = '4-3-3', awayFormation: Formation = '4-3-3'): MatchResult {
  const H = sideStrength(home, homeFormation), A = sideStrength(away, awayFormation);
  const attackH = (H.attack * 0.6 + H.mid * 0.4) / (A.defence * 0.7 + A.gk * 0.3);
  const attackA = (A.attack * 0.6 + A.mid * 0.4) / (H.defence * 0.7 + H.gk * 0.3);
  const xgH = clamp(1.32 * Math.pow(attackH, 2.6) * 1.12, 0.2, 4.2);
  const xgA = clamp(1.32 * Math.pow(attackA, 2.6), 0.2, 4.2);
  const goalsH = poisson(rng, xgH), goalsA = poisson(rng, xgA);
  const poss = clamp(Math.round(50 + (H.mid - A.mid) * 0.45 + rng.normal(2, 3)), 30, 70);

  const ratings = new Map<string, PlayerRating>();
  for (const p of [...home, ...away]) ratings.set(p.id, { playerId: p.id, rating: 6.4 + rng.normal(0, 0.35), goals: 0, assists: 0, minutes: 90 });

  type Pending = Omit<MatchEvent, 'order' | 'score'> & { goalSide?: 'home' | 'away' };
  const evs: Pending[] = [];
  const pickMinute = () => rng.int(1, 90);
  const scorer = (side: Player[]) => rng.weighted(side, (p) => (SCORER_WEIGHT[POS_GROUP[p.pos]] ?? 1) * (p.attributes['Finishing'] / 10));
  const assister = (side: Player[], not: Player) => rng.weighted(side.filter((p) => p !== not), (p) => ((POS_GROUP[p.pos] === 'GK' ? 0.1 : 1) * p.attributes['Passing']) / 10);

  const addGoals = (n: number, side: Player[], s: 'home' | 'away') => {
    for (let i = 0; i < n; i++) {
      const sc = scorer(side);
      const pen = rng.chance(0.08);
      const as = pen ? undefined : assister(side, sc);
      const r = ratings.get(sc.id)!; r.goals++; r.rating += 1.1;
      if (as) { const ra = ratings.get(as.id)!; ra.assists++; ra.rating += 0.6; }
      const lines = pen
        ? [`${sc.name} sends the keeper the wrong way from the spot.`]
        : [`${sc.name} finishes clinically${as ? ` after ${surname(as)}'s pass` : ''}.`, `${sc.name} curls it into the top corner!${as ? ` ${surname(as)} with the assist.` : ''}`,
           `${sc.name} gets on the end of ${as ? surname(as) + "'s" : 'a'} cross and heads it in.`, `${sc.name} slots it under the keeper${as ? `; ${surname(as)} split the defence` : ''}.`];
      evs.push({ minute: pickMinute(), type: pen ? 'penalty' : 'goal', side: s, playerId: sc.id, player: surname(sc), text: rng.pick(lines), goalSide: s });
    }
  };
  addGoals(goalsH, home, 'home'); addGoals(goalsA, away, 'away');

  const cards = (side: Player[], s: 'home' | 'away', opp: Player[]) => {
    const n = poisson(rng, 1.7);
    for (let i = 0; i < n; i++) {
      const p = rng.weighted(side, (x) => x.attributes['Aggression'] + (POS_GROUP[x.pos] === 'GK' ? -15 : 0));
      const r = ratings.get(p.id)!;
      const victim = rng.pick(opp);
      if (r.card === 'yellow' && rng.chance(0.25)) {
        r.card = 'red'; r.rating -= 1;
        evs.push({ minute: pickMinute(), type: 'red', side: s, playerId: p.id, player: surname(p), text: `${p.name} is sent off for a second yellow card!` });
      } else if (!r.card) {
        r.card = 'yellow'; r.rating -= 0.2;
        evs.push({ minute: pickMinute(), type: 'yellow', side: s, playerId: p.id, player: surname(p), text: `${p.name} is booked for a late challenge on ${surname(victim)}.` });
      }
    }
    if (rng.chance(0.025)) {
      const p = rng.pick(side.slice(1)); const r = ratings.get(p.id)!;
      if (!r.card) { r.card = 'red'; r.rating -= 1.2; evs.push({ minute: pickMinute(), type: 'red', side: s, playerId: p.id, player: surname(p), text: `Straight red! ${p.name} is off for a dangerous tackle.` }); }
    }
  };
  cards(home, 'home', away); cards(away, 'away', home);

  for (const [side, s] of [[home, 'home'], [away, 'away']] as const) {
    const injChance = 0.08;
    if (rng.chance(injChance)) {
      const p = rng.weighted(side, (x) => x.hidden.injuryProneness);
      const r = ratings.get(p.id)!; r.injured = true; r.minutes = pickMinute(); r.subbedOff = r.minutes;
      evs.push({ minute: r.minutes, type: 'injury', side: s, playerId: p.id, player: surname(p), text: `${p.name} pulls up and has to be replaced.` });
    }
  }

  // filler chances and saves
  const nChances = rng.int(3, 6);
  for (let i = 0; i < nChances; i++) {
    const s = rng.chance(poss / 100) ? 'home' : 'away';
    const att = s === 'home' ? home : away, def = s === 'home' ? away : home;
    const p = scorer(att);
    if (rng.chance(0.5)) {
      ratings.get(def[0].id)!.rating += 0.25;
      evs.push({ minute: pickMinute(), type: 'save', side: s === 'home' ? 'away' : 'home', text: `${def[0].name} denies ${surname(p)} with a fine save.` });
    } else {
      evs.push({ minute: pickMinute(), type: 'chance', side: s, text: rng.pick([`${p.name} drags a shot just wide.`, `${p.name} heads over from a corner.`, `Chance for ${surname(p)}, but it's blocked.`]) });
    }
  }

  // team result adjusts ratings
  for (const p of home) ratings.get(p.id)!.rating += goalsH > goalsA ? 0.35 : goalsH < goalsA ? -0.3 : 0;
  for (const p of away) ratings.get(p.id)!.rating += goalsA > goalsH ? 0.35 : goalsA < goalsH ? -0.3 : 0;
  // clean sheets
  if (goalsA === 0) for (const i of H.defIdx) ratings.get(home[i].id)!.rating += 0.4;
  if (goalsH === 0) for (const i of A.defIdx) ratings.get(away[i].id)!.rating += 0.4;
  for (const r of ratings.values()) r.rating = Math.round(clamp(r.rating, 4.5, 10) * 10) / 10;

  evs.sort((a, b) => a.minute - b.minute);
  let h = 0, a = 0;
  const events: MatchEvent[] = [{ minute: 0, order: 0, type: 'whistle', text: `Kick-off at ${venue}.` }];
  evs.forEach((e, i) => {
    const ev: MatchEvent = { minute: e.minute, order: i + 1, type: e.type, side: e.side, playerId: e.playerId, player: e.player, text: e.text };
    if (e.goalSide) { if (e.goalSide === 'home') h++; else a++; ev.score = [h, a]; }
    events.push(ev);
    if (e.minute <= 45 && (evs[i + 1]?.minute ?? 99) > 45) events.push({ minute: 45, order: 900, type: 'whistle', text: `Half time: ${homeName} ${h}–${a} ${awayName}.` });
  });
  if (!events.some((e) => e.minute === 45 && e.type === 'whistle')) events.splice(1, 0, { minute: 45, order: 900, type: 'whistle', text: `Half time: ${homeName} ${h}–${a} ${awayName}.` });
  events.push({ minute: 90, order: 999, type: 'whistle', text: `Full time: ${homeName} ${goalsH}–${goalsA} ${awayName}.` });

  const shotsH = Math.max(goalsH, Math.round(xgH * 7 + rng.int(0, 4))), shotsA = Math.max(goalsA, Math.round(xgA * 7 + rng.int(0, 4)));
  const yel = (side: Player[]) => side.filter((p) => ratings.get(p.id)!.card === 'yellow').length;
  const red = (side: Player[]) => side.filter((p) => ratings.get(p.id)!.card === 'red').length;
  return {
    score: [goalsH, goalsA],
    events: events.sort((x, y) => x.minute - y.minute || x.order - y.order),
    stats: {
      possession: [poss, 100 - poss], shots: [shotsH, shotsA],
      onTarget: [Math.max(goalsH, Math.round(shotsH * 0.4)), Math.max(goalsA, Math.round(shotsA * 0.4))],
      xg: [Math.round(xgH * 100) / 100, Math.round(xgA * 100) / 100], corners: [rng.int(2, 9), rng.int(2, 9)], fouls: [rng.int(7, 15), rng.int(7, 15)],
      yellow: [yel(home), yel(away)], red: [red(home), red(away)],
      passAcc: [clamp(Math.round(72 + (H.mid - 100) * 0.25 + rng.normal(0, 2)), 60, 93), clamp(Math.round(72 + (A.mid - 100) * 0.25 + rng.normal(0, 2)), 60, 93)],
    },
    ratings: { home: home.map((p) => ratings.get(p.id)!), away: away.map((p) => ratings.get(p.id)!) },
  };
}
