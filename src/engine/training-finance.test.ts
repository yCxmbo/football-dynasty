import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, startNewSeason, totalMatchdays } from './game';
import { effects, injuryRisk, PRESETS, workload } from './training';
import { prizeMoney } from './finance';
import type { GameState } from './types';

const game = () => newGame({ seed: 8, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
const season = (s: GameState) => { for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s); };

describe('training', () => {
  it('workload and injury risk follow the plan and intensity', () => {
    const s = game();
    expect(workload(s.training)).toBe(12);
    expect(injuryRisk(s.training)).toBe('medium');
    s.training.intensity = 'high';
    expect(injuryRisk(s.training)).toBe('high');
    s.training.week = structuredClone(PRESETS['Light week']); s.training.intensity = 'low';
    expect(injuryRisk(s.training)).toBe('low');
  });
  it('a development plan at high intensity grows young players faster than a light week', () => {
    const grow = (preset: string, intensity: 'low' | 'high') => {
      const s = game();
      s.training.week = structuredClone(PRESETS[preset]); s.training.intensity = intensity;
      season(s);
      const young = squadOf(s, 'ash').filter((p) => p.age <= 21);
      return young.reduce((a, p) => a + p.ability - (p.caStart ?? p.ability), 0) / young.length;
    };
    expect(effects({ week: PRESETS.Development, intensity: 'high', focus: {} }).development).toBeGreaterThan(effects({ week: PRESETS['Light week'], intensity: 'low', focus: {} }).development);
    expect(grow('Development', 'high')).toBeGreaterThan(grow('Light week', 'low'));
  });
  it('individual focus improves that attribute', () => {
    const s = game();
    const p = squadOf(s, 'ash').filter((x) => x.age <= 21 && x.potential - x.ability > 20)[0];
    const attr = 'Pace';
    s.training.focus[p.id] = attr;
    const before = p.attributes[attr];
    season(s);
    expect(s.players[p.id].attributes[attr]).toBeGreaterThan(before);
  });
});

describe('finances', () => {
  it('records weekly income and costs, and pays prize money at season end', () => {
    const s = game();
    const start = s.clubs.ash.balance;
    season(s);
    const L = s.ledger;
    expect(L.income.gate).toBeGreaterThan(0);
    expect(L.income.tv).toBe(22_000_000);
    expect(L.expenses.wages).toBeGreaterThan(0);
    expect(L.balanceHistory.length).toBe(23);
    const before = s.clubs.ash.balance;
    startNewSeason(s);
    expect(s.lastLedger!.income.prize).toBeGreaterThanOrEqual(prizeMoney(12, 12));
    expect(s.clubs.ash.balance).toBeGreaterThan(before);
    expect(Math.abs(before - start)).toBeLessThan(60_000_000);
  });
});
