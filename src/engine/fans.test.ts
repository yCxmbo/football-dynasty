import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, totalMatchdays } from './game';
import { fansAfterMatch, fansOf, fansOnTransfer, gateFactors, setTicketPrice } from './fans';

describe('supporters', () => {
  it('mood follows results against expectations and stays in range over a season', () => {
    const s = newGame({ seed: 7, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    const f = fansOf(s);
    expect(f.trend.length).toBeGreaterThan(5);
    expect(f.mood).toBeGreaterThanOrEqual(0);
    expect(f.mood).toBeLessThanOrEqual(100);
  });
  it('a shock win lifts them more than a shock defeat; heavy defeats hurt', () => {
    const s = newGame({ seed: 7, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const opp = Object.values(s.clubs).find((c) => c.league === s.clubs.ash.league && c.id !== 'ash')!;
    const fx = (h: number, a: number) => ({ id: 'x', comp: 'x', round: '', matchday: 1, date: '', homeId: 'ash', awayId: opp.id, result: { score: [h, a] as [number, number] } }) as never;
    fansOf(s).mood = 50; fansAfterMatch(s, fx(3, 0)); const afterWin = fansOf(s).mood;
    fansOf(s).mood = 50; fansAfterMatch(s, fx(0, 4)); const afterLoss = fansOf(s).mood;
    expect(afterWin).toBeGreaterThan(50);
    expect(afterLoss).toBeLessThan(47);
    fansOf(s).mood = 50; fansAfterMatch(s, fx(0, 1), 'Derby'); const derbyLoss = fansOf(s).mood;
    fansOf(s).mood = 50; fansAfterMatch(s, fx(0, 1)); const loss = fansOf(s).mood;
    expect(derbyLoss).toBeLessThan(loss);
  });
  it('ticket prices trade money for crowds; selling a star upsets them', () => {
    const s = newGame({ seed: 7, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    setTicketPrice(s, 'high');
    expect(gateFactors(s).price).toBeGreaterThan(1);
    setTicketPrice(s, 'low');
    expect(gateFactors(s).fill).toBeGreaterThan(0);
    const star = squadOf(s, 'ash').filter((p) => p.squad === 'First team').sort((a, b) => b.ability - a.ability)[0];
    const before = fansOf(s).mood;
    fansOnTransfer(s, star, false);
    expect(fansOf(s).mood).toBeLessThan(before);
    expect(fansOf(s).notes[0]).toContain(star.name);
  });
});
