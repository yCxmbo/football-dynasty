import { describe, expect, it } from 'vitest';
import { newGame, playMatchday } from './game';
import { dataHub } from './datahub';

describe('data hub', () => {
  it('aggregates your matches: xG, sources, players', () => {
    const s = newGame({ seed: 71, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    for (let i = 0; i < 12; i++) playMatchday(s);
    const d = dataHub(s);
    expect(d.matches.length).toBeGreaterThan(4);
    expect(d.totals.gf).toBe(d.matches.reduce((a, m) => a + m.gf, 0));
    expect(d.totals.poss).toBeGreaterThan(20);
    const srcGoals = d.sources.reduce((a, x) => a + x.goals, 0);
    expect(srcGoals).toBeLessThanOrEqual(d.totals.gf);
    expect(d.players.length).toBeGreaterThan(10);
    expect(d.players[0].minutes).toBeGreaterThanOrEqual(d.players[d.players.length - 1].minutes);
  });
});
