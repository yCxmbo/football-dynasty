/* Competitions, driven entirely by the world definition: leagues of any size with promotion and
   relegation, domestic cups (byes for any number of entrants), play-offs, super cups and continental
   competitions with group stages. The season calendar is built from all of them. */
import type { Rng } from './rng';
import type { CompId, CompInfo, CupState, Fixture, GameState, Slot } from './types';
import type { LeagueDef } from './worlddef';

/* ---------- lookups ---------- */
export const compInfo = (s: GameState, id: CompId): CompInfo => s.comps[id] ?? { id, name: id, short: id, kind: 'cup' };
export const compName = (s: GameState, id: CompId) => compInfo(s, id).name;
export const leagueDef = (s: GameState, id: string | undefined) => (id ? s.world.leagues.find((l) => l.id === id) : undefined);
export const countryName = (s: GameState, id: string) => s.world.countries.find((c) => c.id === id)?.name ?? id;
export const clubsInLeague = (s: GameState, leagueId: string) => Object.values(s.clubs).filter((c) => c.league === leagueId).map((c) => c.id);
export const leaguesOf = (s: GameState, country: string) => s.world.leagues.filter((l) => l.country === country).sort((a, b) => a.tier - b.tier);
export const topLeague = (s: GameState, country: string) => leaguesOf(s, country)[0];
export const isLeague = (s: GameState, id: CompId) => compInfo(s, id).kind === 'league';
export const userLeague = (s: GameState) => s.clubs[s.userClubId].league;
export const leagueRounds = (n: number) => 2 * (n - 1);

/** Knockout round names for a number of entrants; a first round thins the field to a power of two. */
export function cupRoundNames(entrants: number): string[] {
  const p = 2 ** Math.floor(Math.log2(Math.max(2, entrants)));
  const out: string[] = [];
  if (entrants > p) out.push('First round');
  for (let k = p; k >= 2; k /= 2) out.push(k === 2 ? 'Final' : k === 4 ? 'Semi-final' : k === 8 ? 'Quarter-final' : `Round of ${k}`);
  return out;
}
const GROUP_ROUNDS = [1, 2, 3, 4, 5, 6].map((i) => `Group matchday ${i}`);
export const continentalRounds = (size: number) => [...GROUP_ROUNDS, ...(size === 32 ? ['Round of 16'] : []), 'Quarter-final', 'Semi-final', 'Final'];

function cupEntrants(s: GameState, cupId: string) {
  const def = s.world.cups.find((c) => c.id === cupId)!;
  return Object.values(s.clubs).filter((c) => c.country === def.country && c.league && def.tiers.includes(leagueDef(s, c.league)!.tier))
    .sort((a, b) => a.division - b.division || b.reputation - a.reputation).map((c) => c.id);
}

/** This season's competitions from the world definition. */
export function buildComps(s: GameState) {
  const comps: Record<string, CompInfo> = {};
  for (const l of s.world.leagues) {
    comps[l.id] = { id: l.id, name: l.name, short: l.short ?? l.name, kind: 'league', country: l.country, tier: l.tier, size: clubsInLeague(s, l.id).length };
    if (l.playoff) comps[`po-${l.id}`] = { id: `po-${l.id}`, name: `${l.name} play-offs`, short: 'Play-offs', kind: 'playoff', country: l.country, tier: l.tier, leagueId: l.id, rounds: ['Semi-final', 'Final'] };
  }
  for (const c of s.world.cups) comps[c.id] = { id: c.id, name: c.name, short: c.name, kind: 'cup', country: c.country, rounds: cupRoundNames(cupEntrants(s, c.id).length), main: c.main };
  for (const country of s.world.countries) {
    if (!topLeague(s, country.id) || !s.world.cups.some((c) => c.country === country.id && c.main)) continue;
    comps[`sc-${country.id}`] = { id: `sc-${country.id}`, name: country.superCup ?? `${country.name} Super Cup`, short: country.superCup ?? 'Super Cup', kind: 'super', country: country.id, rounds: ['Final'] };
  }
  const usedFillers = new Set(Object.values(s.qualified).flat());
  for (const k of s.world.continental) {
    // the field is the qualified clubs plus fillers not already playing elsewhere (same order as setupContinental)
    let n = new Set(s.qualified[k.id] ?? []).size;
    for (const f of k.fillers ?? []) if (n < k.size && s.clubs[f] && !usedFillers.has(f)) { usedFillers.add(f); n++; }
    const size = n >= 32 && k.size === 32 ? 32 : 16;
    comps[k.id] = { id: k.id, name: k.name, short: k.short ?? k.name, kind: 'continental', rank: k.rank, size, rounds: continentalRounds(size) };
  }
  s.comps = comps;
}

/* ---------- calendar ---------- */
interface Entry { week: number; day: Slot['day']; comp: CompId; round: string }
const OFFSET: Record<Slot['day'], number> = { Sat: 0, Sun: 1, Tue: 3, Wed: 4, Thu: 5 };

export function makeCalendar(s: GameState, year: number): Slot[] {
  const leagues = s.world.leagues.map((l) => ({ l, r: leagueRounds(clubsInLeague(s, l.id).length) }));
  const W = Math.max(...leagues.map((x) => x.r));
  s.leagueWeeks = W;
  const entries: Entry[] = [];
  // leagues: shorter leagues spread their rounds over the same season
  for (const { l, r } of leagues) for (let i = 1; i <= r; i++) entries.push({ week: Math.round((i * W) / r), day: 'Sat', comp: l.id, round: `Matchday ${i}` });
  // super cups open the season
  for (const c of Object.values(s.comps)) if (c.kind === 'super') entries.push({ week: 0, day: 'Sat', comp: c.id, round: 'Final' });
  // continental: groups and knockouts on fixed fractions of the season; rank 1 Wednesdays, rank 2+ Thursdays
  const frac = (f: number) => Math.max(1, Math.round(f * W));
  const contWeeks = new Set<number>();
  for (const c of Object.values(s.comps).filter((x) => x.kind === 'continental')) {
    const day: Slot['day'] = c.rank === 1 ? 'Wed' : 'Thu';
    const plan: Array<[string, number]> = [...[0.06, 0.14, 0.22, 0.3, 0.38, 0.46].map((f, i) => [GROUP_ROUNDS[i], frac(f)] as [string, number]),
      ...(c.size === 32 ? [['Round of 16', frac(0.6)] as [string, number]] : []), ['Quarter-final', frac(0.7)], ['Semi-final', frac(0.82)]];
    for (const [round, week] of plan) { entries.push({ week, day, comp: c.id, round }); contWeeks.add(week); }
    entries.push({ week: W + 3, day: c.rank === 1 ? 'Sat' : 'Wed', comp: c.id, round: 'Final' });
  }
  // domestic cups: midweeks without continental football; the main cup ends after the league, the second in spring
  const free = Array.from({ length: W - 3 }, (_, i) => i + 2).filter((w) => !contWeeks.has(w));
  for (const country of s.world.countries) {
    const cups = Object.values(s.comps).filter((c) => c.kind === 'cup' && c.country === country.id).sort((a, b) => Number(!!b.main) - Number(!!a.main));
    cups.forEach((c, ci) => {
      const rounds = c.rounds!;
      const pool = free.filter((_, i) => i % Math.max(1, cups.length) === ci % Math.max(1, cups.length));
      const before = rounds.slice(0, -1);
      const span = ci === 0 ? pool : pool.filter((w) => w < W * 0.6);
      before.forEach((round, i) => {
        const week = span[Math.min(span.length - 1, Math.round(((i + 0.5) * span.length) / Math.max(1, before.length)))] ?? 2 + i;
        entries.push({ week, day: ci === 0 ? 'Wed' : 'Tue', comp: c.id, round });
      });
      entries.push(ci === 0 ? { week: W + 1, day: 'Sat', comp: c.id, round: 'Final' } : { week: frac(0.62), day: 'Sun', comp: c.id, round: 'Final' });
    });
  }
  // play-offs straight after the league
  for (const c of Object.values(s.comps).filter((x) => x.kind === 'playoff')) {
    entries.push({ week: W, day: 'Wed', comp: c.id, round: 'Semi-final' }, { week: W + 1, day: 'Sun', comp: c.id, round: 'Final' });
  }
  const start = new Date(Date.UTC(year, 7, 8));
  while (start.getUTCDay() !== 6) start.setUTCDate(start.getUTCDate() + 1);
  const dateOf = (e: Entry) => new Date(start.getTime() + ((e.week - 1) * 7 + OFFSET[e.day]) * 86400000).toISOString().slice(0, 10);
  const byKey = new Map<string, Slot>();
  for (const e of entries) {
    const key = `${e.week}-${e.day}`;
    if (!byKey.has(key)) byKey.set(key, { index: 0, date: dateOf(e), week: e.week, day: e.day, entries: [] });
    const slot = byKey.get(key)!;
    if (!slot.entries.some((x) => x.comp === e.comp)) slot.entries.push({ comp: e.comp, round: e.round });
  }
  const slots = [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date));
  slots.forEach((x, i) => { x.index = i + 1; });
  return slots;
}

export const slotFor = (s: GameState, comp: CompId, round: string) => s.calendar.find((x) => x.entries.some((e) => e.comp === comp && e.round === round));
export const currentSlot = (s: GameState) => s.calendar[Math.min(s.matchday, s.calendar.length) - 1];
/** League week of the current slot (0 = pre-season, 99 = season over). */
export const currentWeek = (s: GameState) => (s.matchday > s.calendar.length ? 99 : currentSlot(s).week);

/* ---------- fixtures ---------- */
function roundRobin(ids: string[]): Array<Array<[string, string]>> {
  const list = [...ids];
  if (list.length % 2) list.push('BYE');
  const n = list.length, half = n / 2, rounds: Array<Array<[string, string]>> = [];
  const rot = [...list];
  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < half; i++) {
      const a = rot[i], b = rot[n - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    rot.splice(1, 0, rot.pop() as string);
  }
  return [...rounds, ...rounds.map((ps) => ps.map(([h, a]) => [a, h] as [string, string]))];
}

function add(s: GameState, comp: CompId, round: string, home: string, away: string, extra: Partial<Fixture> = {}) {
  const slot = slotFor(s, comp, round);
  if (!slot) return;
  s.fixtures.push({ id: `${s.year}-${comp}-${s.nextId++}`, matchday: slot.index, date: slot.date, homeId: home, awayId: away, comp, round, ...extra });
}

export interface TableRow { clubId: string; club: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; form: ('W' | 'D' | 'L')[]; isUser: boolean }

export function tableOf(s: GameState, comp: CompId, ids: string[], group?: number): TableRow[] {
  const rows: Record<string, TableRow> = {};
  for (const id of ids) rows[id] = { clubId: id, club: s.clubs[id].name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [], isUser: id === s.userClubId };
  for (const f of s.fixtures.filter((x) => x.comp === comp && x.result && (group === undefined || x.group === group)).sort((a, b) => a.matchday - b.matchday)) {
    const H = rows[f.homeId], A = rows[f.awayId];
    if (!H || !A) continue;
    const [h, a] = f.result!.score;
    H.p++; A.p++; H.gf += h; H.ga += a; A.gf += a; A.ga += h;
    if (h > a) { H.w++; A.l++; H.pts += 3; H.form.push('W'); A.form.push('L'); }
    else if (h < a) { A.w++; H.l++; A.pts += 3; A.form.push('W'); H.form.push('L'); }
    else { H.d++; A.d++; H.pts++; A.pts++; H.form.push('D'); A.form.push('D'); }
  }
  return Object.values(rows).map((r) => ({ ...r, form: r.form.slice(-5) }))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.club.localeCompare(b.club));
}
export const leagueTableOf = (s: GameState, leagueId: string) => tableOf(s, leagueId, clubsInLeague(s, leagueId));
export const leagueDone = (s: GameState) => s.fixtures.filter((f) => isLeague(s, f.comp)).every((f) => f.result);

const byRep = (s: GameState) => (a: string, b: string) => s.clubs[b].reputation - s.clubs[a].reputation;

function shuffle<T>(rng: Rng, list: T[]) {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool;
}
function drawPairs(rng: Rng, ids: string[]): Array<[string, string]> {
  const pool = shuffle(rng, ids);
  const out: Array<[string, string]> = [];
  for (let i = 0; i + 1 < pool.length; i += 2) out.push([pool[i], pool[i + 1]]);
  return out;
}

/** Everything drawn at the start of a season: league fixtures, super cups, first cup rounds, continental groups. */
export function setupSeason(s: GameState, rng: Rng) {
  s.fixtures = [];
  s.cups = {};
  s.groups = {};
  for (const l of s.world.leagues) roundRobin(clubsInLeague(s, l.id)).forEach((pairs, i) => pairs.forEach(([h, a]) => add(s, l.id, `Matchday ${i + 1}`, h, a)));
  for (const c of Object.values(s.comps)) {
    if (c.kind === 'super') {
      const [a, b] = s.qualified[c.id] ?? [];
      if (a && b) { add(s, c.id, 'Final', a, b, { ko: true, neutral: true }); s.cups[c.id] = { round: 0, alive: [a, b], exits: {} }; }
    } else if (c.kind === 'cup') {
      const entrants = cupEntrants(s, c.id);
      const p = 2 ** Math.floor(Math.log2(entrants.length));
      const first = entrants.length > p ? entrants.slice(entrants.length - 2 * (entrants.length - p)) : entrants;
      const waiting = entrants.length > p ? entrants.slice(0, entrants.length - 2 * (entrants.length - p)) : [];
      s.cups[c.id] = { round: 0, alive: waiting, exits: {} };
      for (const [h, a] of drawPairs(rng, first)) add(s, c.id, c.rounds![0], h, a, { ko: true, neutral: c.rounds![0] === 'Final' });
    } else if (c.kind === 'continental') setupContinental(s, rng, c);
  }
}

function setupContinental(s: GameState, rng: Rng, c: CompInfo) {
  const def = s.world.continental.find((k) => k.id === c.id)!;
  const field = [...new Set(s.qualified[c.id] ?? [])].filter((id) => s.clubs[id]);
  for (const f of def.fillers ?? []) if (field.length < (c.size ?? 16) && s.clubs[f] && !field.includes(f) && !Object.values(s.qualified).some((q) => q.includes(f))) field.push(f);
  const size = field.length >= 32 && def.size === 32 ? 32 : field.length >= 16 ? 16 : 0;
  if (!size) return; // not enough clubs this season
  c.size = size; c.rounds = continentalRounds(size);
  const entrants = field.sort(byRep(s)).slice(0, size);
  s.qualified[c.id] = entrants; // fillers used here can't fill a later competition
  const G = size / 4;
  const groups: string[][] = Array.from({ length: G }, () => []);
  for (let pot = 0; pot < 4; pot++) {
    const potClubs = shuffle(rng, entrants.slice(pot * G, pot * G + G));
    // keep clubs from the same country apart where the pot allows it
    for (let g = 0; g < G; g++) {
      const clash = (id: string) => groups[g].some((x) => s.clubs[x].country === s.clubs[id].country);
      let k = potClubs.findIndex((id) => !clash(id));
      if (k < 0) k = 0;
      groups[g].push(potClubs.splice(k, 1)[0]);
    }
  }
  s.groups[c.id] = groups;
  groups.forEach((g, gi) => roundRobin(g).forEach((pairs, r) => pairs.forEach(([h, a]) => add(s, c.id, GROUP_ROUNDS[r], h, a, { group: gi }))));
  s.cups[c.id] = { round: 0, alive: [...entrants], exits: {} };
}

export function winnerOf(f: Fixture) {
  const r = f.result!;
  if (r.winnerId) return r.winnerId;
  if (r.score[0] !== r.score[1]) return r.score[0] > r.score[1] ? f.homeId : f.awayId;
  return r.pens && r.pens[1] > r.pens[0] ? f.awayId : f.homeId;
}
export const loserOf = (f: Fixture) => (winnerOf(f) === f.homeId ? f.awayId : f.homeId);

/** After a slot: records exits and draws the next round of any finished knockout round. Returns news lines. */
export function advanceCups(s: GameState, rng: Rng, slot: Slot): string[] {
  const news: string[] = [];
  for (const e of slot.entries) {
    const c = compInfo(s, e.comp);
    if (c.kind === 'league') continue;
    const cup = (s.cups[c.id] ??= { round: 0, alive: [], exits: {} } as CupState);
    const played = s.fixtures.filter((f) => f.comp === c.id && f.round === e.round && f.result);
    if (!played.length) continue;
    if (e.round.startsWith('Group')) {
      if (e.round !== GROUP_ROUNDS[5]) continue;
      const groups = s.groups[c.id] ?? [];
      const winners: string[] = [], runners: string[] = [];
      groups.forEach((g, gi) => {
        const t = tableOf(s, c.id, g, gi);
        winners.push(t[0].clubId); runners.push(t[1].clubId);
        for (const r of t.slice(2)) cup.exits[r.clubId] = 'Group stage';
      });
      const next = c.rounds![6];
      winners.forEach((w, i) => add(s, c.id, next, w, runners[(i + 1) % runners.length], { ko: true }));
      cup.alive = [...winners, ...runners];
      cup.round = 6;
      continue;
    }
    const winners = played.map(winnerOf);
    for (const f of played) cup.exits[loserOf(f)] = e.round;
    if (e.round === 'Final') {
      const f = played[0];
      cup.winner = winnerOf(f); cup.runnerUp = loserOf(f);
      cup.exits[cup.winner] = 'Winners'; cup.exits[cup.runnerUp] = 'Final';
      cup.alive = [cup.winner];
      news.push(`${s.clubs[cup.winner].name} win the ${c.name}!`);
      continue;
    }
    const rounds = c.rounds!;
    const idx = rounds.indexOf(e.round);
    const entrants = c.kind === 'cup' && idx === 0 && cup.alive.length ? [...cup.alive, ...winners] : winners;
    cup.alive = entrants;
    cup.round = idx + 1;
    const next = rounds[idx + 1];
    const neutral = next === 'Final' || (c.kind === 'cup' && c.main && next === 'Semi-final');
    for (const [h, a] of drawPairs(rng, entrants)) add(s, c.id, next, h, a, { ko: true, neutral });
  }
  return news;
}

/** After the last league round: play-off semi-finals for leagues that have them. */
export function setupPlayoffs(s: GameState) {
  for (const c of Object.values(s.comps).filter((x) => x.kind === 'playoff')) {
    const l = leagueDef(s, c.leagueId)!;
    const t = leagueTableOf(s, l.id);
    const [a] = l.playoff!;
    const four = t.slice(a - 1, a + 3).map((r) => r.clubId);
    s.cups[c.id] = { round: 0, alive: four, exits: {} };
    add(s, c.id, 'Semi-final', four[0], four[3], { ko: true });
    add(s, c.id, 'Semi-final', four[1], four[2], { ko: true });
  }
}

/** Furthest stage reached in a knockout or continental competition this season. */
export function cupResult(s: GameState, comp: CompId, clubId: string): string | undefined {
  const cup = s.cups[comp];
  if (!cup) return undefined;
  if (cup.winner === clubId) return 'Winners';
  if (cup.exits[clubId]) return cup.exits[clubId];
  const entered = s.fixtures.some((f) => f.comp === comp && (f.homeId === clubId || f.awayId === clubId));
  return entered ? compInfo(s, comp).rounds?.[cup.round] : undefined;
}

/** Season end: promotion (automatic + play-off winner) and relegation along each country's pyramid. */
export function promotionsAndRelegations(s: GameState) {
  const moves: Record<string, { to: string; dir: 'promoted' | 'relegated' }> = {};
  const champions: Record<string, string> = {};
  for (const country of s.world.countries) {
    const ls = leaguesOf(s, country.id);
    ls.forEach((l, i) => {
      const t = leagueTableOf(s, l.id);
      if (!t.length) return;
      champions[l.id] = t[0].clubId;
      const up = ls[i - 1], down = ls[i + 1];
      if (down && l.relegate) for (const r of t.slice(-l.relegate)) moves[r.clubId] = { to: down.id, dir: 'relegated' };
      if (up) {
        for (const r of t.slice(0, l.promote)) moves[r.clubId] = { to: up.id, dir: 'promoted' };
        const po = s.cups[`po-${l.id}`]?.winner;
        if (po) moves[po] = { to: up.id, dir: 'promoted' };
      }
    });
  }
  return { moves, champions };
}

/** Next season's continental places and super cup pairings. First season: by reputation. */
export function qualifiers(s: GameState, firstSeason = false) {
  const q: Record<string, string[]> = {};
  const taken = new Set<string>();
  const order = (country: string) => {
    const l = topLeague(s, country);
    if (!l) return [];
    return firstSeason ? clubsInLeague(s, l.id).sort(byRep(s)) : leagueTableOf(s, l.id).map((r) => r.clubId);
  };
  const mainCupWinner = (country: string) => {
    const cup = s.world.cups.find((c) => c.country === country && c.main);
    return firstSeason || !cup ? undefined : s.cups[cup.id]?.winner;
  };
  const used: Record<string, number> = {};
  for (const k of [...s.world.continental].sort((a, b) => a.rank - b.rank)) {
    q[k.id] = [];
    for (const [country, n] of Object.entries(k.places)) {
      const list = order(country);
      const winner = k.cupWinners ? mainCupWinner(country) : undefined;
      if (winner && !taken.has(winner)) { q[k.id].push(winner); taken.add(winner); }
      let i = used[country] ?? 0;
      let added = winner && q[k.id].includes(winner) ? 1 : 0;
      while (added < n && i < list.length) { const id = list[i++]; if (!taken.has(id)) { q[k.id].push(id); taken.add(id); added++; } }
      used[country] = i;
    }
  }
  for (const country of s.world.countries) {
    const list = order(country.id);
    if (!list.length) continue;
    const w = mainCupWinner(country.id);
    q[`sc-${country.id}`] = [list[0], w && w !== list[0] ? w : list[1]];
  }
  return q;
}

export type { LeagueDef };
