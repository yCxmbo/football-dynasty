/* Managing a national team alongside your club: who would hire you, picking the squad and formation,
   and your record at tournaments. The tournaments themselves are played in international.ts. */
import type { Formation } from './match';
import { NATION } from './nations';
import type { GameState, Player } from './types';

export interface NationalJob {
  code: string; since: number; formation: Formation;
  /** Your selection (player ids). Missing places are filled with the best available at tournament time. */
  squad: string[];
  w: number; d: number; l: number;
  tournaments: Array<{ name: string; reached: string }>;
}

/** Your standing as a manager: your club's reputation plus your trophies. */
export function managerReputation(s: GameState) {
  const club = s.clubs[s.userClubId];
  return Math.min(99, Math.round(club.reputation * 0.8 + Math.min(30, s.manager.trophies.length * 4) + Math.min(9, (s.manager.awards?.length ?? 0) * 3) + Math.min(8, s.year - s.manager.since)));
}

/** Reputation a nation asks for, from its place in the world ranking. */
export function reputationNeeded(rank: number) {
  return rank <= 5 ? 88 : rank <= 12 ? 78 : rank <= 25 ? 66 : rank <= 45 ? 54 : 0;
}

/** Nations that would appoint you now, best first (codes), given the current ranking order. */
export function jobOffers(s: GameState, ranking: string[]) {
  const rep = managerReputation(s);
  return ranking.map((code, i) => ({ code, rank: i + 1, needed: reputationNeeded(i + 1) }))
    .filter((o) => o.needed <= rep && o.code !== s.nationalJob?.code)
    .slice(0, 6);
}

export function takeJob(s: GameState, code: string) {
  if (!NATION[code]) return;
  s.nationalJob = { code, since: s.year, formation: '4-3-3', squad: autoPick(s, code), w: 0, d: 0, l: 0, tournaments: [] };
}

export function resignJob(s: GameState) { s.nationalJob = undefined; }

/** Players of a nationality who could be picked, best first. */
export function candidates(s: GameState, code: string): Player[] {
  return Object.values(s.players).filter((p) => p.nationality === code && p.age >= 17).sort((a, b) => b.ability - a.ability);
}

/** The best 26: three goalkeepers and 23 outfield players, injured players left out. */
export function autoPick(s: GameState, code: string) {
  const all = candidates(s, code).filter((p) => p.injuredFor === 0);
  return [...all.filter((p) => p.pos === 'GK').slice(0, 3), ...all.filter((p) => p.pos !== 'GK').slice(0, 23)].map((p) => p.id);
}

export const MAX_SQUAD = 26;

export function toggleSelection(s: GameState, id: string) {
  const j = s.nationalJob;
  if (!j) return;
  if (j.squad.includes(id)) j.squad = j.squad.filter((x) => x !== id);
  else if (j.squad.length < MAX_SQUAD && s.players[id]?.nationality === j.code) j.squad.push(id);
}

export function setNationalFormation(s: GameState, f: Formation) { if (s.nationalJob) s.nationalJob.formation = f; }

/** Drops players who retired since they were picked. */
export function tidySelection(s: GameState) {
  if (s.nationalJob) s.nationalJob.squad = s.nationalJob.squad.filter((id) => s.players[id]);
}
