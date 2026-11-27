/* Simulation jobs, shared by the background worker and the main-thread fallback. */
import { formatDate } from '../engine/fixtures';
import { advanceDay, migrate, seasonOver, startNewSeason, today, todaysFixture } from '../engine/game';
import type { GameState } from '../engine/types';

export type SimJob = { kind: 'ahead'; until: 'next' | 'through' | 'week' | 'month' | 'season' } | { kind: 'rollover' };

/** Runs a job on a game state (changing it), day by day. Calls onProgress now and then, and stops early when shouldStop says so.
    next: to the morning of your next match (unplayed) · through: past your next match · week / month: 7 / 28 days · season: to the end. */
export async function runJob(d: GameState, job: SimJob, onProgress: (label: string) => void, shouldStop: () => boolean) {
  migrate(d); // restores per-world setup that isn't part of the save (e.g. reserved real names)
  if (job.kind === 'rollover') { startNewSeason(d); return d; }
  const days = job.until === 'week' ? 7 : job.until === 'month' ? 28 : Infinity;
  let passed = 0, steps = 0;
  // already on a match day and asked for the next one: that is today's
  if (job.until === 'next' && todaysFixture(d)) return d;
  while (!seasonOver(d) && !shouldStop() && !d.career?.sacked && passed < days) {
    const mine = !!todaysFixture(d);
    advanceDay(d);
    passed++; steps++;
    if (job.until === 'through' && mine) break;
    if (job.until === 'next' && todaysFixture(d)) break;
    if (steps % 3 === 0) {
      onProgress(`Simulating… ${formatDate(today(d))}`);
      await new Promise((r) => setTimeout(r, 0)); // lets a stop request in
    }
  }
  return d;
}
