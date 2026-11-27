/* The medical centre for your club: what each injury is and when he should be back, an injury-risk read on
   every first-teamer with the physio's advice, rushing a player back early (with a risk of breaking down again),
   and the season's injury log. Injuries themselves still happen in matches and training; this names and tracks
   them. Choices that need chance use a hash of the player and date, so they never disturb the match engine. */
import { squadOf } from './index';
import { staffRating } from './staff';
import { facilitiesOf } from './facilities';
import { dateOf } from './windows';
import type { GameState, Player } from './types';

export interface Injury { type: string; out: number; date: string; rushed?: boolean; /** Matches played since a rushed return, while relapse is possible. */ since?: number }
export interface InjuryLogLine { playerId: string; name: string; type: string; date: string; out: number; cause: 'match' | 'training' | 'relapse' }

const TYPES: Array<[number, string[]]> = [
  [2, ['Knock', 'Bruised ankle', 'Tight hamstring', 'Dead leg', 'Minor back spasm']],
  [4, ['Hamstring strain', 'Calf strain', 'Groin strain', 'Thigh strain', 'Sprained ankle']],
  [7, ['Torn hamstring', 'Ankle ligament damage', 'Knee ligament sprain', 'Broken toe']],
  [99, ['Broken metatarsal', 'Torn knee ligament', 'Achilles injury']],
];
function hash(t: string) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const roll = (key: string) => (hash(key) % 10_000) / 10_000;

/** Names and logs an injury just given to one of your players (p.injuredFor already set). */
export function recordInjury(s: GameState, p: Player, cause: InjuryLogLine['cause']) {
  if (p.clubId !== s.userClubId || p.injuredFor <= 0) return;
  const date = dateOf(s);
  const list = TYPES.find(([max]) => p.injuredFor <= max)![1];
  const type = list[hash(p.id + date + cause) % list.length];
  p.injury = { type, out: p.injuredFor, date };
  (s.injuryLog ??= []).unshift({ playerId: p.id, name: p.name, type, date, out: p.injuredFor, cause });
  if (s.injuryLog.length > 40) s.injuryLog.length = 40;
}

/** The date he should be fit again: injuredFor counts matchdays still to pass. */
export function returnDate(s: GameState, p: Player) {
  return p.injuredFor > 0 ? s.calendar[Math.min(s.calendar.length, s.matchday + p.injuredFor) - 1]?.date : undefined;
}

/** Can he be rushed back? Only from a lay-off of two matchdays or more, and only once per injury. */
export const canRush = (p: Player) => p.injuredFor >= 2 && !p.injury?.rushed;
/** Rush him back: half the time out, but a real chance he breaks down in his first two games back. */
export function rushBack(s: GameState, playerId: string) {
  const p = s.players[playerId];
  if (!p || !canRush(p)) return;
  p.injuredFor = Math.ceil(p.injuredFor / 2);
  p.injury = { ...(p.injury ?? { type: 'Injury', out: p.injuredFor, date: dateOf(s) }), rushed: true, since: 0 };
}
export const RELAPSE_CHANCE = 0.22;

/** After one of your matches: a rushed player who played may break down again. Returns those who did. */
export function relapses(s: GameState, played: string[]): Player[] {
  const out: Player[] = [];
  for (const id of played) {
    const p = s.players[id];
    if (!p?.injury?.rushed || p.injuredFor > 0) continue;
    const since = (p.injury.since ?? 0) + 1;
    if (roll(id + dateOf(s) + 'relapse') < RELAPSE_CHANCE) {
      p.injuredFor = Math.max(3, Math.round(p.injury.out * 1.5));
      recordInjury(s, p, 'relapse');
      p.injury!.type = `${p.injury!.type} (relapse)`;
      s.injuryLog![0].type = p.injury!.type;
      out.push(p);
    } else if (since >= 2) delete p.injury;
    else p.injury.since = since;
  }
  return out;
}

/** Injury risk 0–100 for one of your players: proneness, tiredness, age, fitness and the medical staff. */
export function injuryRisk(s: GameState, p: Player) {
  const cond = p.condition ?? 100;
  let r = 18 + p.hidden.injuryProneness * 2.2 + Math.max(0, 85 - cond) * 1.1 + Math.max(0, p.age - 29) * 2.5 - ((p.attributes['Natural Fitness'] ?? 10) - 10) * 1.5;
  r -= (staffRating(s, 'fitness') - 10) * 0.8 + (facilitiesOf(s, s.userClubId).training - 3) * 2;
  if (p.injury?.rushed) r += 20;
  return Math.max(2, Math.min(98, Math.round(r)));
}
export const riskWord = (r: number) => (r >= 60 ? 'High' : r >= 38 ? 'Moderate' : 'Low');

/** The physio's advice on a fit player, if any. */
export function advice(s: GameState, p: Player): string | undefined {
  const r = injuryRisk(s, p), cond = p.condition ?? 100;
  if (p.injury?.rushed) return 'Back early from injury: ease him in.';
  if (r >= 60 && cond < 80) return 'Rest him for the next match.';
  if (r >= 60) return 'Prone to injury: manage his minutes.';
  if (cond < 70) return 'Tired: risky to start.';
  return undefined;
}

/** Your first team's medical picture. */
export function medicalReport(s: GameState) {
  const ft = squadOf(s, s.userClubId).filter((p) => p.squad === 'First team');
  return {
    injured: ft.filter((p) => p.injuredFor > 0).sort((a, b) => b.injuredFor - a.injuredFor),
    fit: ft.filter((p) => p.injuredFor <= 0).map((p) => ({ p, risk: injuryRisk(s, p), advice: advice(s, p) })).sort((a, b) => b.risk - a.risk),
    log: s.injuryLog ?? [],
  };
}
