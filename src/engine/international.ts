/* International football: national-team squads from the world's players, and the summer tournaments
   (World Cup, Euro, Copa América) played between seasons with the same match engine as club football. */
import { pickLineup, type Formation } from './match';
import { createLive, runToEnd, toResult } from './live';
import { NATION, NATIONS, type Confed } from './nations';
import type { Rng } from './rng';
import type { GameState, Player } from './types';
import { makePlayer } from './world';

export type TournamentId = 'wc' | 'euro' | 'copa' | 'afcon' | 'asian';
export interface IntlMatch { h: string; a: string; s: [number, number]; p?: [number, number]; stage: string; g?: number }
export interface Tournament {
  id: TournamentId; name: string; year: number; hosts: string[];
  teams: string[]; groups: string[][]; matches: IntlMatch[];
  winner: string; runnerUp: string; third?: string[];
  /** Golden Boot. playerId is set for players in the world. */ topScorer?: { name: string; nation: string; goals: number; playerId?: string };
  /** Best player by average match rating (at least three games). */ bestPlayer?: { name: string; nation: string; rating: number; playerId?: string };
  /** Squads: ids of the world's players called up, per nation. */ squads: Record<string, string[]>;
}

interface Spec { id: TournamentId; name: string; size: 16 | 24 | 48; confeds: Partial<Record<Confed, number>>; wildcards?: number }
const SPECS: Record<TournamentId, Spec> = {
  wc: { id: 'wc', name: 'FIFA World Cup', size: 48, confeds: { UEFA: 16, CAF: 9, AFC: 8, CONMEBOL: 6, CONCACAF: 6, OFC: 1 }, wildcards: 2 },
  euro: { id: 'euro', name: 'UEFA Euro', size: 24, confeds: { UEFA: 24 } },
  copa: { id: 'copa', name: 'Copa América', size: 16, confeds: { CONMEBOL: 10, CONCACAF: 6 } },
  afcon: { id: 'afcon', name: 'Africa Cup of Nations', size: 24, confeds: { CAF: 24 } },
  asian: { id: 'asian', name: 'AFC Asian Cup', size: 24, confeds: { AFC: 24 } },
};

/** Real hosts where they are known; later editions get a strong host from the right region. */
const HOSTS: Record<string, string[]> = { 'wc-2026': ['USA', 'MEX', 'CAN'], 'wc-2030': ['ESP', 'POR', 'MAR'], 'wc-2034': ['KSA'], 'euro-2028': ['ENG', 'SCO', 'WAL', 'IRL'], 'euro-2032': ['ITA', 'TUR'], 'copa-2028': ['ARG'], 'afcon-2027': ['KEN', 'UGA', 'TAN'], 'asian-2027': ['KSA'] };

/** Tournaments played in the summer that ends a season (state.year is the season's start year). */
export function summerTournaments(seasonStartYear: number): TournamentId[] {
  const y = seasonStartYear + 1;
  return y % 4 === 2 ? ['wc'] : y % 4 === 0 ? ['euro', 'copa'] : y % 4 === 3 ? ['afcon', 'asian'] : [];
}

/** The next summer with a tournament, for display. */
export function nextTournaments(seasonStartYear: number) {
  for (let y = seasonStartYear; y < seasonStartYear + 4; y++) { const t = summerTournaments(y); if (t.length) return { year: y + 1, ids: t, names: t.map((id) => SPECS[id].name) }; }
  return { year: seasonStartYear + 1, ids: [] as TournamentId[], names: [] as string[] };
}
export const tournamentName = (id: TournamentId) => SPECS[id].name;
/** Whether a nation's confederation plays in a tournament. */
export const takesPart = (id: TournamentId, code: string) => !!NATION[code] && SPECS[id].confeds[NATION[code].confed] !== undefined;

/* ---------- national squads ---------- */
const DEPTH: Array<[Player['pos'], number]> = [['GK', 3], ['CB', 4], ['LB', 2], ['RB', 2], ['DM', 2], ['CM', 3], ['AM', 2], ['LW', 2], ['RW', 2], ['ST', 4]];

export interface NationalSquad { code: string; players: Player[]; xi: Player[]; bench: Player[]; strength: number; called: string[]; formation: Formation }

function byNation(s: GameState) {
  const m = new Map<string, Player[]>();
  for (const p of Object.values(s.players)) {
    if (p.injuredFor > 0 || p.age < 17) continue;
    const list = m.get(p.nationality); if (list) list.push(p); else m.set(p.nationality, [p]);
  }
  return m;
}

/** Best 26: the world's players of that nationality plus generated depth players where there are too few good ones. */
function nationalSquad(code: string, pool: Player[], rng: Rng, year: number, pick?: { ids: string[]; formation: Formation }): NationalSquad {
  const n = NATION[code];
  const base = n.ovr * 2 - 10;
  const depth: Player[] = [];
  let k = 0;
  for (const [pos, count] of DEPTH) for (let i = 0; i < count; i++) {
    const ca = Math.round(base - 4 - i * 6 + rng.normal(0, 4));
    const p = makePlayer(rng, { id: `nt-${code}-${k++}`, clubId: '', pos, ca, pa: ca, age: rng.int(21, 31), squad: 'First team', number: 0, year, reputation: n.ovr, nationality: code });
    depth.push(p);
  }
  // squad fillers from the world's start play at their nation's usual level at most
  const cap = base + 6;
  const capped = pool.map((p) => (p.filler && p.ability > cap ? { ...p, ability: cap } : p));
  // your selection goes in first (if you manage this nation); the best of the rest fill the 26
  const chosen = new Set(pick?.ids ?? []);
  const all = [...capped, ...depth].sort((a, b) => (chosen.has(b.id) ? 1 : 0) - (chosen.has(a.id) ? 1 : 0) || b.ability - a.ability);
  const gks = all.filter((p) => p.pos === 'GK').slice(0, 3);
  const outfield = all.filter((p) => p.pos !== 'GK').slice(0, 23);
  // fresh for the summer, and everyone counts as first team for selection
  const players = [...gks, ...outfield].map((p) => ({ ...p, condition: 100, squad: 'First team' as const, suspendedFor: 0 }));
  const formation = pick?.formation ?? '4-3-3';
  const ids = pickLineup(players, formation);
  const xi = ids.map((id) => players.find((p) => p.id === id)!).filter(Boolean);
  const bench = players.filter((p) => !ids.includes(p.id)).slice(0, 12);
  const strength = xi.reduce((a, p) => a + p.ability, 0) / Math.max(1, xi.length);
  return { code, players, xi, bench, strength, formation, called: players.filter((p) => !p.id.startsWith('nt-')).map((p) => p.id) };
}

/** Strength of every nation now (average ability of its best XI), strongest first. */
export function nationRanking(s: GameState, rng: Rng) {
  const pools = byNation(s);
  return NATIONS.map((n) => nationalSquad(n.code, pools.get(n.code) ?? [], rng, s.year)).sort((a, b) => b.strength - a.strength);
}

/* ---------- tournaments ---------- */
/** Tournament football rewards quality more than a league week does: strong squads get a little extra. */
const edge = (strength: number) => (strength / 150) ** 1.6;

interface Row { code: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; g: number }
export function groupTable(t: Pick<Tournament, 'groups' | 'matches'>, g: number): Row[] {
  const rows = new Map(t.groups[g].map((code) => [code, { code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, g }]));
  for (const m of t.matches) {
    if (m.g !== g || m.stage !== 'Group') continue;
    const h = rows.get(m.h)!, a = rows.get(m.a)!;
    h.p++; a.p++; h.gf += m.s[0]; h.ga += m.s[1]; a.gf += m.s[1]; a.ga += m.s[0];
    if (m.s[0] > m.s[1]) { h.w++; a.l++; h.pts += 3; } else if (m.s[0] < m.s[1]) { a.w++; h.l++; a.pts += 3; } else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  return [...rows.values()].sort(cmpRow);
}
const cmpRow = (x: Row, y: Row) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.code.localeCompare(y.code);

const KO_NAMES: Record<number, string> = { 32: 'Round of 32', 16: 'Round of 16', 8: 'Quarter-final', 4: 'Semi-final', 2: 'Final' };

/** Seeded bracket order for n teams: 1 and 2 can only meet in the final. */
function bracket(n: number): number[] {
  let order = [0];
  while (order.length < n) { const m = order.length * 2; order = order.flatMap((s) => [s, m - 1 - s]); }
  return order;
}

export interface TournamentRun { tournament: Tournament; messages: string[]; userPlayers: Array<{ id: string; name: string; nation: string; reached: string }>; /** Your national team, if you manage one that could take part. */ userNation?: { code: string; reached: string } }

export function playTournament(s: GameState, rng: Rng, id: TournamentId, year: number): TournamentRun {
  const spec = SPECS[id];
  const pools = byNation(s);
  const squads = new Map<string, NationalSquad>();
  const job = s.nationalJob;
  const squadOf = (code: string) => {
    let q = squads.get(code);
    if (!q) { q = nationalSquad(code, pools.get(code) ?? [], rng, s.year, job?.code === code ? { ids: job.squad, formation: job.formation } : undefined); squads.set(code, q); }
    return q;
  };

  // qualification: hosts, then the strongest of each confederation with some luck (the qualifiers)
  const known = HOSTS[`${id}-${year}`];
  const eligible = NATIONS.filter((n) => spec.confeds[n.confed] !== undefined);
  const hosts = known ?? [eligible.slice().sort((a, b) => b.ovr - a.ovr)[rng.int(0, 7)].code];
  const form = new Map(eligible.map((n) => [n.code, squadOf(n.code).strength + rng.normal(0, 7)]));
  const teams = new Set(hosts.filter((h) => NATION[h]));
  for (const [confed, quota] of Object.entries(spec.confeds) as Array<[Confed, number]>) {
    const list = eligible.filter((n) => n.confed === confed).sort((a, b) => form.get(b.code)! - form.get(a.code)!);
    let have = [...teams].filter((c) => NATION[c].confed === confed).length;
    for (const n of list) { if (have >= quota) break; if (!teams.has(n.code)) { teams.add(n.code); have++; } }
  }
  const rest = eligible.filter((n) => !teams.has(n.code)).sort((a, b) => form.get(b.code)! - form.get(a.code)!);
  while (teams.size < spec.size && rest.length) teams.add(rest.shift()!.code);
  const field = [...teams].sort((a, b) => (hosts.includes(b) ? 1 : 0) - (hosts.includes(a) ? 1 : 0) || squadOf(b).strength - squadOf(a).strength);

  // draw: four pots, keeping confederations apart (Europe may have two per group)
  const G = spec.size / 4;
  const groups: string[][] = Array.from({ length: G }, () => []);
  for (let pot = 0; pot < 4; pot++) {
    const potTeams = field.slice(pot * G, pot * G + G);
    if (pot > 0 || !known) for (let i = potTeams.length - 1; i > 0; i--) { const j = rng.int(0, i); [potTeams[i], potTeams[j]] = [potTeams[j], potTeams[i]]; }
    for (let g = 0; g < G; g++) {
      const ok = (code: string) => { const c = NATION[code].confed; const same = groups[g].filter((x) => NATION[x].confed === c).length; return c === 'UEFA' ? same < 2 : same === 0; };
      let k = potTeams.findIndex(ok);
      if (k < 0) k = 0;
      groups[g].push(potTeams.splice(k, 1)[0]);
    }
  }

  const t: Tournament = { id, name: `${spec.name} ${year}`, year, hosts, teams: field, groups, matches: [], winner: '', runnerUp: '', squads: {} };
  const goals = new Map<string, { name: string; nation: string; goals: number; playerId?: string }>();
  const ratings = new Map<string, { name: string; nation: string; sum: number; n: number; playerId?: string }>();
  const caps = new Map<string, { apps: number; goals: number }>();

  const play = (h: string, a: string, stage: string, g?: number) => {
    const H = squadOf(h), A = squadOf(a);
    const homeAdv = hosts.includes(h) && !hosts.includes(a);
    const lm = createLive(rng.int(0, 2 ** 30), { xi: H.xi, bench: H.bench, formation: H.formation, name: NATION[h].name }, { xi: A.xi, bench: A.bench, formation: A.formation, name: NATION[a].name },
      homeAdv ? `${NATION[h].name} home stadium` : 'Neutral venue', { neutral: !homeAdv, knockout: stage !== 'Group', homeBoost: (homeAdv ? 1.04 : 1) * edge(H.strength), awayBoost: edge(A.strength) });
    runToEnd(lm);
    const { result } = toResult(lm, h, a);
    if (job && (h === job.code || a === job.code)) {
      const [us, them] = h === job.code ? result.score : [result.score[1], result.score[0]];
      if (us > them) job.w++; else if (us < them) job.l++; else job.d++;
    }
    const m: IntlMatch = { h, a, s: result.score, stage, ...(g !== undefined ? { g } : {}), ...(result.pens ? { p: result.pens } : {}) };
    t.matches.push(m);
    for (const [side, code, sq] of [['home', h, H], ['away', a, A]] as const) {
      for (const r of result.ratings[side]) {
        const p = sq.players.find((x) => x.id === r.playerId);
        if (!p || !r.minutes) continue;
        const real = !p.id.startsWith('nt-');
        if (real) { const c = caps.get(p.id) ?? { apps: 0, goals: 0 }; c.apps++; c.goals += r.goals; caps.set(p.id, c); }
        if (r.goals) { const e = goals.get(p.id) ?? { name: p.name, nation: code, goals: 0, playerId: real ? p.id : undefined }; e.goals += r.goals; goals.set(p.id, e); }
        if (r.minutes >= 45) { const e = ratings.get(p.id) ?? { name: p.name, nation: code, sum: 0, n: 0, playerId: real ? p.id : undefined }; e.sum += r.rating; e.n++; ratings.set(p.id, e); }
      }
    }
    return result.winnerId ?? (result.score[0] >= result.score[1] ? h : a);
  };

  // group stage: three matchdays
  const PAIRS = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]];
  for (const md of PAIRS) groups.forEach((grp, g) => md.forEach(([x, y]) => play(grp[x], grp[y], 'Group', g)));
  const tables = groups.map((_, g) => groupTable(t, g));
  const koSize = spec.size === 48 ? 32 : spec.size === 24 ? 16 : 8;
  const winners = tables.map((r) => r[0]), runners = tables.map((r) => r[1]);
  const thirds = tables.map((r) => r[2]).sort(cmpRow).slice(0, koSize - 2 * G);
  const seeds = [...winners.sort(cmpRow), ...runners.sort(cmpRow), ...thirds].map((r) => r.code);
  let round = bracket(koSize).map((i) => seeds[i]);
  // avoid a group rematch in the first knockout round where a neighbouring swap fixes it
  const groupOf = (c: string) => groups.findIndex((g) => g.includes(c));
  for (let i = 0; i < round.length; i += 2) if (groupOf(round[i]) === groupOf(round[i + 1])) {
    const j = (i + 2) % round.length;
    if (groupOf(round[i]) !== groupOf(round[j + 1]) && groupOf(round[j]) !== groupOf(round[i + 1])) [round[i + 1], round[j + 1]] = [round[j + 1], round[i + 1]];
  }
  const reached = new Map<string, string>(field.map((c) => [c, 'Group stage']));
  while (round.length > 1) {
    const name = KO_NAMES[round.length];
    const next: string[] = [];
    for (let i = 0; i < round.length; i += 2) {
      reached.set(round[i], name); reached.set(round[i + 1], name);
      const w = play(round[i], round[i + 1], name);
      next.push(w);
      if (round.length === 2) { t.winner = w; t.runnerUp = w === round[i] ? round[i + 1] : round[i]; }
      if (round.length === 4) (t.third ??= []).push(w === round[i] ? round[i + 1] : round[i]);
    }
    round = next;
  }
  reached.set(t.winner, 'Winners');
  reached.set(t.runnerUp, 'Runners-up');

  const top = [...goals.values()].sort((a, b) => b.goals - a.goals)[0];
  if (top) t.topScorer = top;
  const best = [...ratings.values()].filter((r) => r.n >= 3).sort((a, b) => b.sum / b.n - a.sum / a.n)[0];
  if (best) t.bestPlayer = { name: best.name, nation: best.nation, rating: Math.round((best.sum / best.n) * 100) / 100, playerId: best.playerId };
  for (const code of field) t.squads[code] = squadOf(code).called;

  // effects on the world's players: caps, goals and titles
  for (const code of field) for (const pid of squadOf(code).called) {
    const p = s.players[pid];
    if (!p) continue;
    const c = caps.get(pid);
    const intl = (p.intl ??= { caps: 0, goals: 0, titles: [] });
    if (c) { intl.caps += c.apps; intl.goals += c.goals; }
    if (code === t.winner) { intl.titles.push(t.name); p.morale = 'high'; }
  }

  const userPlayers = field.flatMap((code) => squadOf(code).called.filter((pid) => s.players[pid]?.clubId === s.userClubId)
    .map((pid) => ({ id: pid, name: s.players[pid].name, nation: code, reached: reached.get(code)! })));
  const fin = t.matches[t.matches.length - 1];
  const score = `${fin.s[0]}–${fin.s[1]}${fin.p ? ` (${fin.p[0]}–${fin.p[1]} on penalties)` : ''}`;
  const messages = [
    `${NATION[t.winner].name} win the ${t.name}, beating ${NATION[t.runnerUp].name} ${score} in the final.`,
    ...(t.topScorer ? [`Golden Boot: ${t.topScorer.name} (${NATION[t.topScorer.nation].name}), ${t.topScorer.goals} goals.`] : []),
    ...(t.bestPlayer ? [`Player of the tournament: ${t.bestPlayer.name} (${NATION[t.bestPlayer.nation].name}).`] : []),
  ];
  let userNation: TournamentRun['userNation'];
  if (job && spec.confeds[NATION[job.code].confed] !== undefined) {
    userNation = { code: job.code, reached: reached.get(job.code) ?? 'Did not qualify' };
    job.tournaments.push({ name: t.name, reached: userNation.reached });
  }
  return { tournament: t, messages, userPlayers, userNation };
}

/** Plays this summer's tournaments and stores them. Returns news for the inbox. */
export function playSummer(s: GameState, rng: Rng) {
  const year = s.year + 1;
  const out: TournamentRun[] = [];
  for (const id of summerTournaments(s.year)) {
    const run = playTournament(s, rng, id, year);
    (s.internationals ??= []).push(run.tournament);
    out.push(run);
  }
  return out;
}
