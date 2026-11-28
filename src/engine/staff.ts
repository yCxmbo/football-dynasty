import { legendCandidates } from './legends';
import { fansOf } from './fans';
/* Your backroom staff. Each role is rated 1–20; 10 is neutral, better staff help, worse staff hurt.
   Coach: development. Fitness coach: recovery and training injuries. Physio: injury length.
   Chief scout: scouting speed. Youth coach: youth intake. Assistant: low morale recovers. */
import { nameFor } from './namepools';
import { generatedNationality } from './nations';
import type { Rng } from './rng';
import type { GameState } from './types';

export type StaffRole = 'assistant' | 'coach' | 'fitness' | 'physio' | 'scout' | 'youth';
export const ROLES: Array<{ role: StaffRole; title: string; effect: string }> = [
  { role: 'assistant', title: 'Assistant manager', effect: 'Unhappy players recover their morale sooner.' },
  { role: 'coach', title: 'First-team coach', effect: 'Players develop faster in training.' },
  { role: 'fitness', title: 'Fitness coach', effect: 'Faster recovery between matches, fewer training injuries.' },
  { role: 'physio', title: 'Physio', effect: 'Injured players return sooner.' },
  { role: 'scout', title: 'Chief scout', effect: 'Scouting reports fill in faster.' },
  { role: 'youth', title: 'Youth coach', effect: 'Better youngsters in the yearly intake.' },
];

export interface StaffMember { id: string; name: string; nationality: string; age: number; role: StaffRole; rating: number; wage: number; /** One of your club's legends, back on the staff. */ legend?: boolean }

export const staffWage = (rating: number) => Math.round((rating * rating * 140 + 800) / 100) * 100;
/** The best a club can attract: smaller clubs can't sign top staff. */
export const maxRatingFor = (reputation: number) => Math.min(20, Math.round(reputation / 5 + 4));

function person(rng: Rng, s: GameState, role: StaffRole, rating: number, country?: string): StaffMember {
  const nationality = generatedNationality(rng, country);
  return { id: `st${s.nextId++}`, name: nameFor(rng, nationality), nationality, age: rng.int(34, 64), role, rating, wage: staffWage(rating) };
}

/** Staff that come with a club when you take over. */
export function initStaff(s: GameState, rng: Rng) {
  const c = s.clubs[s.userClubId];
  const top = maxRatingFor(c.reputation);
  s.staff = {};
  for (const { role } of ROLES) s.staff[role] = person(rng, s, role, Math.max(3, Math.min(top, Math.round(top - 4 + rng.normal(0, 2)))), c.country);
  refreshPool(s, rng);
}

/** Candidates on the market (refreshed each summer). */
export function refreshPool(s: GameState, rng: Rng) {
  const c = s.clubs[s.userClubId];
  s.staffPool = [];
  for (const { role } of ROLES) for (let i = 0; i < 4; i++) s.staffPool.push(person(rng, s, role, Math.max(2, Math.min(20, Math.round(rng.normal(11, 4.5)))), rng.chance(0.5) ? c.country : undefined));
  s.staffPool.sort((a, b) => b.rating - a.rating);
  s.staffPool.unshift(...legendCandidates(s, staffWage)); // club legends first
}

/** Effect multipliers from your staff (1 = neutral). */
export function staffRating(s: GameState, role: StaffRole) { return s.staff?.[role]?.rating ?? 10; }
export const developmentBoost = (s: GameState) => 0.85 + staffRating(s, 'coach') * 0.015; // 1 → 0.87, 20 → 1.15
export const recoveryBonus = (s: GameState) => (staffRating(s, 'fitness') - 10) * 0.12; // condition points per day
export const trainingInjuryFactor = (s: GameState) => 1.3 - staffRating(s, 'fitness') * 0.03; // 20 → 0.7
export const injuryLengthFactor = (s: GameState) => 1.25 - staffRating(s, 'physio') * 0.025; // 20 → 0.75
export const scoutPerMatchday = (s: GameState) => 15 + staffRating(s, 'scout'); // 16–35 % a matchday
export const youthPotentialBonus = (s: GameState) => (staffRating(s, 'youth') - 10) * 1.6; // ±16 potential
export const moraleRecoveryChance = (s: GameState) => staffRating(s, 'assistant') / 40;

export const staffWageBill = (s: GameState) => Object.values(s.staff ?? {}).reduce((a, m) => a + (m?.wage ?? 0), 0);

/** Hires a candidate, replacing whoever held the role (paid off with eight weeks' wages). */
export function hire(s: GameState, id: string): string | null {
  const m = s.staffPool?.find((x) => x.id === id);
  if (!m) return 'That candidate is no longer available.';
  const c = s.clubs[s.userClubId];
  if (m.rating > maxRatingFor(c.reputation)) return `${m.name} wants a bigger club than ${c.name}.`;
  const old = s.staff?.[m.role];
  const payoff = old ? old.wage * 8 : 0;
  if (c.balance < payoff) return `Paying off ${old!.name} (${Math.round(payoff / 1000)}k) would put the club in debt.`;
  c.balance -= payoff;
  if (payoff && s.ledger) s.ledger.expenses.staff += payoff;
  (s.staff ??= {})[m.role] = m;
  if (m.legend) { const f = fansOf(s); f.mood = Math.min(100, f.mood + 4); f.notes = [`${m.name} returns to the club as ${ROLES.find((r) => r.role === m.role)!.title.toLowerCase()}`, ...f.notes].slice(0, 6); }
  s.staffPool = s.staffPool!.filter((x) => x.id !== id);
  return null;
}
