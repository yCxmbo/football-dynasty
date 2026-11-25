/* Competitions: the season calendar, three divisions, play-offs, two domestic cups, the Super Cup
   and the Continental Cup. Names are fictional; formats follow their real-world counterparts. */
import type { Rng } from './rng';
import type { CompId, CupState, Fixture, GameState, Slot } from './types';

export interface CompInfo { id: CompId; name: string; short: string; kind: 'league' | 'cup' | 'continental' | 'super' | 'playoff'; tier?: 1 | 2 | 3 }
export const COMPS: Record<CompId, CompInfo> = {
  D1: { id: 'D1', name: 'Premier Division', short: 'Premier', kind: 'league', tier: 1 },
  D2: { id: 'D2', name: 'Championship', short: 'Championship', kind: 'league', tier: 2 },
  D3: { id: 'D3', name: 'League One', short: 'League One', kind: 'league', tier: 3 },
  NC: { id: 'NC', name: 'National Cup', short: 'National Cup', kind: 'cup' },
  LC: { id: 'LC', name: 'League Cup', short: 'League Cup', kind: 'cup' },
  CC: { id: 'CC', name: 'Continental Cup', short: 'Continental', kind: 'continental' },
  SC: { id: 'SC', name: 'Super Cup', short: 'Super Cup', kind: 'super' },
  PO2: { id: 'PO2', name: 'Championship play-offs', short: 'Play-offs', kind: 'playoff', tier: 2 },
  PO3: { id: 'PO3', name: 'League One play-offs', short: 'Play-offs', kind: 'playoff', tier: 3 },
};
export const DIVISIONS = ['D1', 'D2', 'D3'] as const;
export const divisionComp = (d: number) => (`D${d}` as 'D1' | 'D2' | 'D3');
export const divisionName = (d: number) => (d >= 1 && d <= 3 ? COMPS[divisionComp(d)].name : 'Abroad');

/** Rounds per cup, in order. */
export const CUP_ROUNDS: Partial<Record<CompId, string[]>> = {
  NC: ['Preliminary round', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'],
  LC: ['First round', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'],
  CC: ['Group stage', 'Quarter-final', 'Semi-final', 'Final'],
  PO2: ['Semi-final', 'Final'],
  PO3: ['Semi-final', 'Final'],
  SC: ['Final'],
};

/* ---------- calendar ---------- */
interface Entry { week: number; day: Slot['day']; comp: CompId; round: string }
const TEMPLATE: Entry[] = [
  { week: 0, day: 'Sat', comp: 'SC', round: 'Final' },
  ...[1, 4, 7, 8, 11, 12].map((week, i) => ({ week, day: 'Wed' as const, comp: 'CC' as const, round: `Group matchday ${i + 1}` })),
  { week: 15, day: 'Wed', comp: 'CC', round: 'Quarter-final' }, { week: 18, day: 'Wed', comp: 'CC', round: 'Semi-final' }, { week: 24, day: 'Sat', comp: 'CC', round: 'Final' },
  { week: 2, day: 'Wed', comp: 'LC', round: 'First round' }, { week: 5, day: 'Wed', comp: 'LC', round: 'Round of 16' }, { week: 9, day: 'Wed', comp: 'LC', round: 'Quarter-final' },
  { week: 14, day: 'Wed', comp: 'LC', round: 'Semi-final' }, { week: 19, day: 'Sun', comp: 'LC', round: 'Final' },
  { week: 3, day: 'Wed', comp: 'NC', round: 'Preliminary round' }, { week: 6, day: 'Wed', comp: 'NC', round: 'Round of 32' }, { week: 10, day: 'Wed', comp: 'NC', round: 'Round of 16' },
  { week: 13, day: 'Wed', comp: 'NC', round: 'Quarter-final' }, { week: 17, day: 'Wed', comp: 'NC', round: 'Semi-final' }, { week: 23, day: 'Sat', comp: 'NC', round: 'Final' },
  { week: 22, day: 'Wed', comp: 'PO2', round: 'Semi-final' }, { week: 22, day: 'Wed', comp: 'PO3', round: 'Semi-final' },
  { week: 23, day: 'Sun', comp: 'PO2', round: 'Final' }, { week: 23, day: 'Sun', comp: 'PO3', round: 'Final' },
];
export const LEAGUE_WEEKS = 22;

export function makeCalendar(year: number): Slot[] {
  const start = new Date(Date.UTC(year, 7, 8));
  while (start.getUTCDay() !== 6) start.setUTCDate(start.getUTCDate() + 1);
  const entries: Entry[] = [...TEMPLATE];
  for (let w = 1; w <= LEAGUE_WEEKS; w++) for (const d of DIVISIONS) entries.push({ week: w, day: 'Sat', comp: d, round: `Matchday ${w}` });
  const offset = { Sat: 0, Sun: 1, Wed: 4 } as const;
  const dateOf = (e: Entry) => new Date(start.getTime() + ((e.week - 1) * 7 + offset[e.day]) * 86400000).toISOString().slice(0, 10);
  const byKey = new Map<string, Slot>();
  for (const e of entries) {
    const key = `${e.week}-${e.day}`;
    if (!byKey.has(key)) byKey.set(key, { index: 0, date: dateOf(e), week: e.week, day: e.day, entries: [] });
    byKey.get(key)!.entries.push({ comp: e.comp, round: e.round });
  }
  const slots = [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date));
  slots.forEach((s, i) => { s.index = i + 1; });
  return slots;
}

export const slotFor = (s: GameState, comp: CompId, round: string) => s.calendar.find((x) => x.entries.some((e) => e.comp === comp && e.round === round))!;
export const currentSlot = (s: GameState) => s.calendar[s.matchday - 1];
/** League week of the current slot (0 = pre-season, 99 = season over). */
export const currentWeek = (s: GameState) => (s.matchday > s.calendar.length ? 99 : currentSlot(s).week);

/* ---------- leagues ---------- */
export function clubsIn(s: GameState, d: number) { return Object.values(s.clubs).filter((c) => c.division === d).map((c) => c.id); }

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
  s.fixtures.push({ id: `${s.year}-${comp}-${s.nextId++}`, matchday: slot.index, date: slot.date, homeId: home, awayId: away, comp, round, ...extra });
}

export function makeLeagueFixtures(s: GameState) {
  for (const d of [1, 2, 3]) {
    roundRobin(clubsIn(s, d)).forEach((pairs, i) => pairs.forEach(([h, a]) => add(s, divisionComp(d), `Matchday ${i + 1}`, h, a)));
  }
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

export const divisionTable = (s: GameState, d: number) => tableOf(s, divisionComp(d), clubsIn(s, d));
export const leagueDone = (s: GameState) => s.fixtures.filter((f) => f.comp === 'D1' || f.comp === 'D2' || f.comp === 'D3').every((f) => f.result);

/* ---------- cups ---------- */
const byRep = (s: GameState) => (a: string, b: string) => s.clubs[b].reputation - s.clubs[a].reputation;

function drawPairs(rng: Rng, ids: string[]): Array<[string, string]> {
  const pool = [...ids];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out: Array<[string, string]> = [];
  for (let i = 0; i + 1 < pool.length; i += 2) out.push([pool[i], pool[i + 1]]);
  return out;
}

/** Everything drawn at the start of a season. */
export function setupCups(s: GameState, rng: Rng) {
  s.cups = {};
  const d1 = clubsIn(s, 1), d2 = clubsIn(s, 2), d3 = clubsIn(s, 3);
  // Super Cup
  const [a, b] = s.qualified.superCup;
  add(s, 'SC', 'Final', a, b, { ko: true, neutral: true });
  s.cups.SC = { round: 0, alive: [a, b], exits: {} };
  // League Cup: 16 clubs (all Championship + the 4 lowest Premier) in round 1, the other 8 enter in the round of 16
  const d1Sorted = [...d1].sort(byRep(s));
  const lcFirst = [...d2, ...d1Sorted.slice(-4)];
  s.cups.LC = { round: 0, alive: [...d1Sorted.slice(0, d1.length - 4)], exits: {} };
  for (const [h, aw] of drawPairs(rng, lcFirst)) add(s, 'LC', 'First round', h, aw, { ko: true });
  // National Cup: 8 lowest-ranked League One clubs play a preliminary round, the other 28 enter in the round of 32
  const d3Sorted = [...d3].sort(byRep(s));
  const prelim = d3Sorted.slice(-8);
  s.cups.NC = { round: 0, alive: [...d1, ...d2, ...d3Sorted.slice(0, d3.length - 8)], exits: {} };
  for (const [h, aw] of drawPairs(rng, prelim)) add(s, 'NC', 'Preliminary round', h, aw, { ko: true });
  // Continental Cup: 4 domestic qualifiers + 12 foreign clubs, 4 groups of 4 drawn from pots by reputation
  const field = [...s.qualified.cc, ...Object.values(s.clubs).filter((c) => c.division === 0).map((c) => c.id)].slice(0, 16).sort(byRep(s));
  const groups: string[][] = [[], [], [], []];
  for (let pot = 0; pot < 4; pot++) {
    const potClubs = field.slice(pot * 4, pot * 4 + 4);
    const shuffled = drawPairs(rng, potClubs).flat();
    shuffled.forEach((id, g) => groups[g].push(id));
  }
  s.ccGroups = groups;
  groups.forEach((g, gi) => roundRobin(g).forEach((pairs, r) => pairs.forEach(([h, aw]) => add(s, 'CC', `Group matchday ${r + 1}`, h, aw, { group: gi }))));
  s.cups.CC = { round: 0, alive: [], exits: {} };
}

export function winnerOf(f: Fixture) {
  const r = f.result!;
  if (r.winnerId) return r.winnerId;
  if (r.score[0] !== r.score[1]) return r.score[0] > r.score[1] ? f.homeId : f.awayId;
  return r.pens && r.pens[1] > r.pens[0] ? f.awayId : f.homeId;
}
export const loserOf = (f: Fixture) => (winnerOf(f) === f.homeId ? f.awayId : f.homeId);

/** Call after a slot is played: records exits and draws the next round of any finished cup round. Returns news lines. */
export function advanceCups(s: GameState, rng: Rng, slot: Slot): string[] {
  const news: string[] = [];
  for (const e of slot.entries) {
    const comp = e.comp;
    if (comp === 'D1' || comp === 'D2' || comp === 'D3') continue;
    const cup = (s.cups[comp] ??= { round: 0, alive: [], exits: {} } as CupState);
    const played = s.fixtures.filter((f) => f.comp === comp && f.round === e.round);
    if (comp === 'CC' && e.round.startsWith('Group')) {
      if (e.round !== 'Group matchday 6') continue;
      // top two of each group reach the quarter-finals: winners at home against runners-up
      const winners: string[] = [], runners: string[] = [];
      s.ccGroups.forEach((g, gi) => {
        const t = tableOf(s, 'CC', g, gi);
        winners.push(t[0].clubId); runners.push(t[1].clubId);
        for (const r of t.slice(2)) cup.exits[r.clubId] = 'Group stage';
      });
      const rs = drawPairs(rng, runners).flat();
      winners.forEach((w, i) => add(s, 'CC', 'Quarter-final', w, rs[(i + 1) % 4] ?? rs[0], { ko: true }));
      cup.alive = [...winners, ...runners];
      news.push(`Continental Cup quarter-finalists: ${cup.alive.map((id) => s.clubs[id].name).join(', ')}.`);
      continue;
    }
    const winners = played.map(winnerOf);
    for (const f of played) cup.exits[loserOf(f)] = e.round;
    const rounds = CUP_ROUNDS[comp]!;
    const idx = rounds.indexOf(e.round);
    if (e.round === 'Final') {
      const f = played[0];
      if (f) { cup.winner = winnerOf(f); cup.runnerUp = loserOf(f); cup.exits[cup.winner] = 'Winners'; cup.exits[cup.runnerUp] = 'Final'; }
      cup.alive = cup.winner ? [cup.winner] : [];
      if (cup.winner) news.push(`${s.clubs[cup.winner].name} win the ${COMPS[comp].name}!`);
      continue;
    }
    // NC and LC have byes: before the first round `alive` holds the clubs waiting to enter; they join the winners once.
    const entrants = (comp === 'NC' || comp === 'LC') && idx === 0 ? [...cup.alive, ...winners] : winners;
    cup.alive = entrants;
    cup.round = idx + 1;
    const next = rounds[idx + 1];
    const neutral = next === 'Final' || (comp === 'NC' && next === 'Semi-final');
    for (const [h, aw] of drawPairs(rng, entrants)) add(s, comp, next, h, aw, { ko: true, neutral });
  }
  return news;
}

/** After the last league week: play-off semi-finals for 3rd–6th in the Championship and League One. */
export function setupPlayoffs(s: GameState) {
  for (const d of [2, 3] as const) {
    const t = divisionTable(s, d);
    const comp = d === 2 ? 'PO2' : 'PO3';
    s.cups[comp] = { round: 0, alive: t.slice(2, 6).map((r) => r.clubId), exits: {} };
    add(s, comp, 'Semi-final', t[2].clubId, t[5].clubId, { ko: true });
    add(s, comp, 'Semi-final', t[3].clubId, t[4].clubId, { ko: true });
  }
}

/** Furthest stage reached in a cup this season, for the history table. */
export function cupResult(s: GameState, comp: CompId, clubId: string): string | undefined {
  const cup = s.cups[comp];
  if (!cup) return undefined;
  if (cup.winner === clubId) return 'Winners';
  if (cup.exits[clubId]) return cup.exits[clubId];
  const entered = s.fixtures.some((f) => f.comp === comp && (f.homeId === clubId || f.awayId === clubId));
  return entered ? CUP_ROUNDS[comp]?.[cup.round] : undefined;
}

export interface Movements { promoted: Record<string, 2 | 1>; relegated: Record<string, 2 | 3>; champions: Record<1 | 2 | 3, string>; playoffWinners: string[] }

/** Season end: top 2 + play-off winner go up, bottom 3 go down. League One has no relegation. */
export function promotionsAndRelegations(s: GameState): Movements {
  const m: Movements = { promoted: {}, relegated: {}, champions: {} as Movements['champions'], playoffWinners: [] };
  const t1 = divisionTable(s, 1), t2 = divisionTable(s, 2), t3 = divisionTable(s, 3);
  m.champions = { 1: t1[0].clubId, 2: t2[0].clubId, 3: t3[0].clubId };
  for (const r of t1.slice(-3)) m.relegated[r.clubId] = 2;
  for (const r of t2.slice(-3)) m.relegated[r.clubId] = 3;
  const po2 = s.cups.PO2?.winner, po3 = s.cups.PO3?.winner;
  for (const id of [t2[0].clubId, t2[1].clubId, ...(po2 ? [po2] : [])]) m.promoted[id] = 1;
  for (const id of [t3[0].clubId, t3[1].clubId, ...(po3 ? [po3] : [])]) m.promoted[id] = 2;
  m.playoffWinners = [po2, po3].filter(Boolean) as string[];
  return m;
}

/** Next season's Continental Cup places (top 3 + National Cup winner, else 4th) and Super Cup pairing. */
export function qualifiers(s: GameState) {
  const t1 = divisionTable(s, 1).map((r) => r.clubId);
  const cupWinner = s.cups.NC?.winner;
  const cc = t1.slice(0, 3);
  cc.push(cupWinner && !cc.includes(cupWinner) ? cupWinner : t1[3]);
  const superCup: [string, string] = [t1[0], cupWinner && cupWinner !== t1[0] ? cupWinner : t1[1]];
  return { cc, superCup };
}

/** First season: qualification by reputation. */
export function initialQualifiers(s: GameState) {
  const d1 = clubsIn(s, 1).sort(byRep(s));
  return { cc: d1.slice(0, 4), superCup: [d1[0], d1[1]] as [string, string] };
}
