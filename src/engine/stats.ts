/* League and competition leaders, and the season numbers behind them. All competitions count, as in
   the season's records; a minimum of games keeps the averages honest. */
import type { GameState, Player } from './types';

export type Metric = 'goals' | 'assists' | 'contrib' | 'rating' | 'cleanSheets' | 'potm';
export const METRICS: Array<{ id: Metric; label: string; short: string }> = [
  { id: 'goals', label: 'Top scorers', short: 'Goals' },
  { id: 'assists', label: 'Most assists', short: 'Assists' },
  { id: 'contrib', label: 'Goals and assists', short: 'G+A' },
  { id: 'rating', label: 'Best average rating', short: 'Rating' },
  { id: 'cleanSheets', label: 'Clean sheets', short: 'Clean sheets' },
  { id: 'potm', label: 'Player of the match', short: 'Awards' },
];

export const avgRating = (p: Player) => (p.current.apps ? p.current.ratingSum / p.current.apps : 0);
export function value(p: Player, m: Metric) {
  const c = p.current;
  return m === 'goals' ? c.goals : m === 'assists' ? c.assists : m === 'contrib' ? c.goals + c.assists : m === 'rating' ? avgRating(p) : m === 'cleanSheets' ? c.cleanSheets ?? 0 : c.potm ?? 0;
}

/** Players at clubs in a league (or every league with 'all'), best first for a metric. */
export function leaders(s: GameState, scope: string, m: Metric, n = 10): Player[] {
  const inScope = (p: Player) => { const c = s.clubs[p.clubId]; return !!c?.league && (scope === 'all' || c.league === scope); };
  const pool = Object.values(s.players).filter((p) => p.current.apps > 0 && inScope(p));
  const maxApps = Math.max(1, ...pool.map((p) => p.current.apps));
  const eligible = m === 'rating' ? pool.filter((p) => p.current.apps >= Math.max(3, Math.round(maxApps / 3))) : m === 'cleanSheets' ? pool.filter((p) => p.pos === 'GK') : pool;
  return eligible.filter((p) => value(p, m) > 0).sort((a, b) => value(b, m) - value(a, m) || a.current.apps - b.current.apps).slice(0, n);
}

/** A visible attribute as the user knows it: exact for scouted players, a range otherwise. */
export function attrRange(v: number, knowledge: number): [number, number] {
  const spread = Math.round((100 - knowledge) / 20);
  return [Math.max(1, v - spread), Math.min(20, v + spread)];
}
