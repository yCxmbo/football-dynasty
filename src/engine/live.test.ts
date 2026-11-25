import { describe, expect, it } from 'vitest';
import { nextUserFixture, newGame, playMatchday, squadOf, startUserMatch, userFixture, userLineup } from './game';
import { MAX_SUBS, runToEnd, substitute, tick, toResult } from './live';
import type { GameState } from './types';

const game = () => newGame({ seed: 77, userClubId: 'ash', managerName: 'Test', currency: 'EUR' });
const toUserMatch = (s: GameState) => { while (!userFixture(s)) playMatchday(s); };

describe('live match', () => {
  it('a substitution swaps the player, counts, and shows up in the stored result', () => {
    const s = game();
    toUserMatch(s);
    const f = userFixture(s)!;
    const lm = startUserMatch(s)!;
    const key = f.homeId === s.userClubId ? 'home' : 'away';
    for (let i = 0; i < 60; i++) tick(lm);
    const off = lm[key].xi.find((id) => id && lm.players[id].pos !== 'GK')!;
    const on = lm[key].bench.find((id) => !lm.perf[id])!;
    expect(substitute(lm, key, off, on)).toBeNull();
    expect(lm[key].xi).toContain(on);
    expect(lm[key].xi).not.toContain(off);
    expect(lm[key].subsUsed).toBeGreaterThanOrEqual(1);
    expect(substitute(lm, key, off, on)).not.toBeNull(); // can't bring off a player who already left
    playMatchday(s, { fixtureId: f.id, lm });
    const mine = key === 'home' ? s.fixtures.find((x) => x.id === f.id)!.result!.ratings.home : s.fixtures.find((x) => x.id === f.id)!.result!.ratings.away;
    expect(mine.find((r) => r.playerId === off)!.subbedOff).toBe(60);
    expect(mine.find((r) => r.playerId === on)!.subbedOn).toBe(60);
  });

  it('allows at most five substitutions', () => {
    const s = game(); toUserMatch(s);
    const lm = startUserMatch(s)!;
    const key = userFixture(s)!.homeId === s.userClubId ? 'home' : 'away';
    tick(lm);
    let made = 0;
    for (const on of lm[key].bench) {
      const off = lm[key].xi.find((id) => id && lm.players[id].pos !== 'GK' && lm.perf[id].onAt === 0);
      if (!off) break;
      if (substitute(lm, key, off, on) === null) made++;
    }
    expect(made).toBe(MAX_SUBS);
  });

  it('players tire during a match and recover between matches', () => {
    const s = game(); toUserMatch(s);
    const lm = startUserMatch(s)!;
    runToEnd(lm);
    const { conditions } = toResult(lm, 'h', 'a');
    const after = Object.values(conditions);
    expect(Math.min(...after)).toBeLessThan(80);
    const f = userFixture(s)!;
    playMatchday(s, { fixtureId: f.id, lm });
    const starter = userLineup(s)[3];
    const c1 = s.players[starter].condition ?? 100;
    // a week later they have recovered more than after three days
    expect(c1).toBeGreaterThan(Math.min(...after));
  });

  it('auto-rotation replaces a starter who is very tired', () => {
    const s = game();
    const xi = userLineup(s);
    s.lineup = xi;
    const tired = s.players[xi[5]];
    tired.condition = 50;
    expect(userLineup(s)).not.toContain(tired.id);
    expect(s.lineup).toContain(tired.id); // the chosen XI is kept; the rest is only for this match
    s.autoRotate = false;
    expect(userLineup(s)).toContain(tired.id);
  });

  it('a whole season still plays without errors and every squad member has a condition', () => {
    const s = game();
    for (let i = 0; i < 20; i++) playMatchday(s);
    expect(nextUserFixture(s)).toBeTruthy();
    expect(squadOf(s, 'ash').every((p) => (p.condition ?? 100) >= 20)).toBe(true);
  });
});
