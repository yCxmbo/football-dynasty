import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, seasonOver, startNewSeason } from './game';
import { recordTransfer, titleCounts } from './records';

describe('world records', () => {
  it('a season fills the season, points and title records; transfers keep the top fees', () => {
    const s = newGame({ seed: 101, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    while (!seasonOver(s)) playMatchday(s);
    startNewSeason(s);
    const r = s.records!;
    expect(r.points.length).toBe(s.world.leagues.filter((l) => l.tier === 1).length);
    expect(r.points[0].pts).toBeGreaterThanOrEqual(r.points[r.points.length - 1].pts);
    expect(r.seasons.length).toBeGreaterThan(0);
    expect(titleCounts(s, 'league').length).toBeGreaterThan(0);
    for (let i = 0; i < 20; i++) recordTransfer(s, `P${i}`, 'A', 'B', (i + 5) * 1_000_000, '2026/27');
    expect(r.transfers.length).toBe(15);
    expect(s.records!.transfers[0].fee).toBe(24_000_000);
  }, 120_000);
});
