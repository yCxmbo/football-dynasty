import { describe, expect, it } from 'vitest';
import { newGame, nextUserFixture, squadOf } from './game';
import { FORMATIONS, ROLE } from './match';
import { oppositionReport, planBoost } from './opposition';

const game = () => newGame({ seed: 91, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('opposition report', () => {
  it('covers the next opponent: eleven, odds, a valid formation, and a small edge for following it', () => {
    const s = game();
    const f = s.fixtures.filter((x) => (x.homeId === 'ash' || x.awayId === 'ash') && x.comp !== 'friendly').sort((a, b) => a.matchday - b.matchday)[0];
    const r = oppositionReport(s, f)!;
    expect(r.oppId).toBe(f.homeId === 'ash' ? f.awayId : f.homeId);
    expect(r.xi.length).toBe(11);
    expect(r.odds.win + r.odds.draw + r.odds.loss).toBe(100);
    expect(Object.keys(FORMATIONS)).toContain(r.suggested);
    expect(r.advice.length).toBeGreaterThan(0);
    s.formation = r.suggested;
    const again = oppositionReport(s, f)!;
    s.formation = again.suggested;
    expect(planBoost(s, f)).toBe(1.015);
    s.formation = (Object.keys(FORMATIONS) as Array<keyof typeof FORMATIONS>).find((x) => x !== again.suggested)!;
    if (oppositionReport(s, f)!.suggested !== s.formation) expect(planBoost(s, f)).toBe(1);
  });
  it('spots a weak side and says go at it', () => {
    const s = game();
    const f = nextUserFixture(s)!;
    const opp = f.homeId === 'ash' ? f.awayId : f.homeId;
    // (weak defenders alone just get replaced by midfielders playing out of position)
    for (const p of squadOf(s, opp)) if (ROLE[p.pos] !== 'att') p.ability = 30;
    const r = oppositionReport(s, f)!;
    expect(r.edges.attack).toBeGreaterThan(10);
    expect(['4-3-3', '4-4-2', '3-5-2']).toContain(r.suggested);
    expect(r.advice[0]).toMatch(/weak link|win the midfield/);
  });
  it('warns about dangerous forwards and absentees', () => {
    const s = game();
    const f = nextUserFixture(s)!;
    const opp = f.homeId === 'ash' ? f.awayId : f.homeId;
    for (const p of squadOf(s, opp)) if (ROLE[p.pos] === 'att') p.ability = 199;
    const star = squadOf(s, opp).filter((p) => p.squad === 'First team').sort((a, b) => b.value - a.value)[0];
    star.injuredFor = 3;
    const r = oppositionReport(s, f)!;
    expect(r.edges.defence).toBeLessThan(-8);
    expect(r.suggested).toBe('4-2-3-1');
    expect(r.missing.join(' ')).toContain(star.name);
  });
});
