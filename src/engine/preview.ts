/* What the pundits think: predicted league tables before each season (from squad strength and the manager),
   players to watch, and win/draw/loss odds for a match. */
import { clubsInLeague } from './competitions';
import { squadOf } from './index';
import { managerOf } from './managers';
import { seasonLabel, type GameState } from './types';

export interface Predictions { season: string; tables: Record<string, string[]> }

/** A club's strength as the pundits see it: its best eleven, plus a little for a good manager. */
export function punditStrength(s: GameState, clubId: string) {
  const best = squadOf(s, clubId).filter((p) => p.squad === 'First team' && p.injuredFor < 10).map((p) => p.ability).sort((a, b) => b - a).slice(0, 11);
  const xi = best.length ? best.reduce((a, b) => a + b, 0) / best.length : 60;
  const mgr = clubId === s.userClubId ? 11 : managerOf(s, clubId)?.rating ?? 9;
  return xi + (mgr - 11) * 0.6;
}

/** Each league's predicted order, stored for the season. Call once the season is set up. */
export function makePredictions(s: GameState) {
  const tables: Record<string, string[]> = {};
  for (const l of s.world.leagues) {
    const st = new Map(clubsInLeague(s, l.id).map((id) => [id, punditStrength(s, id)]));
    tables[l.id] = [...st.keys()].sort((a, b) => st.get(b)! - st.get(a)! || s.clubs[b].reputation - s.clubs[a].reputation);
  }
  s.predictions = { season: seasonLabel(s.year), tables };
  return s.predictions;
}

export const predictedPos = (s: GameState, clubId: string) => {
  const l = s.clubs[clubId]?.league;
  const t = l && s.predictions?.season === seasonLabel(s.year) ? s.predictions.tables[l] : undefined;
  const i = t ? t.indexOf(clubId) : -1;
  return i >= 0 ? i + 1 : undefined;
};

/** Win, draw and loss chances for the home side, as percentages that add up to 100. */
export function matchOdds(s: GameState, homeId: string, awayId: string, neutral = false) {
  const d = (punditStrength(s, homeId) - punditStrength(s, awayId)) / 9 + (neutral ? 0 : 0.35);
  const draw = Math.max(0.14, 0.29 - Math.min(0.15, Math.abs(d) * 0.05));
  const home = (1 - draw) / (1 + Math.exp(-d * 1.1));
  const h = Math.round(home * 100), dr = Math.round(draw * 100);
  return { home: h, draw: dr, away: 100 - h - dr };
}

/** The inbox preview for your league: favourites, dark horses, the drop, your tip, and players to watch. */
export function previewMessage(s: GameState): { subject: string; body: string[] } | undefined {
  const us = s.clubs[s.userClubId];
  const l = s.world.leagues.find((x) => x.id === us.league);
  const t = l && s.predictions?.tables[l.id];
  if (!l || !t) return undefined;
  const name = (id: string) => s.clubs[id]?.name ?? '?';
  const mine = t.indexOf(us.id) + 1;
  const n = t.length;
  // dark horse: the club most above its reputation rank
  const byRep = [...t].sort((a, b) => s.clubs[b].reputation - s.clubs[a].reputation);
  const dark = t.slice(3).map((id, i) => ({ id, gain: byRep.indexOf(id) - (i + 3) })).filter((x) => x.id !== us.id).sort((a, b) => b.gain - a.gain)[0];
  const players = t.flatMap((id) => squadOf(s, id).filter((p) => p.squad === 'First team'));
  const stars = players.slice().sort((a, b) => b.ability - a.ability).slice(0, 3);
  const kid = players.filter((p) => p.age <= 21).sort((a, b) => b.potential - a.potential)[0];
  const down = l.relegate ? t.slice(-l.relegate) : [];
  const body = [
    `Title favourites: ${name(t[0])}, ahead of ${name(t[1])} and ${name(t[2])}.`,
    ...(dark && dark.gain >= 2 ? [`Dark horse: ${name(dark.id)}, tipped to finish ${ord(t.indexOf(dark.id) + 1)}.`] : []),
    ...(down.length ? [`Tipped to go down: ${down.map(name).join(', ')}.`] : []),
    `${us.name}: predicted ${ord(mine)} of ${n}.${mine <= 1 ? ' Everyone expects you to win it.' : mine > n - (l.relegate || 0) ? ' Few give you much hope.' : ''}`,
    `Players to watch: ${stars.map((p) => `${p.name} (${s.clubs[p.clubId]?.short})`).join(', ')}${kid ? `; the young talent to follow is ${kid.name} (${s.clubs[kid.clubId]?.short}, ${kid.age})` : ''}.`,
    'The predicted table is on the Competitions screen, next to how things stand.',
  ];
  return { subject: `${l.name} ${seasonLabel(s.year)} preview: ${name(t[0])} the favourites, ${us.name} tipped ${ord(mine)}`, body };
}

const ord = (n: number) => { const x = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (x[(v - 20) % 10] || x[v] || x[0]); };
