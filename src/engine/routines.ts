/* Set-piece routines for your side: where corners go, whether free kicks are shot or crossed, and how many
   players go forward. The defaults ("mixed", "normal") are exactly the old behaviour. */
export type CornerRoutine = 'mixed' | 'near' | 'far' | 'short' | 'edge';
export type FreeKickRoutine = 'mixed' | 'shoot' | 'cross';
export type Bodies = 'fewer' | 'normal' | 'more';
export interface Routines { corner: CornerRoutine; fk: FreeKickRoutine; bodies: Bodies }
export const DEFAULT_ROUTINES: Routines = { corner: 'mixed', fk: 'mixed', bodies: 'normal' };

export const CORNERS: Array<{ id: CornerRoutine; label: string; desc: string }> = [
  { id: 'mixed', label: 'Mixed', desc: 'The taker picks: the usual balance.' },
  { id: 'near', label: 'Near post', desc: 'A whipped ball for a flick or glance: rewards Heading.' },
  { id: 'far', label: 'Far post', desc: 'Over everyone to the big men: rewards Jumping Reach and Strength.' },
  { id: 'short', label: 'Short', desc: 'Keep the ball: fewer goals, but you rarely lose it.' },
  { id: 'edge', label: 'Edge of the box', desc: 'Cut back for a shot: rewards Long Shots.' },
];
export const FREE_KICKS: Array<{ id: FreeKickRoutine; label: string; desc: string }> = [
  { id: 'mixed', label: 'Mixed', desc: 'Shoot when in range, otherwise play it in.' },
  { id: 'shoot', label: 'Shoot', desc: 'Always go for goal: best with a great free-kick taker.' },
  { id: 'cross', label: 'Cross', desc: 'Always swing it in for a header: best with strong headers.' },
];
export const BODIES: Array<{ id: Bodies; label: string; desc: string }> = [
  { id: 'fewer', label: 'Fewer forward', desc: 'Safer: fewer goals from set pieces, no counter risk.' },
  { id: 'normal', label: 'Normal', desc: 'The centre-backs go up; the rest hold.' },
  { id: 'more', label: 'More forward', desc: 'More goals, but a real risk of being caught on the counter.' },
];

type A = Record<string, number | undefined>;
const at = (a: A, k: string) => a[k] ?? 10;
/** How dangerous your best three in the air are: [heading, physical] on a 1–20 scale. */
export function aerial(players: A[]) {
  const top = players.slice().sort((x, y) => at(y, 'Heading') + at(y, 'Jumping Reach') - (at(x, 'Heading') + at(x, 'Jumping Reach'))).slice(0, 3);
  if (!top.length) return { head: 10, phys: 10, long: 10 };
  const avg = (f: (a: A) => number) => top.reduce((s, a) => s + f(a), 0) / top.length;
  const shooters = players.slice().sort((x, y) => at(y, 'Long Shots') - at(x, 'Long Shots')).slice(0, 2);
  return { head: avg((a) => at(a, 'Heading')), phys: avg((a) => (at(a, 'Jumping Reach') + at(a, 'Strength')) / 2), long: shooters.reduce((s, a) => s + at(a, 'Long Shots'), 0) / Math.max(1, shooters.length) };
}

/** Multiplier on the chance a corner ends in a goal, for this routine and these players. */
export function cornerFactor(r: Routines, air: ReturnType<typeof aerial>) {
  let k = 1;
  if (r.corner === 'near') k = 0.8 + (air.head / 20) * 0.4;
  if (r.corner === 'far') k = 0.7 + (air.phys / 20) * 0.6;
  if (r.corner === 'short') k = 0.6;
  if (r.corner === 'edge') k = 0.5 + (air.long / 20) * 0.6;
  return k * (r.bodies === 'more' ? 1.25 : r.bodies === 'fewer' ? 0.8 : 1);
}
/** Free kicks: a direct shot's chance is scaled, or the kick becomes a cross (a header, like a corner). */
export function freeKickFactor(r: Routines, air: ReturnType<typeof aerial>) {
  const b = r.bodies === 'more' ? 1.15 : r.bodies === 'fewer' ? 0.85 : 1;
  if (r.fk === 'shoot') return { direct: 1.15 * b, cross: 0 };
  if (r.fk === 'cross') return { direct: 0, cross: (0.6 + (air.head / 20) * 0.8) * b };
  return { direct: 1 * b, cross: 0 };
}
/** The chance, per failed corner or crossed free kick, that the other side breaks and scores. */
export const counterRisk = (r: Routines) => (r.bodies === 'more' && r.corner !== 'short' ? 0.012 : 0);

/** Expected goals from ten corners, for the panel's estimate. */
export function estimateCorners(r: Routines, takerCorners: number, players: A[]) {
  const base = Math.min(0.032, Math.max(0.008, 0.008 + takerCorners * 0.0011));
  return Math.round(base * cornerFactor(r, aerial(players)) * 10 * 100) / 100;
}
