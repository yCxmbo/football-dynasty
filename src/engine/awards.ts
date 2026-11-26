/* End-of-season awards. In each top flight: Player of the Season, Young Player of the Season (21 and under),
   the top scorer and a Team of the Season (4-3-3). Worldwide: the Golden Ball (top three) and the Golden Boy.
   Worked out from the season's appearances, average ratings and goals, before they are reset. */
import { leagueTableOf } from './competitions';
import type { GameState, Player } from './types';

export interface AwardWinner { id: string; name: string; club: string; clubId: string; nation: string; age: number; pos: string; apps: number; goals: number; rating: number }
export interface LeagueAwards { leagueId: string; league: string; pots?: AwardWinner; young?: AwardWinner; scorer?: AwardWinner; team: AwardWinner[] }
export interface SeasonAwards { season: string; ball: AwardWinner[]; boy?: AwardWinner; leagues: LeagueAwards[] }
export interface Awards { latest?: SeasonAwards; history: Array<{ season: string; ball: AwardWinner[]; boy?: AwardWinner }> }

export const YOUNG_AGE = 21;
/** 4-3-3: which primary positions can fill each slot. */
const SHAPE: Array<{ slot: string; fits: string[] }> = [
  { slot: 'GK', fits: ['GK'] },
  { slot: 'RB', fits: ['RB', 'RWB'] }, { slot: 'CB', fits: ['CB'] }, { slot: 'CB', fits: ['CB'] }, { slot: 'LB', fits: ['LB', 'LWB'] },
  { slot: 'CM', fits: ['DM', 'CM'] }, { slot: 'CM', fits: ['CM', 'DM', 'AM'] }, { slot: 'AM', fits: ['AM', 'CM'] },
  { slot: 'RW', fits: ['RW', 'RM'] }, { slot: 'ST', fits: ['ST'] }, { slot: 'LW', fits: ['LW', 'LM'] },
];
export const TEAM_SLOTS = SHAPE.map((x) => x.slot);

const avg = (p: Player) => (p.current.apps ? p.current.ratingSum / p.current.apps : 0);

function winner(s: GameState, p: Player): AwardWinner {
  return { id: p.id, name: p.name, club: s.clubs[p.clubId]?.name ?? 'Free agent', clubId: p.clubId, nation: p.nationality, age: p.age, pos: p.pos,
    apps: p.current.apps, goals: p.current.goals, rating: Math.round(avg(p) * 100) / 100 };
}

/** Works out the season's awards, stores them and notes them on the winners. Call before the stats are reset. */
export function seasonAwards(s: GameState, season: string): SeasonAwards {
  const tops = s.world.leagues.filter((l) => l.tier === 1);
  const byClub = new Map<string, Player[]>();
  for (const p of Object.values(s.players)) if (p.current.apps) { const l = byClub.get(p.clubId); if (l) l.push(p); else byClub.set(p.clubId, [p]); }
  // trophies won this season, for the Golden Ball
  const won: Record<string, number> = {};
  for (const c of Object.values(s.comps)) {
    if (c.kind === 'friendly' || c.kind === 'playoff') continue;
    const w = c.kind === 'league' ? (c.tier === 1 ? leagueTableOf(s, c.id)[0]?.clubId : undefined) : s.cups[c.id]?.winner;
    if (!w) continue;
    const weight = c.kind === 'continental' ? (c.rank === 1 ? 1.2 : 0.5) : c.kind === 'league' || c.kind === 'title' ? 0.8 : c.kind === 'super' ? 0.1 : 0.3;
    won[w] = (won[w] ?? 0) + weight;
  }
  const leagues: LeagueAwards[] = [];
  const pool: Array<{ p: Player; score: number }> = [];
  for (const l of tops) {
    const table = leagueTableOf(s, l.id);
    if (!table.length) continue;
    const games = Math.max(...table.map((r) => r.p));
    const minApps = Math.max(8, Math.round(games * 0.55));
    const players = table.flatMap((r) => byClub.get(r.clubId) ?? []);
    const regular = players.filter((p) => p.current.apps >= minApps).sort((a, b) => avg(b) - avg(a));
    const strength = table.reduce((a, r) => a + (s.clubs[r.clubId]?.reputation ?? 50), 0) / table.length;
    for (const p of regular) {
      const goals = p.current.goals / Math.max(1, p.current.apps);
      pool.push({ p, score: avg(p) + (strength - 60) / 20 + (won[p.clubId] ?? 0) * 0.35 + Math.min(goals, 1) * 0.6 + p.ability / 70 });
    }
    const taken = new Set<string>();
    const team: AwardWinner[] = [];
    for (const { fits } of SHAPE) {
      const pick = regular.find((p) => !taken.has(p.id) && fits.includes(p.pos));
      if (pick) { taken.add(pick.id); team.push(winner(s, pick)); }
    }
    const scorer = players.filter((p) => p.current.goals > 0).sort((a, b) => b.current.goals - a.current.goals || a.current.apps - b.current.apps)[0];
    const young = regular.find((p) => p.age <= YOUNG_AGE) ?? players.filter((p) => p.age <= YOUNG_AGE && p.current.apps >= minApps / 2).sort((a, b) => avg(b) - avg(a))[0];
    leagues.push({ leagueId: l.id, league: l.name, pots: regular[0] && winner(s, regular[0]), young: young && winner(s, young), scorer: scorer && winner(s, scorer), team });
  }
  pool.sort((a, b) => b.score - a.score);
  const ball = pool.slice(0, 3).map((x) => winner(s, x.p));
  // the Golden Boy rewards talent as well as the season: potential counts too
  const boyP = pool.filter((x) => x.p.age <= YOUNG_AGE).sort((a, b) => b.score + b.p.potential / 60 - (a.score + a.p.potential / 60))[0]?.p;
  const result: SeasonAwards = { season, ball, boy: boyP && winner(s, boyP), leagues };

  const a = (s.awards ??= { history: [] });
  a.latest = result;
  a.history.unshift({ season, ball, boy: result.boy });
  if (a.history.length > 60) a.history.length = 60;
  const note = (w: AwardWinner | undefined, title: string) => { if (w && s.players[w.id]) (s.players[w.id].awards ??= []).unshift(`${title} ${season}`); };
  note(ball[0], 'Golden Ball');
  note(result.boy, 'Golden Boy');
  for (const l of leagues) {
    note(l.pots, `${l.league} Player of the Season`);
    note(l.young, `${l.league} Young Player of the Season`);
    note(l.scorer, `${l.league} top scorer`);
    for (const w of l.team) note(w, `${l.league} Team of the Season`);
  }
  return result;
}

/** The inbox story: the world awards, your league's, and every honour for your own players. */
export function awardsMessage(s: GameState, a: SeasonAwards): string[] {
  const us = s.userClubId;
  const who = (w: AwardWinner) => `${w.name} (${w.club})`;
  const lines: string[] = [];
  if (a.ball.length) lines.push(`Golden Ball: ${who(a.ball[0])}${a.ball.length > 1 ? `, ahead of ${a.ball.slice(1).map(who).join(' and ')}` : ''}.`);
  if (a.boy) lines.push(`Golden Boy: ${who(a.boy)}, aged ${a.boy.age}.`);
  const mine = a.leagues.find((l) => s.clubs[us]?.league === l.leagueId);
  if (mine) {
    if (mine.pots) lines.push(`${mine.league} Player of the Season: ${who(mine.pots)}, average rating ${mine.pots.rating.toFixed(2)}.`);
    if (mine.young) lines.push(`Young Player of the Season: ${who(mine.young)}.`);
    if (mine.scorer) lines.push(`Top scorer: ${who(mine.scorer)} with ${mine.scorer.goals} goals.`);
  }
  const ours = new Map<string, string[]>();
  const add = (w: AwardWinner | undefined, t: string) => { if (w?.clubId === us) ours.set(w.name, [...(ours.get(w.name) ?? []), t]); };
  a.ball.forEach((w, i) => add(w, i === 0 ? 'the Golden Ball' : `${i === 1 ? 'second' : 'third'} in the Golden Ball`));
  add(a.boy, 'the Golden Boy');
  for (const l of a.leagues) {
    add(l.pots, 'Player of the Season'); add(l.young, 'Young Player of the Season'); add(l.scorer, 'the golden boot');
    for (const w of l.team) add(w, 'a place in the Team of the Season');
  }
  lines.push(ours.size ? `Our winners: ${[...ours].map(([n, t]) => `${n} (${t.join(', ')})`).join('; ')}.` : 'None of our players won an award this year.');
  lines.push('Every winner and the Teams of the Season are on the Records screen.');
  return lines;
}
