import { describe, expect, it } from 'vitest';
import { newGame, nextUserFixture, playMatchday, startUserMatch, userFixture } from './game';
import { FOCUS, focusValue, oppositionReport, prepFor, setPrep } from './opposition';

describe('match prep', () => {
  it('focus and man-marking change the plan for that fixture only, and clear after the match', () => {
    const s = newGame({ seed: 5, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    let guard = 0;
    while (nextUserFixture(s)?.comp === 'friendly' && guard++ < 10) playMatchday(s);
    const f = nextUserFixture(s)!;
    const r = oppositionReport(s, f)!;
    const base = prepFor(s, f).boost;
    const best = FOCUS.slice().sort((a, b) => r.edges[b.edge] - r.edges[a.edge])[0];
    setPrep(s, f.id, { focus: best.id });
    expect(prepFor(s, f).boost).toBeCloseTo(base * focusValue(r.edges[best.edge]), 6);
    const danger = r.danger[0]?.id ?? r.xi[10].id;
    setPrep(s, f.id, { mark: danger });
    expect(prepFor(s, f).marked).toBe(danger);
    expect(s.matchPrep).toEqual({ fixtureId: f.id, focus: best.id, mark: danger });
    if (userFixture(s)?.id === f.id) {
      const lm = startUserMatch(s)!;
      const side = f.homeId === s.userClubId ? lm.away : lm.home;
      expect(side.marked).toBe(danger);
    }
    setPrep(s, f.id, { mark: null });
    expect(s.matchPrep?.mark).toBeUndefined();
    expect(focusValue(10)).toBeGreaterThan(1);
    expect(focusValue(-3)).toBeLessThan(1);
    setPrep(s, f.id, { mark: danger });
    guard = 0;
    while (!f.result && guard++ < 10) playMatchday(s);
    expect(s.matchPrep).toBeUndefined();
  });
});
