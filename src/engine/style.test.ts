import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, startUserMatch, userFixture } from './game';
import { runToEnd } from './live';
import { setStyle, youthDevelopmentBoost } from './style';

describe('coaching style', () => {
  it('attacking teams score and concede more than defensive ones', () => {
    const s = newGame({ seed: 111, userClubId: 'ash', managerName: 'T', currency: 'EUR', style: 'attacking' });
    while (!userFixture(s)) playMatchday(s);
    const goals = (style: 'attacking' | 'defensive') => {
      s.managerStyle = style;
      let gf = 0, ga = 0;
      for (let i = 0; i < 300; i++) {
        s.rngState = (s.rngState + 7919) >>> 0;
        const lm = startUserMatch(s)!;
        const key = lm.home.user ? 0 : 1;
        runToEnd(lm);
        gf += lm.score[key]; ga += lm.score[1 - key];
      }
      return { gf, ga };
    };
    const att = goals('attacking'), def = goals('defensive');
    expect(att.gf).toBeGreaterThan(def.gf);
    expect(att.ga).toBeGreaterThan(def.ga);
  });

  it('changes once a season; the youth developer helps young players', () => {
    const s = newGame({ seed: 112, userClubId: 'ash', managerName: 'T', currency: 'EUR', style: 'youth' });
    expect(youthDevelopmentBoost(s, 19)).toBeGreaterThan(1);
    expect(youthDevelopmentBoost(s, 27)).toBe(1);
    expect(setStyle(s, 'motivator')).toBeNull();
    expect(setStyle(s, 'attacking')).toMatch(/already/);
    expect(s.managerStyle).toBe('motivator');
  });
});
