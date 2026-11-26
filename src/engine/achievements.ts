/* Career milestones. Each unlocks once, with the season it happened, and arrives in the inbox. */
import { leagueDef, leagueTableOf } from './competitions';
import type { Fixture, GameState } from './types';
import { seasonLabel } from './types';

export interface AchievementDef { id: string; title: string; desc: string; group: 'Results' | 'Trophies' | 'Club' | 'Career' }
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-win', title: 'Off the mark', desc: 'Win your first match.', group: 'Results' },
  { id: 'wins-50', title: 'Fifty up', desc: 'Win 50 matches as a manager.', group: 'Results' },
  { id: 'wins-100', title: 'Centurion', desc: 'Win 100 matches.', group: 'Results' },
  { id: 'wins-250', title: 'Serial winner', desc: 'Win 250 matches.', group: 'Results' },
  { id: 'giant-killer', title: 'Giant killer', desc: 'Beat a club far bigger than yours.', group: 'Results' },
  { id: 'thrashing', title: 'No mercy', desc: 'Win a match by six goals or more.', group: 'Results' },
  { id: 'derby-king', title: 'Derby king', desc: 'Win five derbies.', group: 'Results' },
  { id: 'unbeaten', title: 'Invincibles', desc: 'Go a whole league season unbeaten.', group: 'Results' },
  { id: 'goals-100', title: 'Goal machine', desc: 'Score 100 league goals in a season.', group: 'Results' },
  { id: 'first-trophy', title: 'Silverware', desc: 'Win your first trophy.', group: 'Trophies' },
  { id: 'league-title', title: 'Champions', desc: 'Win a league title.', group: 'Trophies' },
  { id: 'back-to-back', title: 'Back to back', desc: 'Win the league two seasons running.', group: 'Trophies' },
  { id: 'double', title: 'The double', desc: 'Win the league and the main cup in the same season.', group: 'Trophies' },
  { id: 'continental', title: 'Kings of the continent', desc: 'Win a continental competition.', group: 'Trophies' },
  { id: 'treble', title: 'The treble', desc: 'League, main cup and a continental title in one season.', group: 'Trophies' },
  { id: 'dynasty', title: 'Dynasty', desc: 'Win five league titles.', group: 'Trophies' },
  { id: 'promotion', title: 'Going up', desc: 'Win promotion.', group: 'Club' },
  { id: 'wonderkid', title: 'Wonderkid', desc: 'Have a player aged 21 or under rated five gold stars.', group: 'Club' },
  { id: 'big-signing', title: 'Statement signing', desc: 'Sign a player for 50M or more.', group: 'Club' },
  { id: 'big-sale', title: 'Cash in', desc: 'Sell a player for 50M or more.', group: 'Club' },
  { id: 'stadium', title: 'Cathedral', desc: 'Grow your stadium to 75,000 seats.', group: 'Club' },
  { id: 'national', title: 'National hero', desc: 'Win a tournament with a national team.', group: 'Career' },
  { id: 'world-champion', title: 'World champion', desc: 'Win the FIFA World Cup as a manager.', group: 'Career' },
  { id: 'globetrotter', title: 'Globetrotter', desc: 'Manage clubs in three different countries.', group: 'Career' },
  { id: 'ten-seasons', title: 'Long service', desc: 'Manage for ten seasons.', group: 'Career' },
];

export function unlock(s: GameState, id: string) {
  const a = (s.achievements ??= {});
  if (a[id]) return;
  const def = ACHIEVEMENTS.find((x) => x.id === id);
  if (!def) return;
  a[id] = seasonLabel(s.year);
  s.inbox.unshift({ id: `m${s.nextId++}`, category: 'board', from: 'Achievement unlocked', date: s.calendar[Math.min(s.matchday, s.calendar.length) - 1]?.date ?? '', unread: true,
    subject: `Achievement: ${def.title}`, body: [def.desc, `Unlocked in ${seasonLabel(s.year)}. See them all on the Career screen.`] });
  if (s.inbox.length > 80) s.inbox.length = 80;
}

/** After each of your matches. */
export function afterMatch(s: GameState, f: Fixture) {
  const r = f.result;
  if (!r) return;
  const home = f.homeId === s.userClubId;
  const gf = home ? r.score[0] : r.score[1], ga = home ? r.score[1] : r.score[0];
  const won = gf > ga || r.winnerId === s.userClubId;
  const w = s.manager.w;
  if (w >= 1) unlock(s, 'first-win');
  if (w >= 50) unlock(s, 'wins-50');
  if (w >= 100) unlock(s, 'wins-100');
  if (w >= 250) unlock(s, 'wins-250');
  if (won && gf - ga >= 6) unlock(s, 'thrashing');
  if ((s.derbyWins ?? 0) >= 5) unlock(s, 'derby-king');
  const opp = s.clubs[home ? f.awayId : f.homeId];
  if (won && opp && opp.reputation - s.clubs[s.userClubId].reputation >= 20) unlock(s, 'giant-killer');
}

/** At the end of a season, before the new one is set up. */
export function afterSeason(s: GameState, outcome: { promoted: boolean; champion: boolean }) {
  const us = s.clubs[s.userClubId];
  const won = Object.values(s.comps).filter((c) => c.kind !== 'league' && c.kind !== 'playoff' && c.kind !== 'super' && s.cups[c.id]?.winner === us.id);
  const mainCup = won.some((c) => c.kind === 'cup' && c.main);
  const continental = won.some((c) => c.kind === 'continental');
  if (outcome.champion || won.length) unlock(s, 'first-trophy');
  if (outcome.champion) unlock(s, 'league-title');
  if (outcome.champion && mainCup) unlock(s, 'double');
  if (continental) unlock(s, 'continental');
  if (outcome.champion && mainCup && continental) unlock(s, 'treble');
  if (outcome.promoted) unlock(s, 'promotion');
  const l = leagueDef(s, us.league);
  if (l) {
    const row = leagueTableOf(s, l.id).find((x) => x.clubId === us.id);
    if (row && row.p > 0 && row.l === 0) unlock(s, 'unbeaten');
    if (row && row.gf >= 100) unlock(s, 'goals-100');
  }
  // this season's title and history line are already recorded when this runs
  const titles = s.manager.trophies.filter((t) => s.world.leagues.some((x) => t.startsWith(`${x.titlePlayoff?.trophy ?? x.name} `))).length;
  if (titles >= 5) unlock(s, 'dynasty');
  const prev = (s.history[us.id] ?? [])[1];
  if (outcome.champion && prev?.isYou && prev.champion === us.name) unlock(s, 'back-to-back');
  if (Object.values(s.players).some((p) => p.clubId === us.id && p.age <= 21 && p.ability >= 180)) unlock(s, 'wonderkid');
  if (us.capacity >= 75_000) unlock(s, 'stadium');
  const countries = new Set((s.career?.spells ?? []).map((sp) => s.clubs[sp.clubId]?.country).filter(Boolean));
  if (countries.size >= 3) unlock(s, 'globetrotter');
  if (s.year + 1 - s.manager.since >= 10) unlock(s, 'ten-seasons');
}

/** After the summer's tournaments. */
export function afterTournament(s: GameState, name: string, reached: string) {
  if (reached !== 'Winners') return;
  unlock(s, 'national');
  if (name.startsWith('FIFA World Cup')) unlock(s, 'world-champion');
}

export function afterTransfer(s: GameState, fee: number, sale: boolean) {
  if (fee >= 50_000_000) unlock(s, sale ? 'big-sale' : 'big-signing');
}
