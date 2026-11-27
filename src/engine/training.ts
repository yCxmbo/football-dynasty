/* Training: the user's weekly plan changes development speed, injury risk, morale and match sharpness. */
import { recordInjury } from './medical';
import { ROLE_BY_ID } from './roles';
import { ATTRIBUTE_GROUPS, POS_GROUP, POSITION_WEIGHTS, abilityFromAttributes, clamp } from './ratings';
import type { Rng } from './rng';
import { trainingInjuryFactor } from './staff';
import type { Day, GameState, Intensity, Player, SessionType, Training } from './types';

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const SESSIONS: SessionType[] = ['fitness', 'technical', 'tactical', 'setpieces', 'matchprep', 'recovery', 'rest'];

export const PRESETS: Record<string, Record<Day, SessionType[]>> = {
  Balanced: { Mon: ['recovery'], Tue: ['fitness', 'technical'], Wed: ['tactical', 'setpieces'], Thu: ['fitness', 'tactical'], Fri: ['matchprep'], Sat: ['match'], Sun: ['rest'] },
  Development: { Mon: ['recovery'], Tue: ['technical', 'technical'], Wed: ['fitness', 'technical'], Thu: ['tactical', 'technical'], Fri: ['matchprep'], Sat: ['match'], Sun: ['rest'] },
  'Match focus': { Mon: ['recovery'], Tue: ['tactical', 'setpieces'], Wed: ['matchprep', 'tactical'], Thu: ['setpieces'], Fri: ['matchprep'], Sat: ['match'], Sun: ['rest'] },
  'Light week': { Mon: ['rest'], Tue: ['recovery', 'technical'], Wed: ['tactical'], Thu: ['recovery'], Fri: ['matchprep'], Sat: ['match'], Sun: ['rest'] },
};

export function defaultTraining(): Training {
  return { week: structuredClone(PRESETS.Balanced), intensity: 'normal', focus: {} };
}

const INTENSITY: Record<Intensity, number> = { low: 0.7, normal: 1, high: 1.3 };
const DEV_INTENSITY: Record<Intensity, number> = { low: 0.8, normal: 1, high: 1.2 };

const sessions = (t: Training) => DAYS.flatMap((d) => t.week[d] ?? []);

/** Same workload formula as the design system's TrainingSchedule. */
export function workload(t: Training) {
  let load = 0;
  for (const s of sessions(t)) load += s === 'rest' || s === 'recovery' ? 0 : s === 'match' ? 3 : s === 'fitness' ? 2 : 1;
  return Math.round(load * INTENSITY[t.intensity]);
}
export function injuryRisk(t: Training): 'low' | 'medium' | 'high' {
  const l = workload(t);
  return l >= 16 ? 'high' : l >= 11 ? 'medium' : 'low';
}

export interface TrainingEffects { development: number; injury: number; trainingInjury: number; matchBoost: number; restDays: number }
export function effects(t: Training): TrainingEffects {
  const ss = sessions(t);
  const count = (k: SessionType) => ss.filter((s) => s === k).length;
  const dev = count('technical') * 1 + count('fitness') * 0.6 + count('tactical') * 0.5 + count('setpieces') * 0.3;
  const risk = injuryRisk(t);
  const prep = count('matchprep') + count('tactical') * 0.5 + count('setpieces') * 0.5;
  return {
    development: clamp(0.8 + dev * 0.07, 0.8, 1.25) * DEV_INTENSITY[t.intensity],
    injury: risk === 'high' ? 1.6 : risk === 'medium' ? 1 : 0.7,
    trainingInjury: risk === 'high' ? 0.12 : risk === 'medium' ? 0.04 : 0.01,
    matchBoost: clamp(1 + (prep - 2) * 0.008, 0.99, 1.025),
    restDays: count('rest') + count('recovery'),
  };
}

/** Attributes a player can be given as an individual focus. */
export function focusOptions(p: Player) {
  const g = POSITION_WEIGHTS[POS_GROUP[p.pos]];
  return [...g.key, ...g.imp];
}

/**
 * One in-season development step (called every few matchdays for every player).
 * `factor` is 1 for AI clubs and the training effect for the user's club.
 */
export function developStep(rng: Rng, p: Player, share: number, factor: number, focus?: string) {
  if (p.age > 28 || p.ability >= p.potential) return;
  const rate = p.age <= 21 ? 0.2 : p.age <= 24 ? 0.16 : 0.1;
  const delta = (p.potential - p.ability) * rate * share * factor * (0.7 + p.hidden.professionalism / 33) + rng.normal(0, 1) * share * 3;
  const target = clamp(Math.round(p.ability + delta), p.ability, p.potential);
  if (target <= p.ability) return;
  const g = POSITION_WEIGHTS[POS_GROUP[p.pos]];
  const pool = [...g.key, ...g.key, ...g.imp, 'Decisions', 'Composure', 'Anticipation'];
  let guard = 0;
  while (abilityFromAttributes(p.attributes, p.pos) < target && guard++ < 60) {
    // a role focus works on that role's key attributes; an attribute focus on just that one
    const fa = focus?.startsWith('role:') ? rng.pick(ROLE_BY_ID[focus.slice(5)]?.keys ?? pool) : focus;
    const a = fa && p.attributes[fa] < 20 && rng.chance(0.45) ? fa : rng.pick(pool);
    if (p.attributes[a] >= 20) continue;
    p.attributes[a]++;
    (p.progress ??= {})[a] = (p.progress[a] ?? 0) + 1;
  }
  p.ability = abilityFromAttributes(p.attributes, p.pos);
}

/** Weekly side effects of the user's plan: training injuries and morale. Returns messages. */
export function trainingWeek(rng: Rng, s: GameState, squad: Player[]): string[] {
  const e = effects(s.training);
  const out: string[] = [];
  const fit = squad.filter((p) => p.injuredFor === 0 && p.squad === 'First team');
  if (fit.length && rng.chance(e.trainingInjury * trainingInjuryFactor(s))) {
    const p = rng.weighted(fit, (x) => x.hidden.injuryProneness);
    p.injuredFor = rng.int(1, 3);
    recordInjury(s, p, 'training');
    out.push(`${p.name} picked up a knock in training and will miss ${p.injuredFor} ${p.injuredFor === 1 ? 'match' : 'matches'}.`);
  }
  if (e.restDays === 0 && rng.chance(0.4) && fit.length) {
    const p = rng.pick(fit);
    if (p.morale !== 'low') { p.morale = p.morale === 'high' ? 'ok' : 'low'; out.push(`${p.name} is tired of training without a day off.`); }
  } else if (e.restDays >= 2 && rng.chance(0.3) && fit.length) {
    const p = rng.pick(fit.filter((x) => x.morale === 'low').concat(fit).slice(0, 1));
    if (p.morale === 'low') p.morale = 'ok';
  }
  return out;
}

/* ---------- learning a new position ---------- */
const LEVELS = ['awkward', 'unconvincing', 'competent', 'accomplished', 'natural'] as const;
export const LEARNABLE = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'DM', 'CM', 'AM', 'LM', 'RM', 'LW', 'RW', 'ST'];
/** How well he plays a position now (natural for his own). */
export const positionLevel = (p: Player, pos: string) => (p.pos === pos ? 'natural' : (p.positions[pos] as string | undefined) ?? 'awkward');

/** Each league week: players learning a position get closer to the next level (young and versatile players
    faster, more so with good Decisions and Anticipation); accomplished is as far as training goes. */
export function positionTrainingWeek(s: GameState): string[] {
  const out: string[] = [];
  const learn = s.training.learn ?? {};
  for (const [id, l] of Object.entries(learn)) {
    const p = s.players[id];
    if (!p || p.clubId !== s.userClubId) { delete learn[id]; continue; }
    const level = positionLevel(p, l.pos);
    const i = LEVELS.indexOf(level as (typeof LEVELS)[number]);
    if (i >= 3) { delete learn[id]; continue; }
    const brain = ((p.attributes.Decisions ?? 10) + (p.attributes.Anticipation ?? 10)) / 2;
    l.progress += (p.age <= 23 ? 1.5 : p.age <= 28 ? 1 : 0.6) * (0.8 + brain / 50);
    if (l.progress >= 8) {
      l.progress = 0;
      const next = LEVELS[i + 1];
      p.positions = { ...p.positions, [l.pos]: next as Player['positions'][string] };
      out.push(`${p.name} is now ${next} at ${l.pos}.`);
      if (i + 1 >= 3) { delete learn[id]; out.push(`${p.name} has learned the ${l.pos} role as far as training can take him.`); }
    }
  }
  s.training.learn = learn;
  return out;
}

/** Averages of his visible attributes by group (1–20); for a goalkeeper the first is his goalkeeping. */
export function groupAverages(p: Player) {
  const avg = (ks: readonly string[]) => Math.round((ks.reduce((a, k) => a + (p.attributes[k] ?? 10), 0) / ks.length) * 10) / 10;
  return { t: avg(p.pos === 'GK' ? ATTRIBUTE_GROUPS.Goalkeeping : ATTRIBUTE_GROUPS.Technical), m: avg(ATTRIBUTE_GROUPS.Mental), p: avg(ATTRIBUTE_GROUPS.Physical) };
}
