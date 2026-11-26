import { describe, expect, it } from 'vitest';
import { newGame, recoveryPerDay, squadOf } from './game';
import { ROLES, developmentBoost, hire, injuryLengthFactor, maxRatingFor, scoutPerMatchday } from './staff';

const game = () => newGame({ seed: 5, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('staff', () => {
  it('a new career comes with a full staff within the club\'s reach, and candidates for every role', () => {
    const s = game();
    for (const { role } of ROLES) {
      expect(s.staff?.[role]).toBeTruthy();
      expect(s.staff![role]!.rating).toBeLessThanOrEqual(maxRatingFor(s.clubs.ash.reputation));
      expect(s.staffPool!.some((m) => m.role === role)).toBe(true);
    }
  });

  it('better staff mean faster development, recovery and scouting, and shorter injuries', () => {
    const s = game();
    const p = squadOf(s, 'ash')[0];
    s.staff!.coach!.rating = 5; s.staff!.fitness!.rating = 5; s.staff!.physio!.rating = 5; s.staff!.scout!.rating = 5;
    const low = { dev: developmentBoost(s), rec: recoveryPerDay(s, p), inj: injuryLengthFactor(s), scout: scoutPerMatchday(s) };
    s.staff!.coach!.rating = 19; s.staff!.fitness!.rating = 19; s.staff!.physio!.rating = 19; s.staff!.scout!.rating = 19;
    expect(developmentBoost(s)).toBeGreaterThan(low.dev);
    expect(recoveryPerDay(s, p)).toBeGreaterThan(low.rec);
    expect(injuryLengthFactor(s)).toBeLessThan(low.inj);
    expect(scoutPerMatchday(s)).toBeGreaterThan(low.scout);
  });

  it('hiring replaces the old holder, pays him off, and top staff refuse small clubs', () => {
    const s = game();
    const top = maxRatingFor(s.clubs.ash.reputation);
    const cand = s.staffPool!.find((m) => m.rating <= top)!;
    const old = s.staff![cand.role]!;
    const bal = s.clubs.ash.balance;
    expect(hire(s, cand.id)).toBeNull();
    expect(s.staff![cand.role]!.id).toBe(cand.id);
    expect(s.clubs.ash.balance).toBe(bal - old.wage * 8);
    s.clubs.ash.reputation = 20;
    const star = s.staffPool!.find((m) => m.rating > maxRatingFor(20));
    if (star) expect(hire(s, star.id)).toMatch(/bigger club/);
  });
});
