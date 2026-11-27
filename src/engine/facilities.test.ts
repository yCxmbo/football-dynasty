import { describe, expect, it } from 'vitest';
import { expandStadium, facilitiesOf, fanBase, trainingFacilityBoost, upgrade, upgradeCost, youthFacilityBonus } from './facilities';
import { attendance } from './finance';
import { newGame, playMatchday, seasonOver, startNewSeason } from './game';

const game = () => newGame({ seed: 51, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('stadium and facilities', () => {
  it('upgrades cost money, raise the level and their effects, and stop at level 5', () => {
    const s = game();
    const c = s.clubs.ash;
    c.balance = 500_000_000;
    const lvl = facilitiesOf(s, 'ash').training, boost = trainingFacilityBoost(s), youth = youthFacilityBonus(s);
    const cost = upgradeCost(c, lvl);
    expect(upgrade(s, 'training')).toBeNull();
    expect(c.balance).toBe(500_000_000 - cost);
    expect(facilitiesOf(s, 'ash').training).toBe(lvl + 1);
    expect(trainingFacilityBoost(s)).toBeGreaterThan(boost);
    upgrade(s, 'youth');
    expect(youthFacilityBonus(s)).toBeGreaterThan(youth);
    while (facilitiesOf(s, 'ash').training < 5) expect(upgrade(s, 'training')).toBeNull();
    expect(upgrade(s, 'training')).toMatch(/best/);
  });

  it('the board refuses work the club cannot pay for', () => {
    const s = game();
    s.clubs.ash.balance = 1000;
    expect(upgrade(s, 'youth')).toMatch(/board/);
    expect(expandStadium(s, 5000)).toMatch(/board/);
  });

  it('new seats open next season, and crowds are limited by the fan base', () => {
    const s = game();
    const c = s.clubs.ash;
    c.balance = 500_000_000;
    const cap = c.capacity;
    expect(expandStadium(s, 5000)).toBeNull();
    expect(expandStadium(s, 2500)).toMatch(/under way/);
    expect(c.capacity).toBe(cap);
    for (let guard = 0; !seasonOver(s) && !s.career?.sacked && guard < 400; guard++) playMatchday(s);
    startNewSeason(s);
    expect(s.clubs.ash.capacity).toBe(cap + 5000);
    expect(s.inbox.some((m) => m.subject === 'The new stands are open')).toBe(true);
    // a huge stadium at a small club stays partly empty
    const small = { ...c, reputation: 30, capacity: 80_000 };
    expect(attendance(small, 1, 20)).toBeLessThanOrEqual(fanBase(small));
  }, 120_000);
});
