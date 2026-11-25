import { describe, expect, it } from 'vitest';
import { makeFixtures } from './fixtures';
import { leagueTable, newGame, playMatchday, promote, seasonOver, startNewSeason, squadOf, totalMatchdays } from './game';
import { abilityFromAttributes } from './ratings';
import { createRng } from './rng';
import { makeAttributes } from './world';

describe('fixtures', () => {
  it('double round robin: every pair meets home and away once', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `c${i}`);
    const f = makeFixtures(ids, 2026);
    expect(f.length).toBe(12 * 11);
    expect(new Set(f.map((x) => `${x.homeId}-${x.awayId}`)).size).toBe(132);
    for (let md = 1; md <= 22; md++) {
      const clubs = f.filter((x) => x.matchday === md).flatMap((x) => [x.homeId, x.awayId]);
      expect(new Set(clubs).size).toBe(12);
    }
  });
});

describe('ratings', () => {
  it('generated attributes land near the target ability', () => {
    const rng = createRng(1);
    for (const target of [60, 100, 140, 180]) {
      const ca = abilityFromAttributes(makeAttributes(rng, 'ST', target), 'ST');
      expect(Math.abs(ca - target)).toBeLessThan(12);
    }
  });
});

describe('season', () => {
  it('is deterministic for a seed', () => {
    const a = newGame({ seed: 42, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    const b = newGame({ seed: 42, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    playMatchday(a); playMatchday(b);
    expect(a.fixtures.filter((f) => f.result).map((f) => f.result!.score)).toEqual(b.fixtures.filter((f) => f.result).map((f) => f.result!.score));
  });

  it('plays a full season with a consistent table, then starts the next', () => {
    const s = newGame({ seed: 7, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    const n = totalMatchdays(s);
    for (let i = 0; i < n; i++) playMatchday(s);
    expect(seasonOver(s)).toBe(true);
    const t = leagueTable(s);
    expect(t.every((r) => r.p === 22)).toBe(true);
    const goals = s.fixtures.reduce((g, f) => g + f.result!.score[0] + f.result!.score[1], 0);
    expect(t.reduce((g, r) => g + r.gf, 0)).toBe(goals);
    const avg = goals / s.fixtures.length;
    expect(avg).toBeGreaterThan(1.8); expect(avg).toBeLessThan(4.2);
    const totalPts = t.reduce((p, r) => p + r.pts, 0);
    const draws = s.fixtures.filter((f) => f.result!.score[0] === f.result!.score[1]).length;
    expect(totalPts).toBe((s.fixtures.length - draws) * 3 + draws * 2);

    startNewSeason(s);
    expect(s.year).toBe(2027);
    expect(s.matchday).toBe(1);
    expect(s.history['ash'][0].season).toBe('2026/27');
    expect(Object.values(s.trophies).flat().some((t) => t.seasons.includes('2026/27'))).toBe(true);
    for (const c of Object.keys(s.clubs)) expect(squadOf(s, c).filter((p) => p.squad === 'First team').length).toBeGreaterThanOrEqual(22);
    expect(squadOf(s, 'ash').some((p) => p.squad === 'U18' && p.age <= 16)).toBe(true);
  });

  it('promoting a youth player gives a professional contract', () => {
    const s = newGame({ seed: 3, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
    const y = squadOf(s, 'ash').find((p) => p.squad === 'U21')!;
    expect(y.contractType).toBe('youth');
    promote(s, y.id);
    expect(s.players[y.id].squad).toBe('First team');
    expect(s.players[y.id].contractType).toBe('full-time');
  });
});
