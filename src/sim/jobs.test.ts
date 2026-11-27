import { describe, expect, it } from 'vitest';
import { addDays, advanceDay, newGame, seasonOver, today, todaysFixture, userFixture } from '../engine/game';
import { runJob } from './jobs';

const game = () => newGame({ seed: 81, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('days', () => {
  it('a day passes at a time; a match day plays its fixtures and moves on to tomorrow', () => {
    const s = game();
    let guard = 0;
    while (!todaysFixture(s) && guard++ < 60) advanceDay(s);
    const day = today(s);
    const f = todaysFixture(s)!;
    expect(f.result).toBeUndefined();
    advanceDay(s);
    expect(f.result).toBeTruthy();
    expect(today(s)).toBe(addDays(day, 1));
    const before = today(s);
    if (!todaysFixture(s)) { advanceDay(s); expect(today(s) >= addDays(before, 1)).toBe(true); }
  });
});

describe('simulation jobs', () => {
  it('sims to your next match day, past it, a week, four weeks, or the end of the season, and can stop', async () => {
    const s = game();
    await runJob(s, { kind: 'ahead', until: 'next' }, () => {}, () => false);
    const f = todaysFixture(s)!;
    expect(f).toBeTruthy();
    expect(f.result).toBeUndefined(); // waits for you to play it
    await runJob(s, { kind: 'ahead', until: 'through' }, () => {}, () => false);
    expect(f.result).toBeTruthy();
    const d0 = today(s);
    await runJob(s, { kind: 'ahead', until: 'week' }, () => {}, () => false);
    expect(Date.parse(today(s)) - Date.parse(d0)).toBe(7 * 86_400_000);
    await runJob(s, { kind: 'ahead', until: 'month' }, () => {}, () => false);
    expect(Date.parse(today(s)) - Date.parse(d0)).toBe(35 * 86_400_000);
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
