/* Simulation jobs, shared by the background worker and the main-thread fallback. */
import { currentSlot, currentWeek } from '../engine/competitions';
import { formatDate } from '../engine/fixtures';
import { migrate, playMatchday, seasonOver, startNewSeason, userFixture } from '../engine/game';
import type { GameState } from '../engine/types';

export type SimJob = { kind: 'ahead'; until: 'match' | 'month' | 'season' } | { kind: 'rollover' };

/** Runs a job on a game state (changing it). Calls onProgress now and then, and stops early when shouldStop says so. */
export async function runJob(d: GameState, job: SimJob, onProgress: (label: string) => void, shouldStop: () => boolean) {
  migrate(d); // restores per-world setup that isn't part of the save (e.g. reserved real names)
  if (job.kind === 'rollover') { startNewSeason(d); return d; }
  const until = currentWeek(d) + 4;
  let steps = 0;
  while (!seasonOver(d) && !shouldStop() && !d.career?.sacked) {
    const hadMatch = !!userFixture(d);
    playMatchday(d);
    steps++;
    if (job.until === 'match' && hadMatch) break;
    if (job.until === 'month' && currentWeek(d) >= until) break;
    if (steps % 2 === 0) {
      const s = currentSlot(d);
      onProgress(`Simulating… ${s ? formatDate(s.date) : ''}`);
      await new Promise((r) => setTimeout(r, 0)); // lets a stop request in
    }
  }
  return d;
}
