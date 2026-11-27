import { describe, expect, it } from 'vitest';
import { advanceDay, newGame, squadOf } from './game';
import { askingWage, checkContractPromises, negotiate, summerWages } from './negotiation';
import { squadMoods } from './dynamics';
import { wageDemand } from './transfers';

const game = () => newGame({ seed: 51, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
const fringe = (s: ReturnType<typeof game>) => squadOf(s, 'ash').filter((p) => p.squad === 'First team' && p.age < 30).sort((a, b) => a.ability - b.ability)[2];

describe('contract talks', () => {
  it('each term moves his asking wage the expected way', () => {
    const s = game();
    const p = fringe(s);
    const base = askingWage(s, p, { years: 3, terms: {}, promises: [] });
    expect(base).toBeCloseTo(wageDemand(s, p, true), -3);
    expect(askingWage(s, p, { years: 3, terms: { role: 'Star player' }, promises: [] })).toBeLessThan(base);
    expect(askingWage(s, p, { years: 3, terms: { rise: 10 }, promises: [] })).toBeLessThan(base);
    expect(askingWage(s, p, { years: 3, terms: { relegationCut: 50 }, promises: [] })).toBeGreaterThan(base);
    p.brokenPromises = 1;
    expect(askingWage(s, p, { years: 3, terms: {}, promises: [] })).toBeGreaterThan(base);
  });
  it('a signed role sets playing-time expectations; rises apply in summer; clauses too', () => {
    const s = game();
    const p = fringe(s);
    const o = { years: 3, terms: { role: 'Star player' as const, rise: 10, relegationCut: 25, minFee: p.value * 2 }, promises: [] };
    expect(negotiate(s, p.id, { wage: Math.round(askingWage(s, p, o) * 1.01), ...o })).toBeNull();
    expect(p.terms?.role).toBe('Star player');
    expect(p.releaseClause).toBe(p.value * 2);
    const w = p.wage;
    summerWages(s, 'relegated');
    expect(p.wage).toBeCloseTo(w * 1.1 * 0.75, -3);
    // a "star" who doesn't play is unhappy
    for (const q of squadOf(s, 'ash')) q.current.apps = 10;
    p.current.apps = 1;
    expect(squadMoods(s).find((m) => m.id === p.id)!.reasons).toContain('Not playing enough');
  });
  it('a promised signing that never comes is remembered', () => {
    const s = game();
    const p = fringe(s);
    const o = { years: 2, terms: {}, promises: ['signing' as const] };
    expect(negotiate(s, p.id, { wage: askingWage(s, p, o) * 2, ...o })).toBeNull();
    expect(p.promises?.length).toBe(1);
    for (let i = 0; i < 40 && p.promises?.length; i++) { advanceDay(s); checkContractPromises(s); }
    expect(p.promises).toBeUndefined();
    expect(p.brokenPromises).toBe(1);
    expect(p.morale).toBe('low');
  });
});
