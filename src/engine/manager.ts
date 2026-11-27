/* You as a manager: six attributes (1–20) that start from your coaching style and grow slowly with experience,
   and coaching badges (C, B, A, Pro licence) you can study for. Each attribute has a small effect; the biggest
   clubs want a manager with an A or Pro licence. */
import { styleOf } from './style';
import { dateOf } from './windows';
import { formatDate } from './fixtures';
import type { GameState } from './types';

export type MgrAttr = 'tactics' | 'motivation' | 'youth' | 'discipline' | 'manManagement' | 'negotiating';
export const MGR_ATTRS: Array<{ id: MgrAttr; label: string; effect: string }> = [
  { id: 'tactics', label: 'Tactical knowledge', effect: 'The squad learns your shapes and instructions faster.' },
  { id: 'motivation', label: 'Motivating', effect: 'Team talks land better.' },
  { id: 'youth', label: 'Working with youngsters', effect: 'Players aged 21 and under develop faster.' },
  { id: 'discipline', label: 'Discipline', effect: 'Warnings about conduct, and demands at team meetings, are taken better.' },
  { id: 'manManagement', label: 'Man management', effect: 'One-to-ones and team meetings go better.' },
  { id: 'negotiating', label: 'Negotiating', effect: 'Clubs ask lower fees and players lower wages.' },
];
export type Badge = 'None' | 'C' | 'B' | 'A' | 'Pro';
export const BADGES: Array<{ id: Exclude<Badge, 'None'>; name: string; cost: number; days: number; gain: number }> = [
  { id: 'C', name: 'National C licence', cost: 25_000, days: 45, gain: 0.4 },
  { id: 'B', name: 'National B licence', cost: 80_000, days: 90, gain: 0.6 },
  { id: 'A', name: 'Continental A licence', cost: 220_000, days: 150, gain: 0.8 },
  { id: 'Pro', name: 'Pro licence', cost: 450_000, days: 240, gain: 1.2 },
];
const ORDER: Badge[] = ['None', 'C', 'B', 'A', 'Pro'];
export interface ManagerProfile { attrs: Record<MgrAttr, number>; badge: Badge; studying?: { badge: Exclude<Badge, 'None'>; from: string; until: string } }

const START: Record<string, Partial<Record<MgrAttr, number>>> = {
  balanced: { tactics: 11, motivation: 11, youth: 11, discipline: 11, manManagement: 11, negotiating: 11 },
  attacking: { tactics: 13 },
  defensive: { tactics: 13, discipline: 13 },
  youth: { youth: 15, manManagement: 12 },
  motivator: { motivation: 15, manManagement: 13 },
};
export function profileOf(s: GameState): ManagerProfile {
  if (!s.managerProfile) {
    const st = styleOf(s);
    const attrs = Object.fromEntries(MGR_ATTRS.map((a) => [a.id, START[st]?.[a.id] ?? 10])) as Record<MgrAttr, number>;
    s.managerProfile = { attrs, badge: 'B' };
  }
  return s.managerProfile;
}
/** An attribute's value, for effects (10 when no profile exists yet, so old saves behave as before). */
export const attr = (s: GameState, a: MgrAttr) => s.managerProfile?.attrs[a] ?? 10;
const grow = (s: GameState, a: MgrAttr, by: number) => { const p = profileOf(s); p.attrs[a] = Math.min(20, Math.round((p.attrs[a] + by) * 1000) / 1000); };

/* ---------- effects ---------- */
export const familiarityGain = (s: GameState) => 0.8 + attr(s, 'tactics') / 50; // 10 → 1.0, 20 → 1.2
export const motivationFactor = (s: GameState) => 0.85 + attr(s, 'motivation') * 0.015; // 10 → 1.0, 20 → 1.15
export const youthCoaching = (s: GameState, age: number) => (age <= 21 ? 1 + (attr(s, 'youth') - 10) * 0.012 : 1);
export const talkSkill = (s: GameState) => (attr(s, 'manManagement') - 10) * 0.02; // added to a talk's success chance
export const disciplineSkill = (s: GameState) => (attr(s, 'discipline') - 10) * 0.02;
export const priceFactor = (s: GameState) => 1 - (attr(s, 'negotiating') - 10) * 0.006; // 20 → 6% cheaper
export const wageFactor = (s: GameState) => 1 - (attr(s, 'negotiating') - 10) * 0.004;

/* ---------- experience ---------- */
/** After one of your competitive matches: a little experience, more in what the match called on. */
export function managerExperience(s: GameState, won: boolean, youngsters: number, cards: number) {
  if (!s.managerProfile) profileOf(s);
  for (const a of MGR_ATTRS) grow(s, a.id, 0.004);
  if (won) { grow(s, 'tactics', 0.006); grow(s, 'motivation', 0.004); }
  if (youngsters) grow(s, 'youth', 0.004 * youngsters);
  if (!cards) grow(s, 'discipline', 0.004);
}
/** After a transfer you completed: dealing teaches negotiating. */
export const dealExperience = (s: GameState) => grow(s, 'negotiating', 0.08);
/** After a one-to-one or team meeting. */
export const talkExperience = (s: GameState) => grow(s, 'manManagement', 0.03);

/* ---------- badges ---------- */
export const nextBadge = (s: GameState) => BADGES[ORDER.indexOf(profileOf(s).badge)]; // the one after yours
export const badgeRank = (b: Badge) => ORDER.indexOf(b);

/** Start studying for the next badge (paid from your own earnings). */
export function startBadge(s: GameState): string | null {
  const p = profileOf(s), next = nextBadge(s);
  if (!next) return 'You already hold the Pro licence.';
  if (p.studying) return 'You are already studying for a badge.';
  const c = s.career;
  if (!c || (c.earnings ?? 0) < next.cost) return `The course costs ${Math.round(next.cost / 1000)}k from your own earnings; you don't have enough yet.`;
  c.earnings = (c.earnings ?? 0) - next.cost;
  const from = dateOf(s);
  p.studying = { badge: next.id, from, until: new Date(Date.parse(from) + next.days * 86_400_000).toISOString().slice(0, 10) };
  return null;
}
/** Daily: a course that has run its time is passed. Returns the badge earned, if any. */
export function checkBadge(s: GameState): (typeof BADGES)[number] | undefined {
  const p = s.managerProfile;
  if (!p?.studying || dateOf(s) < p.studying.until) return undefined;
  const b = BADGES.find((x) => x.id === p.studying!.badge)!;
  p.badge = b.id;
  delete p.studying;
  grow(s, 'tactics', b.gain * 1.5);
  for (const a of MGR_ATTRS) if (a.id !== 'tactics') grow(s, a.id, b.gain);
  return b;
}
export const studyProgress = (s: GameState) => {
  const st = s.managerProfile?.studying;
  if (!st) return 0;
  const total = Date.parse(st.until) - Date.parse(st.from), done = Date.parse(dateOf(s)) - Date.parse(st.from);
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
};
export const untilLabel = (s: GameState) => (s.managerProfile?.studying ? formatDate(s.managerProfile.studying.until) : '');

/** The licence a club of this reputation expects (none below 70). */
export const licenceNeeded = (rep: number): Badge => (rep >= 82 ? 'Pro' : rep >= 74 ? 'A' : rep >= 66 ? 'B' : 'None');
/** Interview chance lost for each licence level you are short of what the club expects. */
export const licencePenalty = (s: GameState, rep: number) => Math.max(0, badgeRank(licenceNeeded(rep)) - badgeRank(profileOf(s).badge)) * 0.12;
