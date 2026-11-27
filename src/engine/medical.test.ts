import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, totalMatchdays } from './game';
import { canRush, injuryRisk, medicalReport, recordInjury, relapses, returnDate, rushBack } from './medical';

const game = () => newGame({ seed: 9, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('medical centre', () => {
  it('names and logs injuries over a season, and clears healed ones', () => {
    const s = game();
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    const log = s.injuryLog ?? [];
    expect(log.length).toBeGreaterThan(0);
    for (const l of log) expect(l.type.length).toBeGreaterThan(2);
    for (const p of squadOf(s, 'ash')) if (p.injuredFor <= 0 && p.injury) expect(p.injury.rushed).toBe(true);
  });
  it('rushing back halves the lay-off once; a rushed player is riskier and may relapse', () => {
    const s = game();
    const p = squadOf(s, 'ash').find((x) => x.squad === 'First team')!;
    const before = injuryRisk(s, p);
    p.injuredFor = 6; recordInjury(s, p, 'match');
    expect(p.injury?.type).toBeTruthy();
    expect(returnDate(s, p)).toBeTruthy();
    expect(canRush(p)).toBe(true);
    rushBack(s, p.id);
    expect(p.injuredFor).toBe(3);
    expect(canRush(p)).toBe(false);
    p.injuredFor = 0;
    expect(injuryRisk(s, p)).toBeGreaterThan(before);
    let relapsed = 0;
    for (let i = 0; i < 40; i++) {
      const t = game(); const q = squadOf(t, 'ash').filter((x) => x.squad === 'First team')[i % 20];
      t.today = `2025-09-${String(1 + (i % 28)).padStart(2, '0')}`;
      q.injuredFor = 4; recordInjury(t, q, 'match'); rushBack(t, q.id); q.injuredFor = 0;
      if (relapses(t, [q.id]).length) { relapsed++; expect(q.injuredFor).toBeGreaterThanOrEqual(3); expect(q.injury?.type).toContain('relapse'); }
    }
    expect(relapsed).toBeGreaterThan(0);
    expect(relapsed).toBeLessThan(25);
    expect(medicalReport(s).fit.length).toBeGreaterThan(10);
  });
});
