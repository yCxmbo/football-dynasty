import { describe, expect, it } from 'vitest';
import { leagueTableOf } from './competitions';
import { newGame, playMatchday, startNewSeason, totalMatchdays } from './game';
import { matchOdds, predictedPos, punditStrength } from './preview';
import { seasonLabel } from './types';

const game = () => newGame({ seed: 81, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('pundits', () => {
  it('predict every league at the start, strongest first, with a preview in the inbox', () => {
    const s = game();
    expect(s.predictions!.season).toBe(seasonLabel(s.year));
    for (const l of s.world.leagues) {
      const t = s.predictions!.tables[l.id];
      expect(t.length).toBe(leagueTableOf(s, l.id).length);
      expect(punditStrength(s, t[0])).toBeGreaterThanOrEqual(punditStrength(s, t[t.length - 1]));
    }
    expect(predictedPos(s, 'ash')).toBeGreaterThan(0);
    const m = s.inbox.find((x) => x.from === 'Season preview')!;
    expect(m.subject).toMatch(/preview/);
    expect(m.body.some((b) => b.startsWith('Title favourites'))).toBe(true);
  });
  it('match odds add up to 100, favour the stronger side and the home side', () => {
    const s = game();
    const t = s.predictions!.tables[s.clubs.ash.league!];
    const strong = t[0], weak = t[t.length - 1];
    const o = matchOdds(s, strong, weak);
    expect(o.home + o.draw + o.away).toBe(100);
    expect(o.home).toBeGreaterThan(o.away);
    const away = matchOdds(s, weak, strong);
    expect(o.home).toBeGreaterThan(away.away); // the same tie is easier at home
    const neutral = matchOdds(s, strong, strong, true);
    expect(Math.abs(neutral.home - neutral.away)).toBeLessThanOrEqual(1);
  });
  it('predictions track the final tables, and are renewed each season', () => {
    const s = game();
    const pred = structuredClone(s.predictions!);
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    for (const l of s.world.leagues) {
      const fin = leagueTableOf(s, l.id).map((r) => r.clubId);
      const p = pred.tables[l.id];
      // Spearman rank correlation
      const n = p.length;
      const d2 = p.reduce((a, id, i) => a + (i - fin.indexOf(id)) ** 2, 0);
      expect(1 - (6 * d2) / (n * (n * n - 1)), l.id).toBeGreaterThan(0.3);
    }
    expect(s.inbox.some((m) => m.body.some((b) => b.includes('The pundits had us down for')))).toBe(true);
    startNewSeason(s);
    expect(s.predictions!.season).toBe(seasonLabel(s.year));
  }, 60_000);
});
