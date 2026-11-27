import { describe, expect, it } from 'vitest';
import { analysisNotes, bySource } from './analysis';
import { newGame, playMatchday, startUserMatch } from './game';
import { runToEnd, toResult } from './live';
import type { MatchAnalysis } from './types';

describe('match analysis', () => {
  it('your matches record xG by minute and every goal with its source; other matches stay slim', () => {
    const s = newGame({ seed: 151, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const lm = startUserMatch(s)!;
    runToEnd(lm);
    const { result } = toResult(lm, 'h', 'a');
    const a = result.analysis!;
    expect(a.xg.length).toBe(91);
    expect(a.xg[90]).toEqual([Math.round(lm.stats.xg[0] * 100) / 100, Math.round(lm.stats.xg[1] * 100) / 100]);
    for (let m = 1; m < a.xg.length; m++) { expect(a.xg[m][0]).toBeGreaterThanOrEqual(a.xg[m - 1][0]); expect(a.xg[m][1]).toBeGreaterThanOrEqual(a.xg[m - 1][1]); }
    expect(a.chances.filter((c) => c.side === 0 && c.goal).length).toBe(result.score[0]);
    expect(a.chances.filter((c) => c.side === 1 && c.goal).length).toBe(result.score[1]);
    for (let i = 0; i < 3; i++) playMatchday(s);
    const played = s.fixtures.filter((f) => f.result);
    const mine = played.filter((f) => f.homeId === 'ash' || f.awayId === 'ash');
    expect(mine.some((f) => f.result!.analysis)).toBe(true);
    expect(played.filter((f) => f.homeId !== 'ash' && f.awayId !== 'ash').every((f) => !f.result!.analysis)).toBe(true);
  });

  const fake = (over: Partial<MatchAnalysis> = {}): MatchAnalysis => ({
    xg: Array.from({ length: 91 }, (_, m) => [m * 0.03, m * 0.01] as [number, number]),
    chances: [], ...over,
  });
  it('notes: wasteful finishing, counters against a high line, set pieces, control', () => {
    const a = fake({ chances: [
      { m: 10, side: 1, src: 'counter', goal: true }, { m: 20, side: 1, src: 'counter', goal: false }, { m: 30, side: 1, src: 'counter', goal: false },
      { m: 50, side: 0, src: 'corner', goal: true }, { m: 60, side: 0, src: 'open', goal: false },
    ] });
    const notes = analysisNotes(a, 0, { line: 'high' });
    expect(notes.join(' ')).toMatch(/finishing let us down/);
    expect(notes.join(' ')).toMatch(/high line was exposed/);
    expect(notes.length).toBeLessThanOrEqual(4);
    const src = bySource(a, 1);
    expect(src.find((x) => x.src === 'counter')).toMatchObject({ shots: 3, goals: 1 });
  });
  it('an even, quiet game still gets a note', () => {
    const a = fake({ xg: Array.from({ length: 91 }, (_, m) => [m * 0.01, m * 0.01] as [number, number]) });
    expect(analysisNotes(a, 1)).toEqual(['An even game with no clear pattern: the details decided it.']);
  });
});
