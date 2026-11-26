/* The summer when you manage a national team at a tournament: your nation's matches are played live, the rest
   are simulated around them. Only your results are stored; the tournament is rebuilt from them (same seed), so a
   reload carries on where you left off. */
import { summerTournaments, takesPart, tournamentName, tournamentSteps, type Tournament, type TournamentId, type TournamentRun, type UserMatchRequest } from './international';
import { createRng } from './rng';
import type { GameState, MatchResult } from './types';

export interface SummerState { id: TournamentId; seed: number; results: MatchResult[] }

/** The tournament your nation could play this summer, if any. */
export function summerTournamentFor(s: GameState): TournamentId | undefined {
  const job = s.nationalJob;
  return job ? summerTournaments(s.year).find((id) => takesPart(id, job.code)) : undefined;
}
export const summerLabel = (s: GameState) => { const id = summerTournamentFor(s); return id ? `${tournamentName(id)} ${s.year + 1}` : ''; };

export function beginSummer(s: GameState) {
  const id = summerTournamentFor(s);
  if (id && !s.summer) s.summer = { id, seed: (s.rngState ^ 0x51f15e) >>> 0, results: [] };
}

export interface SummerStep { t: Tournament; request?: UserMatchRequest; run?: TournamentRun }
let cache: { key: string; step: SummerStep } | null = null;

/** Where the summer stands: your next match, or the finished tournament. */
export function summerStep(s: GameState): SummerStep | undefined {
  const sm = s.summer;
  if (!sm) return undefined;
  const key = `${s.userClubId}|${s.year}|${sm.seed}|${sm.results.length}|${s.nationalJob?.code}|${s.nationalJob?.squad.join(',')}|${s.nationalJob?.formation}`;
  if (cache?.key === key) return cache.step;
  const gen = tournamentSteps(s, createRng(sm.seed), sm.id, s.year + 1, true);
  let r = gen.next();
  let i = 0;
  while (!r.done && i < sm.results.length) r = gen.next(sm.results[i++]);
  const step: SummerStep = r.done ? { t: r.value.tournament, run: r.value } : { t: r.value.t, request: r.value };
  cache = { key, step };
  return step;
}

export function recordSummerResult(s: GameState, result: MatchResult) { s.summer?.results.push(result); }
