import { describe, expect, it } from 'vitest';
import { realWorld } from '../data/real';
import { newGame, playMatchday, seasonOver } from './game';
import { REAL_RIVALRIES, derbyName } from './rivalries';

describe('derbies', () => {
  it('every real derby points at real clubs, and a season keeps head-to-head records', () => {
    const w = realWorld();
    const ids = new Set(w.clubs.map((c) => c.id));
    for (const r of REAL_RIVALRIES) { expect(ids.has(r.a), r.a).toBe(true); expect(ids.has(r.b), r.b).toBe(true); }
    const s = newGame({ seed: 121, userClubId: 'eng-arsenal', managerName: 'T', currency: 'EUR', world: w, source: 'real' });
    expect(derbyName(s, 'eng-tottenham', 'eng-arsenal')).toBe('North London derby');
    expect(derbyName(s, 'eng-arsenal', 'eng-chelsea')).toBeUndefined();
    while (!seasonOver(s)) playMatchday(s);
    const nld = s.derbies!['North London derby'];
    expect(nld.aWins + nld.bWins + nld.draws).toBeGreaterThanOrEqual(2);
    expect(s.derbies!['El Clásico']).toBeTruthy();
    const f = s.fixtures.find((x) => x.comp === 'eng1' && derbyName(s, x.homeId, x.awayId) === 'North London derby')!;
    expect(f.result!.events[0].text).toMatch(/Derby day: North London derby/);
  }, 120_000);
});
