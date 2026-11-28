import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, startNewSeason, totalMatchdays } from './game';
import { AUTO_SIGN, MAX_SIGN, setRegions, togglePick } from './youth';

describe('youth recruitment', () => {
  it('candidates arrive late in the season; you pick who joins; regions bring their nationals', () => {
    const s = newGame({ seed: 91, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    setRegions(s, ['BRA', 'ARG', 'FRA']);
    expect(s.youthRegions).toEqual(['BRA', 'ARG']);
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    const y = s.youth!;
    expect(y.candidates.length).toBe(12);
    expect(y.comments.length).toBeGreaterThan(0);
    expect(y.candidates.some((p) => p.nationality === 'BRA' || p.nationality === 'ARG')).toBe(true);
    const pick = y.candidates.slice(-3).map((p) => p.name);
    for (const p of y.candidates.slice(-3)) expect(togglePick(s, p.id)).toBeNull();
    for (const p of y.candidates.slice(0, MAX_SIGN - 3)) togglePick(s, p.id);
    expect(togglePick(s, y.candidates[MAX_SIGN].id)).toMatch(/at most/);
    for (const p of y.candidates.slice(0, MAX_SIGN - 3)) togglePick(s, p.id); // untick again
    const before = squadOf(s, 'ash').filter((p) => p.squad === 'U18').length;
    startNewSeason(s);
    const u18 = squadOf(s, 'ash').filter((p) => p.squad === 'U18').map((p) => p.name);
    for (const n of pick) expect(u18).toContain(n);
    expect(s.youth).toBeUndefined();
    expect(u18.length).toBeGreaterThanOrEqual(3);
    expect(before).toBeGreaterThanOrEqual(0);
    expect(AUTO_SIGN).toBe(4);
  }, 60_000);
});
