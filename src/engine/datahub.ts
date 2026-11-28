/* Season analytics for your club, from your own matches (only yours keep full detail): xG for and against match by
   match, finishing and goalkeeping against xG, where chances come from, possession and passing, and how your
   players rate. */
import type { ChanceSource, Fixture, GameState } from './types';

export interface MatchLine { id: string; n: number; opp: string; home: boolean; gf: number; ga: number; xgf: number; xga: number; poss: number; pass: number; shots: number; shotsA: number }
export interface SourceLine { src: ChanceSource; chances: number; goals: number; chancesA: number; goalsA: number }
export interface PlayerLine { id: string; name: string; pos: string; apps: number; minutes: number; rating: number; goals: number; assists: number }

const SOURCES: ChanceSource[] = ['open', 'counter', 'corner', 'free kick', 'penalty'];

export function dataHub(s: GameState) {
  const us = s.userClubId;
  const played = s.fixtures.filter((f): f is Fixture & { result: NonNullable<Fixture['result']> } => !!f.result && f.comp !== 'friendly' && (f.homeId === us || f.awayId === us) && !!f.result.stats)
    .sort((a, b) => a.matchday - b.matchday);
  const matches: MatchLine[] = played.map((f, i) => {
    const home = f.homeId === us, a = home ? 0 : 1, b = 1 - a, st = f.result.stats;
    return { id: f.id, n: i + 1, opp: s.clubs[home ? f.awayId : f.homeId]?.short ?? '?', home, gf: f.result.score[a], ga: f.result.score[b], xgf: Math.round(st.xg[a] * 100) / 100, xga: Math.round(st.xg[b] * 100) / 100, poss: st.possession[a], pass: st.passAcc[a], shots: st.shots[a], shotsA: st.shots[b] };
  });
  const sources: SourceLine[] = SOURCES.map((src) => ({ src, chances: 0, goals: 0, chancesA: 0, goalsA: 0 }));
  const per = new Map<string, PlayerLine>();
  for (const f of played) {
    const a = f.homeId === us ? 0 : 1;
    for (const c of f.result.analysis?.chances ?? []) {
      const line = sources.find((x) => x.src === c.src)!;
      if (c.side === a) { line.chances++; if (c.goal) line.goals++; } else { line.chancesA++; if (c.goal) line.goalsA++; }
    }
    for (const r of a === 0 ? f.result.ratings.home : f.result.ratings.away) {
      const p = s.players[r.playerId];
      if (!p || r.minutes <= 0) continue;
      const l = per.get(r.playerId) ?? { id: r.playerId, name: p.name, pos: p.pos, apps: 0, minutes: 0, rating: 0, goals: 0, assists: 0 };
      l.apps++; l.minutes += r.minutes; l.rating += r.rating; l.goals += r.goals; l.assists += r.assists;
      per.set(r.playerId, l);
    }
  }
  const players = [...per.values()].map((l) => ({ ...l, rating: Math.round((l.rating / l.apps) * 100) / 100 })).sort((x, y) => y.minutes - x.minutes);
  const sum = (f: (m: MatchLine) => number) => Math.round(matches.reduce((t, m) => t + f(m), 0) * 100) / 100;
  const avg = (f: (m: MatchLine) => number) => (matches.length ? Math.round(sum(f) / matches.length) : 0);
  const totals = { gf: sum((m) => m.gf), ga: sum((m) => m.ga), xgf: sum((m) => m.xgf), xga: sum((m) => m.xga), poss: avg((m) => m.poss), pass: avg((m) => m.pass), shots: sum((m) => m.shots), shotsA: sum((m) => m.shotsA) };
  return { matches, sources: sources.filter((x) => x.chances + x.chancesA > 0), players, totals };
}
