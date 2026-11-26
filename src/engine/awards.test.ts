import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, startNewSeason, totalMatchdays } from './game';
import { TEAM_SLOTS, YOUNG_AGE } from './awards';
import { realWorld } from '../data/real';

describe('season awards', () => {
  it('names winners in every top flight and worldwide, and notes them on the players', () => {
    const s = newGame({ seed: 4, userClubId: 'eng-arsenal', managerName: 'T', currency: 'GBP', world: realWorld(), source: 'real' });
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    const goals = Object.fromEntries(Object.values(s.players).map((p) => [p.id, p.current.goals]));
    startNewSeason(s);
    const a = s.awards!.latest!;
    expect(a.season).toBe('2025/26');
    expect(a.leagues.length).toBe(s.world.leagues.filter((l) => l.tier === 1).length);
    for (const l of a.leagues) {
      expect(l.pots, l.league).toBeTruthy();
      expect(l.team.map((w) => w.pos === 'GK').filter(Boolean).length).toBe(1);
      expect(l.team.length).toBe(TEAM_SLOTS.length);
      expect(new Set(l.team.map((w) => w.id)).size).toBe(l.team.length);
      if (l.young) expect(l.young.age).toBeLessThanOrEqual(YOUNG_AGE);
      expect(l.scorer!.goals).toBe(goals[l.scorer!.id]);
    }
    expect(a.ball.length).toBe(3);
    expect(new Set(a.ball.map((w) => w.id)).size).toBe(3);
    expect(a.boy!.age).toBeLessThanOrEqual(YOUNG_AGE);
    expect(s.awards!.history[0].ball[0].id).toBe(a.ball[0].id);
    const top = s.players[a.ball[0].id];
    if (top) expect(top.awards).toContain('Golden Ball 2025/26');
    expect(s.inbox.some((m) => m.from === 'Football awards' && m.body.some((b) => b.startsWith('Golden Ball:')))).toBe(true);
    console.log(a.ball.map((w) => `${w.name} ${w.club} ${w.rating} ${w.goals}`), a.boy?.name, a.leagues.slice(0, 3).map((l) => [l.pots?.name, l.young?.name, l.scorer?.name, l.scorer?.goals]));
  }, 180_000);
});
