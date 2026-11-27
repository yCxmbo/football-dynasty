/* Simulation jobs, shared by the background worker and the main-thread fallback. */
import { formatDate } from '../engine/fixtures';
import { advanceDay, migrate, seasonOver, startNewSeason, today, todaysFixture } from '../engine/game';
import { withSquadIndex } from '../engine/index';
import type { GameState } from '../engine/types';

export type SimJob = { kind: 'ahead'; until: 'next' | 'through' | 'week' | 'month' | 'season' } | { kind: 'rollover' };

/** Runs a job on a game state (changing it), day by day. Calls onProgress now and then, and stops early when shouldStop says so.
    next: to the morning of your next match (unplayed) · through: past your next match · week / month: 7 / 28 days · season: to the end. */
export async function runJob(d: GameState, job: SimJob, onProgress: (label: string) => void, shouldStop: () => boolean) {
  migrate(d); // restores per-world setup that isn't part of the save (e.g. reserved real names)
  if (job.kind === 'rollover') { startNewSeason(d); return d; }
  const days = job.until === 'week' ? 7 : job.until === 'month' ? 28 : Infinity;
  let passed = 0;
  // already on a match day and asked for the next one: that is today's
  if (job.until === 'next' && todaysFixture(d)) return d;
  let done = false;
  while (!done && !seasonOver(d) && !shouldStop() && !d.career?.sacked && passed < days) {
    // a batch of days under one squad index (building it scans every player), then a pause so a stop request gets in
    const t0 = Date.now();
    withSquadIndex(d, () => {
      while (!seasonOver(d) && !d.career?.sacked && passed < days && Date.now() - t0 < 50) {
        const mine = !!todaysFixture(d);
        advanceDay(d);
        passed++;
        if ((job.until === 'through' && mine) || (job.until === 'next' && todaysFixture(d))) { done = true; return; }
      }
    });
    onProgress(`Simulating… ${formatDate(today(d))}`);
    await new Promise((r) => setTimeout(r, 0));
  }
  return d;
}
