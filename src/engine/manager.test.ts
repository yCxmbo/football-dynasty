import { describe, expect, it } from 'vitest';
import { advanceDay, newGame, playMatchday, squadOf } from './game';
import { attr, checkBadge, licenceNeeded, licencePenalty, priceFactor, profileOf, startBadge } from './manager';
import { askingPrice } from './transfers';

describe('manager profile', () => {
  it('starts from the coaching style and grows with matches', () => {
    const youth = newGame({ seed: 3, userClubId: 'ash', managerName: 'T', currency: 'EUR', style: 'youth' });
    expect(profileOf(youth).attrs.youth).toBe(15);
    const s = newGame({ seed: 3, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const before = { ...profileOf(s).attrs };
    for (let i = 0; i < 10; i++) playMatchday(s);
    expect(profileOf(s).attrs.tactics).toBeGreaterThan(before.tactics);
  });
  it('negotiating lowers asking prices', () => {
    const s = newGame({ seed: 3, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const p = Object.values(s.players).find((x) => x.clubId !== 'ash' && x.value > 20_000_000)!;
    profileOf(s).attrs.negotiating = 10;
    const a = askingPrice(s, p);
    profileOf(s).attrs.negotiating = 20;
    expect(askingPrice(s, p)).toBeLessThan(a);
    expect(priceFactor(s)).toBeCloseTo(0.94, 5);
    expect(attr(s, 'negotiating')).toBe(20);
  });
  it('a badge costs earnings, takes time, then raises attributes; big clubs want licences', () => {
    const s = newGame({ seed: 3, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    expect(startBadge(s)).toMatch(/enough/);
    s.career!.earnings = 1_000_000;
    expect(startBadge(s)).toBeNull();
    expect(s.career!.earnings).toBe(1_000_000 - 220_000);
    expect(startBadge(s)).toMatch(/already/);
    const t = profileOf(s).attrs.tactics;
    expect(checkBadge(s)).toBeUndefined();
    for (let i = 0; i < 160 && profileOf(s).studying; i++) advanceDay(s);
    expect(profileOf(s).badge).toBe('A');
    expect(profileOf(s).attrs.tactics).toBeGreaterThan(t + 1);
    expect(licenceNeeded(90)).toBe('Pro');
    expect(licencePenalty(s, 90)).toBeCloseTo(0.12, 5);
    expect(licencePenalty(s, 60)).toBe(0);
    expect(squadOf(s, 'ash').length).toBeGreaterThan(0);
  });
});
