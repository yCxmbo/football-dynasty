import { describe, expect, it } from 'vitest';
import { newGame, playMatchday } from './game';
import { attrRange, leaders, value } from './stats';

describe('stats', () => {
  it('tracks clean sheets and player of the match; leaders are sorted', () => {
    const s = newGame({ seed: 181, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    for (let i = 0; i < 8; i++) playMatchday(s);
    const played = s.fixtures.filter((f) => f.result && f.comp !== 'friendly').length;
    const all = Object.values(s.players);
    expect(all.reduce((a, p) => a + (p.current.potm ?? 0), 0)).toBe(played);
    expect(all.filter((p) => (p.current.cleanSheets ?? 0) > 0).every((p) => p.pos === 'GK')).toBe(true);
    expect(all.some((p) => (p.current.cleanSheets ?? 0) > 0)).toBe(true);
    for (const m of ['goals', 'assists', 'contrib', 'rating', 'cleanSheets', 'potm'] as const) {
      const l = leaders(s, 'all', m);
      for (let i = 1; i < l.length; i++) expect(value(l[i - 1], m)).toBeGreaterThanOrEqual(value(l[i], m));
    }
    const league = s.clubs.ash.league!;
    expect(leaders(s, league, 'goals').every((p) => s.clubs[p.clubId].league === league)).toBe(true);
  });
  it('attributes are exact when known, a range otherwise', () => {
    expect(attrRange(14, 100)).toEqual([14, 14]);
    const [lo, hi] = attrRange(14, 20);
    expect(lo).toBeLessThan(14); expect(hi).toBeGreaterThan(14);
    expect(attrRange(19, 0)[1]).toBe(20);
  });
});
