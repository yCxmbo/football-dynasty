/* All-time records across the world: top scorers (retired players stay), best single seasons, title-winning
   points tallies and record transfers. Updated at each season's end and when a fee is paid. */
import { leagueTableOf } from './competitions';
import type { GameState } from './types';

export interface Records {
  scorers: Array<{ id: string; name: string; nation: string; goals: number; apps: number; club: string }>;
  seasons: Array<{ name: string; club: string; goals: number; season: string }>;
  points: Array<{ club: string; league: string; pts: number; season: string }>;
  transfers: Array<{ name: string; from: string; to: string; fee: number; season: string }>;
  /** Recent deals worldwide (from 1M), newest first, for the transfer news. */
  deals?: DealLine[];
}
export interface DealLine { name: string; from: string; to: string; fee: number; season: string; playerId?: string; fromId?: string; toId?: string; rumoured?: boolean }

const records = (s: GameState): Records => (s.records ??= { scorers: [], seasons: [], points: [], transfers: [] });
const top = <T,>(list: T[], by: (x: T) => number, n: number) => list.sort((a, b) => by(b) - by(a)).slice(0, n);

export function recordTransfer(s: GameState, name: string, from: string, to: string, fee: number, season: string, extra: Partial<DealLine> = {}) {
  const r = records(s);
  if (fee >= 1_000_000) {
    (r.deals ??= []).unshift({ name, from, to, fee, season, ...extra });
    if (r.deals.length > 300) r.deals.length = 300;
  }
  if (fee < 5_000_000) return;
  r.transfers = top([...r.transfers, { name, from, to, fee, season }], (x) => x.fee, 15);
}

/** Before the season's numbers are reset. */
export function recordSeason(s: GameState, season: string) {
  const r = records(s);
  const club = (id: string) => s.clubs[id]?.name ?? 'Free agent';
  const best = Object.values(s.players).filter((p) => p.current.goals >= 15).map((p) => ({ name: p.name, club: club(p.clubId), goals: p.current.goals, season }));
  r.seasons = top([...r.seasons, ...best], (x) => x.goals, 15);
  const champs = s.world.leagues.filter((l) => l.tier === 1).map((l) => ({ l, row: leagueTableOf(s, l.id)[0] })).filter((x) => x.row);
  r.points = top([...r.points, ...champs.map(({ l, row }) => ({ club: row.club, league: l.name, pts: row.pts, season }))], (x) => x.pts, 15);
  // career goals: every season on record plus this one; players who retire keep their place
  const byId = new Map(r.scorers.map((x) => [x.id, x]));
  for (const p of Object.values(s.players)) {
    const goals = p.career.reduce((a, c) => a + c.goals, 0) + p.current.goals;
    if (goals < 40) continue;
    byId.set(p.id, { id: p.id, name: p.name, nation: p.nationality, goals, apps: p.career.reduce((a, c) => a + c.apps, 0) + p.current.apps, club: club(p.clubId) });
  }
  r.scorers = top([...byId.values()], (x) => x.goals, 25);
}

/** Titles won since the career began, per club, for a kind of trophy. */
export function titleCounts(s: GameState, tier: 'league' | 'continental') {
  // league titles: top flights only (second-division titles don't count here)
  const top = new Set(s.world.leagues.filter((l) => l.tier === 1).map((l) => l.titlePlayoff?.trophy ?? l.name));
  return Object.entries(s.trophies)
    .map(([id, list]) => ({ id, n: list.filter((t) => t.tier === tier && (tier !== 'league' || top.has(t.name))).reduce((a, t) => a + t.seasons.length, 0) }))
    .filter((x) => x.n > 0 && s.clubs[x.id]).sort((a, b) => b.n - a.n).slice(0, 15);
}
