/* The season in review for your club: where you finished and how you got there (your league position week by
   week), results, your best players and signings, cups, awards, and what the board and the fans made of it.
   Built live while the season is on (or just over), and archived at each season's turn. */
import { compInfo, cupResult, leagueTableOf } from './competitions';
import { squadOf } from './index';
import { seasonLabel, type GameState } from './types';

export interface SeasonReview {
  season: string; club: string; league: string; pos: number; of: number; pts: number;
  w: number; d: number; l: number; gf: number; ga: number;
  /** League position after each of your league weeks. */
  course: number[];
  scorers: Array<{ id: string; name: string; goals: number; apps: number }>;
  best: Array<{ id: string; name: string; rating: number; apps: number }>;
  signings: Array<{ id: string; name: string; rating: number; apps: number; goals: number }>;
  youngsters: Array<{ id: string; name: string; age: number; apps: number }>;
  cups: Array<{ name: string; result: string }>;
  awards: string[];
  board: number; fans?: number; target?: string;
}

/** Called after each of your league weeks: notes your league position for the season's course. */
export function noteCourse(s: GameState) {
  const lg = s.clubs[s.userClubId]?.league;
  if (!lg) return;
  const pos = leagueTableOf(s, lg).findIndex((r) => r.clubId === s.userClubId) + 1;
  if (pos) (s.course ??= []).push(pos);
}

export function buildReview(s: GameState, target?: string): SeasonReview | undefined {
  const us = s.clubs[s.userClubId];
  if (!us?.league) return undefined;
  const t = leagueTableOf(s, us.league);
  const i = t.findIndex((r) => r.clubId === us.id);
  const row = t[i];
  const ft = squadOf(s, us.id).filter((p) => p.current.apps > 0);
  const avg = (p: (typeof ft)[number]) => p.current.ratingSum / p.current.apps;
  const label = seasonLabel(s.year);
  const cups = Object.values(s.comps).filter((c) => c.kind === 'cup' || c.kind === 'continental' || c.kind === 'title')
    .map((c) => ({ name: compInfo(s, c.id).name, result: cupResult(s, c.id, us.id) })).filter((x): x is { name: string; result: string } => !!x.result);
  return {
    season: label, club: us.name, league: s.world.leagues.find((l) => l.id === us.league)?.name ?? '', pos: i + 1, of: t.length, pts: row?.pts ?? 0,
    w: row?.w ?? 0, d: row?.d ?? 0, l: row?.l ?? 0, gf: row?.gf ?? 0, ga: row?.ga ?? 0,
    course: [...(s.course ?? [])],
    scorers: ft.filter((p) => p.current.goals > 0).sort((a, b) => b.current.goals - a.current.goals).slice(0, 5).map((p) => ({ id: p.id, name: p.name, goals: p.current.goals, apps: p.current.apps })),
    best: ft.filter((p) => p.current.apps >= 8).sort((a, b) => avg(b) - avg(a)).slice(0, 5).map((p) => ({ id: p.id, name: p.name, rating: Math.round(avg(p) * 100) / 100, apps: p.current.apps })),
    signings: ft.filter((p) => p.joined === s.year && p.current.apps >= 3).sort((a, b) => avg(b) - avg(a)).slice(0, 4).map((p) => ({ id: p.id, name: p.name, rating: Math.round(avg(p) * 100) / 100, apps: p.current.apps, goals: p.current.goals })),
    youngsters: ft.filter((p) => p.age <= 21 && p.current.apps >= 5).sort((a, b) => b.current.apps - a.current.apps).slice(0, 4).map((p) => ({ id: p.id, name: p.name, age: p.age, apps: p.current.apps })),
    cups,
    awards: squadOf(s, us.id).flatMap((p) => (p.awards ?? []).filter((a) => a.endsWith(label)).map((a) => `${p.name}: ${a.replace(` ${label}`, '')}`))
      .concat((s.manager.awards ?? []).filter((a) => a.endsWith(label)).map((a) => `You: ${a.replace(` ${label}`, '')}`)),
    board: Math.round(s.career?.trust ?? 50), fans: s.fans?.mood, target,
  };
}

/** At the season's turn (after the awards): keeps the review, ten seasons at most. */
export function archiveReview(s: GameState, target?: string, fans?: number) {
  const r = buildReview(s, target);
  if (!r) return;
  if (fans !== undefined) r.fans = fans;
  s.reviews = [r, ...(s.reviews ?? []).filter((x) => x.season !== r.season)].slice(0, 10);
  delete s.course;
}
