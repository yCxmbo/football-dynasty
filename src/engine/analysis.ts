/* Post-match analysis for your games: chances by source and the assistant's notes on what decided it. */
import type { ChanceSource, MatchAnalysis } from './types';
import type { Instructions } from './instructions';

export const SOURCES: Array<{ src: ChanceSource; label: string }> = [
  { src: 'open', label: 'Open play' }, { src: 'counter', label: 'Counter-attacks' }, { src: 'penalty', label: 'Penalties' },
  { src: 'free kick', label: 'Direct free kicks' }, { src: 'corner', label: 'Corners' },
];

/** Shots and goals by source for one side. */
export function bySource(a: MatchAnalysis, side: 0 | 1) {
  return SOURCES.map(({ src, label }) => {
    const list = a.chances.filter((c) => c.side === side && c.src === src);
    return { src, label, shots: list.length, goals: list.filter((c) => c.goal).length };
  });
}

const r = (n: number) => n.toFixed(2);
const xgAt = (a: MatchAnalysis, minute: number) => a.xg[Math.min(minute, a.xg.length - 1)] ?? [0, 0];

/** Up to four notes from the assistant, most telling first. `us` is your side (0 home, 1 away). */
export function analysisNotes(a: MatchAnalysis, us: 0 | 1, ourInstr?: Partial<Instructions>): string[] {
  const them = (1 - us) as 0 | 1;
  const end = a.xg[a.xg.length - 1] ?? [0, 0];
  const xgF = end[us], xgA = end[them];
  const gF = a.chances.filter((c) => c.side === us && c.goal).length, gA = a.chances.filter((c) => c.side === them && c.goal).length;
  const notes: string[] = [];
  if (xgF - gF >= 1) notes.push(`We created ${r(xgF)} xG but scored ${gF}: the finishing let us down.`);
  else if (gF - xgF >= 1) notes.push(`Clinical: ${gF} goals from ${r(xgF)} xG.`);
  if (gA - xgA >= 1) notes.push(`They scored ${gA} from only ${r(xgA)} xG: we gave away goals we shouldn't have.`);
  else if (xgA - gA >= 1) notes.push(`We got away with it: they created ${r(xgA)} xG and scored ${gA}.`);
  const theirShots = a.chances.filter((c) => c.side === them), theirCounters = theirShots.filter((c) => c.src === 'counter').length;
  if (theirCounters >= 3 && theirCounters / Math.max(1, theirShots.length) >= 0.3)
    notes.push(`${theirCounters} of their ${theirShots.length} shots came on the counter.${ourInstr?.line === 'high' ? ' Our high line was exposed: a deeper line, or regrouping when we lose the ball, would help.' : ' We were caught short when we lost the ball.'}`);
  const ourCounters = a.chances.filter((c) => c.side === us && c.src === 'counter').length;
  if (ourCounters >= 3) notes.push(`Our counters worked: ${ourCounters} shots on the break.`);
  const setF = a.chances.filter((c) => c.side === us && c.goal && c.src !== 'open' && c.src !== 'counter').length;
  const setA = a.chances.filter((c) => c.side === them && c.goal && c.src !== 'open' && c.src !== 'counter').length;
  if (setF || setA) notes.push(`Set pieces: we scored ${setF}, conceded ${setA}.`);
  const ht = xgAt(a, 45);
  const firstF = ht[us], secondF = xgF - firstF;
  if (secondF >= 0.6 && secondF >= 2 * firstF) notes.push(`We were much better after the break (${r(secondF)} xG against ${r(firstF)} before it).`);
  else if (firstF >= 0.6 && firstF >= 2 * secondF) notes.push(`We faded after half-time (${r(firstF)} xG before the break, ${r(secondF)} after).`);
  const share = xgF + xgA > 0 ? xgF / (xgF + xgA) : 0.5;
  if (share >= 0.65) notes.push(`We controlled it: ${Math.round(share * 100)}% of the match's xG.`);
  else if (share <= 0.35) notes.push(`They were on top: we had ${Math.round(share * 100)}% of the xG.`);
  if (!notes.length) notes.push('An even game with no clear pattern: the details decided it.');
  return notes.slice(0, 4);
}
