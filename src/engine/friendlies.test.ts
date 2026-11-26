import { describe, expect, it } from 'vitest';
import { realWorld } from '../data/real';
import { arrangeFriendly, canArrange, friendliesArranged, sharpness } from './friendlies';
import { newGame, playMatchday } from './game';

describe('pre-season friendlies', () => {
  it('up to three, before the season, on the weekends before it; they pay, sharpen, and don\'t count', () => {
    const s = newGame({ seed: 131, userClubId: 'eng-arsenal', managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });
    const offers = s.friendlyOffers!;
    expect(offers.some((o) => o.kind === 'home')).toBe(true);
    expect(offers.some((o) => o.kind === 'tour')).toBe(true);
    const firstDate = s.calendar[0].date, firstFixtures = s.fixtures.length;
    for (const o of offers.slice(0, 4)) arrangeFriendly(s, o.clubId);
    expect(friendliesArranged(s).length).toBe(3);
    expect(canArrange(s)).toBe(false);
    expect(s.calendar[0].date < firstDate).toBe(true);
    expect(s.calendar.map((x) => x.date)).toEqual([...s.calendar.map((x) => x.date)].sort());
    expect(s.fixtures.length).toBe(firstFixtures + 3);
    const bal = s.clubs['eng-arsenal'].balance;
    for (let i = 0; i < 3; i++) playMatchday(s);
    expect(friendliesArranged(s).every((f) => f.result)).toBe(true);
    expect(s.clubs['eng-arsenal'].balance).toBeGreaterThan(bal);
    expect(Object.values(s.players).filter((p) => p.clubId === 'eng-arsenal').every((p) => p.current.apps === 0)).toBe(true);
    expect(s.manager.w + s.manager.d + s.manager.l).toBe(0);
    expect(s.preseason).toBe(3);
    expect(sharpness(s, 2)).toBeCloseTo(1.03);
    expect(sharpness(s, 9)).toBe(1);
    playMatchday(s); // the season proper carries on
    expect(arrangeFriendly(s, s.friendlyOffers![0]?.clubId ?? 'x')).toBeTruthy();
  }, 60_000);
});
