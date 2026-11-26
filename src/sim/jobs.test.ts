import { describe, expect, it } from 'vitest';
import { currentWeek } from '../engine/competitions';
import { newGame, seasonOver, userFixture } from '../engine/game';
import { runJob } from './jobs';

const game = () => newGame({ seed: 81, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('simulation jobs', () => {
  it('sims to just after your next match, four weeks, or the end of the season, and can stop', async () => {
    const s = game();
    const md = s.matchday;
    await runJob(s, { kind: 'ahead', until: 'match' }, () => {}, () => false);
    expect(s.fixtures.some((f) => f.result && (f.homeId === 'ash' || f.awayId === 'ash'))).toBe(true);
    expect(s.matchday).toBeGreaterThan(md);
    const w = currentWeek(s);
    await runJob(s, { kind: 'ahead', until: 'month' }, () => {}, () => false);
    expect(currentWeek(s)).toBeGreaterThanOrEqual(w + 4);
    let calls = 0;
    await runJob(s, { kind: 'ahead', until: 'season' }, () => {}, () => ++calls > 3);
    expect(seasonOver(s)).toBe(false);
    const labels: string[] = [];
    await runJob(s, { kind: 'ahead', until: 'season' }, (l) => labels.push(l), () => false);
    expect(seasonOver(s)).toBe(true);
    expect(labels.length).toBeGreaterThan(5);
    await runJob(s, { kind: 'rollover' }, () => {}, () => false);
    expect(seasonOver(s)).toBe(false);
    expect(userFixture(s) ?? true).toBeTruthy();
  }, 120_000);
});
