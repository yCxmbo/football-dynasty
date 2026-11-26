import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, startUserMatch, userFixture } from './game';
import { runToEnd } from './live';
import { traitsOf } from './traits';

describe('personalities', () => {
  it('tags come from hidden character; big-game players lift a knockout side, nervous ones drag it down', () => {
    const s = newGame({ seed: 151, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const p = squadOf(s, 'ash')[0];
    p.hidden.bigMatches = 19; p.hidden.consistency = 20; p.hidden.injuryProneness = 2;
    expect(traitsOf(p)).toEqual(expect.arrayContaining(['big-game', 'consistent', 'iron']));
    while (!userFixture(s)) playMatchday(s);
    const goals = (big: number) => {
      for (const q of squadOf(s, 'ash')) q.hidden.bigMatches = big;
      let gf = 0;
      for (let i = 0; i < 200; i++) {
        s.rngState = (s.rngState + 104729) >>> 0;
        const lm = startUserMatch(s)!;
        lm.knockout = true;
        const key = lm.home.user ? 0 : 1;
        runToEnd(lm); gf += lm.score[key] - lm.score[1 - key];
      }
      return gf;
    };
    expect(goals(20)).toBeGreaterThan(goals(1));
  });
});
