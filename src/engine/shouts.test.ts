import { describe, expect, it } from 'vitest';
import { newGame, startUserMatch, advanceDay, todaysFixture } from './game';
import { setOppInstr, shout, shoutCooldown, tick } from './live';

function liveMatch() {
  const s = newGame({ seed: 8, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
  for (let i = 0; i < 40 && !todaysFixture(s); i++) advanceDay(s);
  return { s, lm: startUserMatch(s)! };
}

describe('touchline', () => {
  it('a shout lifts the side for ten minutes, then wears off; one every ten minutes', () => {
    const { s, lm } = liveMatch();
    const key = todaysFixture(s)!.homeId === 'ash' ? 'home' : 'away';
    for (let i = 0; i < 20; i++) tick(lm);
    const b0 = lm[key].boost;
    expect(shout(lm, key, 'fireup')).toBeTruthy();
    expect(lm[key].boost).toBeGreaterThan(b0);
    expect(shoutCooldown(lm, key)).toBe(10);
    expect(shout(lm, key, 'calm')).toBeNull();
    for (let i = 0; i < 11; i++) tick(lm);
    expect(lm[key].shout).toBeUndefined();
    expect(lm[key].boost).toBeCloseTo(b0, 3);
    expect(shoutCooldown(lm, key)).toBe(0);
  });
  it('demanding more when well ahead backfires; calming a late lead helps', () => {
    const { s, lm } = liveMatch();
    const key = todaysFixture(s)!.homeId === 'ash' ? 'home' : 'away', si = key === 'home' ? 0 : 1;
    lm.score[si] = 3; lm.minute = 30;
    const b = lm[key].boost; shout(lm, key, 'demand'); expect(lm[key].boost).toBeLessThan(b);
    lm.score[si] = 1; lm.score[1 - si] = 0; lm.minute = 80;
    const b2 = lm[key].boost / lm[key].shout!.factor; shout(lm, key, 'calm'); expect(lm[key].boost).toBeGreaterThan(b2);
  });
  it('opposition instructions: two at most, tight-marking costs a little and can be undone', () => {
    const { s, lm } = liveMatch();
    const key = todaysFixture(s)!.homeId === 'ash' ? 'home' : 'away', them = key === 'home' ? 'away' : 'home';
    const [a, b, c] = lm[them].xi.slice(5) as string[];
    const b0 = lm[key].boost;
    expect(setOppInstr(lm, key, a, 'tight')).toBeNull();
    expect(lm[key].boost).toBeLessThan(b0);
    expect(setOppInstr(lm, key, b, 'close')).toBeNull();
    expect(setOppInstr(lm, key, c, 'foot')).toMatch(/Two/);
    setOppInstr(lm, key, a, null);
    expect(lm[key].boost).toBeCloseTo(b0, 4);
    expect(lm[them].instrOn).toEqual({ [b]: 'close' });
  });
});
