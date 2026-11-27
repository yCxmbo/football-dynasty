import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, startNewSeason, totalMatchdays } from './game';
import { buildReview } from './seasonreview';

describe('season review', () => {
  it('records the course of the season and archives the review at the turn', () => {
    const s = newGame({ seed: 21, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    const r = buildReview(s)!;
    expect(r.course.length).toBeGreaterThan(10);
    expect(r.course[r.course.length - 1]).toBe(r.pos);
    expect(r.w + r.d + r.l).toBeGreaterThan(10);
    expect(r.scorers.length).toBeGreaterThan(0);
    startNewSeason(s);
    expect(s.reviews?.[0].season).toBe(r.season);
    expect(s.reviews?.[0].pos).toBe(r.pos);
    expect(s.course).toBeUndefined();
  }, 60_000);
});
