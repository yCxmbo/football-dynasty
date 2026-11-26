/* Minute-by-minute match engine. Every match runs through it: the user's match is ticked live
   (so substitutions change the outcome), every other match is ticked straight to full time.
   A LiveMatch is plain data so it can sit in React state and be cloned cheaply. */
import { fitFor, ROLE, slotsOf, type Formation, type MatchMods } from './match';
import { POS_GROUP, clamp } from './ratings';
import { createRng, type Rng } from './rng';
import type { MatchEvent, MatchResult, Player, PlayerRating } from './types';

const KEY_ATTRS = ['Finishing', 'Passing', 'Aggression', 'Composure', 'Penalties', 'One on Ones', 'Reflexes', 'Stamina', 'Natural Fitness'] as const;
export interface Snap {
  id: string; name: string; number: number; pos: string; positions: Player['positions']; ability: number; morale: Player['morale'];
  attrs: Record<(typeof KEY_ATTRS)[number], number>; injuryProneness: number; condition: number;
}
export const snap = (p: Player): Snap => ({
  id: p.id, name: p.name, number: p.number, pos: p.pos, positions: p.positions, ability: p.ability, morale: p.morale,
  attrs: Object.fromEntries(KEY_ATTRS.map((k) => [k, p.attributes[k] ?? 10])) as Snap['attrs'], injuryProneness: p.hidden.injuryProneness, condition: p.condition ?? 100,
});

interface Perf { base: number; goals: number; assists: number; saves: number; card?: 'yellow' | 'red'; onAt: number; offAt?: number; injured?: boolean }
type SideKey = 'home' | 'away';
export interface LiveSide { formation: Formation; xi: Array<string | null>; bench: string[]; subsUsed: number; boost: number; injury: number; user: boolean; name: string; /** Style tilt: attack and defence multipliers. */ atk?: number; def?: number; /** Team talks count this much more. */ talk?: number }
export interface LiveMatch {
  rng: number; minute: number; done: boolean; neutral: boolean; knockout: boolean; venue: string; derby?: string;
  home: LiveSide; away: LiveSide;
  score: [number, number]; pens?: [number, number]; events: MatchEvent[]; order: number;
  /** Team talks given by the user (before kickoff, at half-time). */
  talks?: { pre?: TalkTone; ht?: TalkTone };
  stats: { shots: [number, number]; onTarget: [number, number]; xg: [number, number]; corners: [number, number]; fouls: [number, number]; possession: number; passAcc: [number, number] };
  players: Record<string, Snap>; perf: Record<string, Perf>;
  /** Which side each squad member belongs to. */
  sideOf: Record<string, SideKey>;
}

export const MAX_SUBS = 5;
const SCORER_WEIGHT: Record<string, number> = { GK: 0, CB: 0.6, FB: 0.5, DM: 0.6, CM: 1.2, AM: 2.2, W: 2.6, ST: 4.2 };
const surname = (n: string) => { const i = n.indexOf(' '); return i < 0 ? n : n.slice(i + 1); };

/** Tired players play worse: full strength above 85%, about −10% at 55%. */
export const conditionFactor = (c: number) => (c >= 85 ? 1 : 0.7 + c * 0.0035);

export function createLive(seed: number, home: { xi: Player[]; bench: Player[]; formation: Formation; name: string; user?: boolean; tilt?: { atk: number; def: number; talk: number } }, away: typeof home, venue: string, mods: MatchMods = {}): LiveMatch {
  const rng = createRng(seed);
  const players: Record<string, Snap> = {}, perf: Record<string, Perf> = {};
  const sideOf: Record<string, SideKey> = {};
  for (const p of [...home.xi, ...home.bench]) { players[p.id] = snap(p); sideOf[p.id] = 'home'; }
  for (const p of [...away.xi, ...away.bench]) { players[p.id] = snap(p); sideOf[p.id] = 'away'; }
  for (const p of [...home.xi, ...away.xi]) perf[p.id] = { base: 6.3 + rng.normal(0, 0.3), goals: 0, assists: 0, saves: 0, onAt: 0 };
  const side = (s: typeof home, boost = 1, injury = 1): LiveSide => ({ formation: s.formation, xi: s.xi.map((p) => p.id), bench: s.bench.map((p) => p.id), subsUsed: 0, boost, injury, user: !!s.user, name: s.name, ...(s.tilt ? { atk: s.tilt.atk, def: s.tilt.def, talk: s.tilt.talk } : {}) });
  return {
    rng: rng.state(), minute: 0, done: false, neutral: !!mods.neutral, knockout: !!mods.knockout, venue, ...(mods.derby ? { derby: mods.derby } : {}),
    home: side(home, mods.homeBoost, mods.homeInjury), away: side(away, mods.awayBoost, mods.awayInjury),
    score: [0, 0], events: [{ minute: 0, order: 0, type: 'whistle', text: mods.derby ? `Derby day: ${mods.derby}. Kick-off at ${venue}, and the noise is deafening.` : mods.neutral ? 'Kick-off at the national stadium.' : `Kick-off at ${venue}.` }], order: 1,
    stats: { shots: [0, 0], onTarget: [0, 0], xg: [0, 0], corners: [0, 0], fouls: [0, 0], possession: 0, passAcc: [0, 0] },
    players, perf, sideOf,
  };
}

const ROLE_IDX = new Map<string, number[]>();
function roleIdx(f: Formation, r: string) {
  const key = `${f}|${r}`;
  let v = ROLE_IDX.get(key);
  if (!v) { v = slotsOf(f).map((x, i) => (ROLE[x] === r ? i : -1)).filter((i) => i >= 0); ROLE_IDX.set(key, v); }
  return v;
}

/** Team strength changes slowly (fatigue) or on a change of personnel: recompute every three minutes or when the XI changes. */
const strengthCache = new WeakMap<LiveSide, { at: number; sig: string; val: ReturnType<typeof computeStrength> }>();
function strength(lm: LiveMatch, s: LiveSide) {
  const sig = s.xi.join(',') + s.boost;
  const c = strengthCache.get(s);
  if (c && c.sig === sig && lm.minute - c.at < 3) return c.val;
  const val = computeStrength(lm, s);
  strengthCache.set(s, { at: lm.minute, sig, val });
  return val;
}

function computeStrength(lm: LiveMatch, s: LiveSide) {
  const slots = slotsOf(s.formation);
  const eff = (id: string | null, i: number) => {
    if (!id) return 0;
    const p = lm.players[id];
    return p.ability * fitFor(p as unknown as Player, slots[i]) * (p.morale === 'high' ? 1.03 : p.morale === 'low' ? 0.96 : 1) * conditionFactor(p.condition);
  };
  const idx = (r: string) => roleIdx(s.formation, r);
  const avg = (ix: number[]) => ix.reduce((a, i) => a + eff(s.xi[i], i), 0) / ix.length;
  const k = s.boost;
  return { gk: eff(s.xi[0], 0) * k, defence: avg(idx('def')) * k, mid: avg(idx('mid')) * k, attack: avg(idx('att')) * k, defIdx: [0, ...idx('def')] };
}

const onPitch = (s: LiveSide) => s.xi.filter((x): x is string => !!x);

function push(lm: LiveMatch, e: Omit<MatchEvent, 'order'>) { lm.events.push({ ...e, order: lm.order++ }); }

function bestReplacement(lm: LiveMatch, s: LiveSide, slot: string) {
  return s.bench.filter((id) => !lm.perf[id]).map((id) => lm.players[id]).sort((a, b) => b.ability * fitFor(b as unknown as Player, slot) * conditionFactor(b.condition) - a.ability * fitFor(a as unknown as Player, slot) * conditionFactor(a.condition))[0];
}

/** Swaps a player on the pitch for one on the bench. Returns an error message or null. */
export function substitute(lm: LiveMatch, key: SideKey, offId: string, onId: string, forced = false): string | null {
  const s = lm[key];
  if (lm.done) return 'The match is over.';
  if (s.subsUsed >= MAX_SUBS) return `All ${MAX_SUBS} substitutions are used.`;
  const i = s.xi.indexOf(offId);
  if (i < 0) return 'That player is not on the pitch.';
  if (!s.bench.includes(onId) || lm.perf[onId]) return 'That player is not available to come on.';
  s.xi[i] = onId;
  s.subsUsed++;
  lm.perf[offId].offAt = lm.minute;
  lm.perf[onId] = { base: 6.3, goals: 0, assists: 0, saves: 0, onAt: lm.minute };
  const off = lm.players[offId], on = lm.players[onId];
  push(lm, { minute: Math.max(1, lm.minute), type: 'sub', side: key, playerId: onId, player: surname(on.name), text: `${forced ? 'Forced change' : 'Substitution'} for ${s.name}: ${on.name} replaces ${off.name}.` });
  return null;
}

/** Simulates one minute. */
export function tick(lm: LiveMatch) {
  if (lm.done) return;
  const rng = createRng(lm.rng);
  const m = ++lm.minute;
  const H = strength(lm, lm.home), A = strength(lm, lm.away);
  const reds = (s: LiveSide) => s.xi.filter((x) => !x).length;
  const redH = Math.pow(0.82, reds(lm.home)), redA = Math.pow(0.82, reds(lm.away));
  const tH = lm.home, tA = lm.away;
  const attH = (((H.attack * 0.6 + H.mid * 0.4) * (tH.atk ?? 1)) / ((A.defence * 0.7 + A.gk * 0.3) * (tA.def ?? 1) || 1)) * redH / redA;
  const attA = (((A.attack * 0.6 + A.mid * 0.4) * (tA.atk ?? 1)) / ((H.defence * 0.7 + H.gk * 0.3) * (tH.def ?? 1) || 1)) * redA / redH;
  const xg90 = [clamp(1.32 * Math.pow(attH, 2.6) * (lm.neutral ? 1 : 1.12), 0.15, 4.5), clamp(1.32 * Math.pow(attA, 2.6), 0.15, 4.5)] as const;
  lm.stats.possession += clamp(50 + (H.mid - A.mid) * 0.45 + rng.normal(2, 6), 25, 75);
  lm.stats.passAcc[0] += clamp(72 + (H.mid - 100) * 0.25 + rng.normal(0, 3), 55, 95);
  lm.stats.passAcc[1] += clamp(72 + (A.mid - 100) * 0.25 + rng.normal(0, 3), 55, 95);

  (['home', 'away'] as const).forEach((key, si) => {
    const s = lm[key], other = lm[key === 'home' ? 'away' : 'home'];
    const ids = onPitch(s);
    if (!ids.length) return;
    const xg = xg90[si] / 90;
    lm.stats.xg[si] += xg;
    const pl = ids.map((id) => lm.players[id]);
    // goal
    if (rng.chance(xg)) {
      const sc = rng.weighted(pl, (p) => (SCORER_WEIGHT[POS_GROUP[p.pos]] ?? 1) * (p.attrs.Finishing / 10));
      const pen = rng.chance(0.08);
      const as = pen ? undefined : rng.weighted(pl.filter((p) => p !== sc), (p) => ((POS_GROUP[p.pos] === 'GK' ? 0.1 : 1) * p.attrs.Passing) / 10);
      lm.perf[sc.id].goals++; if (as) lm.perf[as.id].assists++;
      lm.score[si]++;
      lm.stats.shots[si]++; lm.stats.onTarget[si]++;
      const lines = pen ? [`${sc.name} sends the keeper the wrong way from the spot.`]
        : [`${sc.name} finishes clinically${as ? ` after ${surname(as.name)}'s pass` : ''}.`, `${sc.name} curls it into the top corner!${as ? ` ${surname(as.name)} with the assist.` : ''}`,
          `${sc.name} gets on the end of ${as ? surname(as.name) + "'s" : 'a'} cross and heads it in.`, `${sc.name} slots it under the keeper${as ? `; ${surname(as.name)} split the defence` : ''}.`];
      push(lm, { minute: m, type: pen ? 'penalty' : 'goal', side: key, playerId: sc.id, player: surname(sc.name), score: [...lm.score] as [number, number], text: rng.pick(lines) });
    } else if (rng.chance((xg90[si] * 6.5) / 90)) {
      lm.stats.shots[si]++;
      const shooter = rng.weighted(pl, (p) => (SCORER_WEIGHT[POS_GROUP[p.pos]] ?? 1) + 0.2);
      if (rng.chance(0.38)) {
        lm.stats.onTarget[si]++;
        const gk = other.xi[0] ? lm.players[other.xi[0]!] : undefined;
        if (gk) lm.perf[gk.id].saves++;
        if (gk && rng.chance(0.3)) push(lm, { minute: m, type: 'save', side: key === 'home' ? 'away' : 'home', text: `${gk.name} denies ${surname(shooter.name)} with a fine save.` });
      } else if (rng.chance(0.18)) push(lm, { minute: m, type: 'chance', side: key, text: rng.pick([`${shooter.name} drags a shot just wide.`, `${shooter.name} heads over from a corner.`, `Chance for ${surname(shooter.name)}, but it's blocked.`]) });
    }
    if (rng.chance(5 / 90)) lm.stats.corners[si]++;
    if (rng.chance((lm.derby ? 15 : 11) / 90)) lm.stats.fouls[si]++;
    // cards (derbies are hotter)
    if (rng.chance((lm.derby ? 2.4 : 1.7) / 90)) {
      const p = rng.weighted(pl, (x) => x.attrs.Aggression + (POS_GROUP[x.pos] === 'GK' ? -15 : 0));
      const perf = lm.perf[p.id];
      const victim = onPitch(other)[0] ? lm.players[rng.pick(onPitch(other))] : undefined;
      if (perf.card === 'yellow' && rng.chance(0.3)) sendOff(lm, key, p.id, m, `${p.name} is sent off for a second yellow card!`);
      else if (!perf.card) { perf.card = 'yellow'; push(lm, { minute: m, type: 'yellow', side: key, playerId: p.id, player: surname(p.name), text: `${p.name} is booked for a late challenge${victim ? ` on ${surname(victim.name)}` : ''}.` }); }
    } else if (rng.chance(0.025 / 90)) {
      const p = rng.pick(pl.filter((x) => POS_GROUP[x.pos] !== 'GK'));
      if (p && !lm.perf[p.id].card) sendOff(lm, key, p.id, m, `Straight red! ${p.name} is off for a dangerous tackle.`);
    }
    // injuries (tired players more often)
    for (const p of pl) {
      const risk = (0.08 / 90 / 11) * s.injury * (p.condition < 70 ? 1.8 : 1) * (0.6 + p.injuryProneness / 25);
      if (rng.chance(risk)) {
        lm.perf[p.id].injured = true;
        push(lm, { minute: m, type: 'injury', side: key, playerId: p.id, player: surname(p.name), text: `${p.name} pulls up and has to be replaced.` });
        const slot = slotsOf(s.formation)[s.xi.indexOf(p.id)];
        const rep = s.subsUsed < MAX_SUBS ? bestReplacement(lm, s, slot) : undefined;
        if (rep) substitute(lm, key, p.id, rep.id, true);
        else { s.xi[s.xi.indexOf(p.id)] = null; lm.perf[p.id].offAt = m; }
        break;
      }
    }
    // fatigue
    for (const id of onPitch(s)) {
      const p = lm.players[id];
      p.condition = Math.max(20, p.condition - (0.26 + (20 - p.attrs.Stamina) * 0.012));
    }
    // computer-run sides make changes on the hour, at 70 and 80
    if (!s.user && (m === 60 || m === 70 || m === 80) && s.subsUsed < 3) {
      const slots = slotsOf(s.formation);
      const tired = onPitch(s).map((id) => lm.players[id]).filter((p) => p.condition < 68 && POS_GROUP[p.pos] !== 'GK').sort((a, b) => a.condition - b.condition)[0];
      if (tired) { const rep = bestReplacement(lm, s, slots[s.xi.indexOf(tired.id)]); if (rep) substitute(lm, key, tired.id, rep.id); }
    }
  });

  if (m === 45) push(lm, { minute: 45, type: 'whistle', text: `Half time: ${lm.home.name} ${lm.score[0]}–${lm.score[1]} ${lm.away.name}.` });
  if (m >= 90) finish(lm, rng);
  lm.rng = rng.state();
}

function sendOff(lm: LiveMatch, key: SideKey, id: string, m: number, text: string) {
  const s = lm[key];
  lm.perf[id].card = 'red'; lm.perf[id].offAt = m;
  s.xi[s.xi.indexOf(id)] = null;
  push(lm, { minute: m, type: 'red', side: key, playerId: id, player: surname(lm.players[id].name), text });
}

function finish(lm: LiveMatch, rng: Rng) {
  lm.done = true;
  push(lm, { minute: 90, type: 'whistle', text: `Full time: ${lm.home.name} ${lm.score[0]}–${lm.score[1]} ${lm.away.name}.` });
  if (lm.knockout && lm.score[0] === lm.score[1]) {
    const taker = (s: LiveSide) => { const ps = onPitch(s).slice(1).map((id) => lm.players[id]); return ps.reduce((a, p) => a + p.attrs.Composure + p.attrs.Penalties, 0) / Math.max(1, ps.length) / 40; };
    const keeper = (s: LiveSide) => { const g = s.xi[0] ? lm.players[s.xi[0]!] : undefined; return g ? (g.attrs['One on Ones'] + g.attrs.Reflexes) / 40 : 0.3; };
    const pH = clamp(0.72 + taker(lm.home) * 0.12 - keeper(lm.away) * 0.1, 0.55, 0.9), pA = clamp(0.72 + taker(lm.away) * 0.12 - keeper(lm.home) * 0.1, 0.55, 0.9);
    let h = 0, a = 0;
    for (let i = 0; i < 5; i++) { if (rng.chance(pH)) h++; if (rng.chance(pA)) a++; }
    while (h === a) { const x = rng.chance(pH), y = rng.chance(pA); if (x) h++; if (y) a++; }
    lm.pens = [h, a];
    push(lm, { minute: 90, type: 'whistle', text: `${h > a ? lm.home.name : lm.away.name} win ${Math.max(h, a)}–${Math.min(h, a)} on penalties.` });
  }
}

/** Current rating for a player (used live and at full time). */
export function ratingOf(lm: LiveMatch, id: string, key: SideKey) {
  const p = lm.perf[id];
  const si = key === 'home' ? 0 : 1;
  const gf = lm.score[si], ga = lm.score[1 - si];
  const played = (p.offAt ?? lm.minute) - p.onAt;
  const share = clamp(played / 90, 0, 1);
  let r = p.base + p.goals * 1.1 + p.assists * 0.6 + Math.min(p.saves, 6) * 0.12 - (p.card === 'yellow' ? 0.2 : p.card === 'red' ? 1.2 : 0);
  r += (gf > ga ? 0.35 : gf < ga ? -0.3 : 0) * share;
  const slot = lm[key].xi.includes(id) ? slotsOf(lm[key].formation)[lm[key].xi.indexOf(id)] : undefined;
  if (lm.done && ga === 0 && slot && (ROLE[slot] === 'def' || ROLE[slot] === 'gk') && share > 0.6) r += 0.4;
  return Math.round(clamp(r, 4.5, 10) * 10) / 10;
}

/** Finishes the simulation if needed (no more user input) and converts to a stored result. */
export function runToEnd(lm: LiveMatch) { while (!lm.done) tick(lm); }

export function toResult(lm: LiveMatch, homeId: string, awayId: string): { result: MatchResult; conditions: Record<string, number> } {
  const side = (key: SideKey): PlayerRating[] => Object.entries(lm.perf)
    .filter(([id]) => lm.sideOf[id] === key)
    .map(([id, p]) => ({ playerId: id, rating: ratingOf(lm, id, key), goals: p.goals, assists: p.assists, card: p.card, subbedOff: p.offAt !== undefined && p.card !== 'red' ? p.offAt : undefined, subbedOn: p.onAt > 0 ? p.onAt : undefined, injured: p.injured, minutes: (p.offAt ?? 90) - p.onAt }));
  const mins = Math.max(1, lm.minute);
  const conditions: Record<string, number> = {};
  for (const [id, p] of Object.entries(lm.players)) if (lm.perf[id]) conditions[id] = Math.round(p.condition);
  const winnerId = lm.knockout ? (lm.score[0] !== lm.score[1] ? (lm.score[0] > lm.score[1] ? homeId : awayId) : lm.pens && lm.pens[1] > lm.pens[0] ? awayId : homeId) : undefined;
  return {
    result: {
      score: [...lm.score] as [number, number], pens: lm.pens, winnerId,
      events: [...lm.events].sort((a, b) => a.minute - b.minute || a.order - b.order),
      stats: {
        possession: [Math.round(lm.stats.possession / mins), 100 - Math.round(lm.stats.possession / mins)],
        shots: lm.stats.shots, onTarget: lm.stats.onTarget, xg: [Math.round(lm.stats.xg[0] * 100) / 100, Math.round(lm.stats.xg[1] * 100) / 100],
        corners: lm.stats.corners, fouls: lm.stats.fouls,
        yellow: [count(lm, 'home', 'yellow'), count(lm, 'away', 'yellow')], red: [count(lm, 'home', 'red'), count(lm, 'away', 'red')],
        passAcc: [Math.round(lm.stats.passAcc[0] / mins), Math.round(lm.stats.passAcc[1] / mins)],
      },
      ratings: { home: side('home'), away: side('away') },
    },
    conditions,
  };
}

const count = (lm: LiveMatch, key: SideKey, c: 'yellow' | 'red') => Object.entries(lm.perf).filter(([id, p]) => lm.sideOf[id] === key && p.card === c).length;

/* ---------- team talks ---------- */
export type TalkTone = 'encourage' | 'demand' | 'calm';
export const TALKS: Array<{ tone: TalkTone; label: string }> = [
  { tone: 'encourage', label: 'Encourage: “Go out and enjoy it”' },
  { tone: 'demand', label: 'Demand more: “I expect a reaction”' },
  { tone: 'calm', label: 'Keep calm: “Stick to the plan”' },
];

/** Whether the match is waiting for the user's team talk (kickoff or half-time). */
export function talkDue(lm: LiveMatch, key: SideKey) {
  if (!lm[key].user || lm.done) return null;
  if (lm.minute === 0 && !lm.talks?.pre) return 'pre' as const;
  if (lm.minute === 45 && !lm.talks?.ht) return 'ht' as const;
  return null;
}

/** Gives a team talk: the effect depends on the situation, and the players' reaction goes into the commentary. */
export function teamTalk(lm: LiveMatch, key: SideKey, tone: TalkTone | 'skip') {
  const when = talkDue(lm, key);
  if (!when) return;
  (lm.talks ??= {})[when] = tone === 'skip' ? 'calm' : tone;
  if (tone === 'skip') return;
  const us = lm[key], them = lm[key === 'home' ? 'away' : 'home'];
  const avg = (s: LiveSide) => { const ids = s.xi.filter((x): x is string => !!x); return ids.reduce((a, id) => a + lm.players[id].ability, 0) / Math.max(1, ids.length); };
  const diff = when === 'pre' ? (avg(us) - avg(them)) / 10 : (key === 'home' ? lm.score[0] - lm.score[1] : lm.score[1] - lm.score[0]);
  const situation = diff > 0.5 ? 'ahead' : diff < -0.5 ? 'behind' : 'level';
  // what works: calm when on top, a demand when behind, encouragement when it's even (or as underdogs before kickoff)
  const table: Record<string, Record<TalkTone, number>> = {
    ahead: { calm: 0.03, encourage: 0.01, demand: -0.015 },
    level: { calm: 0, encourage: 0.025, demand: 0.015 },
    behind: when === 'pre' ? { calm: 0.005, encourage: 0.03, demand: -0.02 } : { calm: -0.01, encourage: 0.015, demand: 0.035 },
  };
  const rng = createRng(lm.rng ^ 0x7a1c);
  const effect = (table[situation][tone] + rng.normal(0, 0.006)) * (us.talk ?? 1);
  us.boost = Math.round(us.boost * (1 + effect) * 10000) / 10000;
  const reaction = effect > 0.02 ? 'The players look fired up.' : effect > 0.005 ? 'The players respond well.' : effect > -0.005 ? 'The players seem unmoved.' : 'The message doesn’t land; heads drop in the dressing room.';
  push(lm, { minute: lm.minute, type: 'whistle', side: key, text: `${when === 'pre' ? 'Team talk' : 'Half-time team talk'} (${tone === 'encourage' ? 'encourage' : tone === 'demand' ? 'demand more' : 'keep calm'}): ${reaction}` });
}
