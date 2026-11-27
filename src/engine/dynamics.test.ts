import { describe, expect, it } from 'vitest';
import { newGame, squadOf } from './game';
import { atmosphere, atmosphereFactor, canMentor, groups, MAX_MENTORING, squadMoods, startMentoring, weeklyDynamics } from './dynamics';

const game = () => newGame({ seed: 161, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
const ft = (s: ReturnType<typeof game>) => squadOf(s, 'ash').filter((p) => p.squad === 'First team');

describe('squad dynamics', () => {
  it('ranks the dressing room: three leaders, the captain among the most influential', () => {
    const s = game();
    const moods = squadMoods(s);
    expect(moods.length).toBe(ft(s).length);
    expect(moods.filter((m) => m.tier === 'Team leader').length).toBe(3);
    const young = ft(s).sort((a, b) => a.age - b.age)[0];
    for (const p of ft(s)) p.captain = false;
    young.captain = true; young.attributes.Leadership = 20;
    expect(squadMoods(s).find((m) => m.id === young.id)!.tier).not.toBe('Other');
  });
  it('moods come with reasons, and add up to the atmosphere', () => {
    const s = game();
    const p = ft(s)[0];
    s.transferListed.push(p.id); p.morale = 'low';
    const m = squadMoods(s).find((x) => x.id === p.id)!;
    expect(m.reasons).toEqual(expect.arrayContaining(['Transfer-listed', 'Low morale']));
    expect(m.label).toBe('Unhappy');
    for (const q of ft(s)) q.morale = 'high';
    s.transferListed = [];
    const good = atmosphere(s);
    for (const q of ft(s)) q.morale = 'low';
    const bad = atmosphere(s);
    expect(good).toBeGreaterThan(60); expect(bad).toBeLessThan(40);
    expect(atmosphereFactor(good)).toBeGreaterThan(1); expect(atmosphereFactor(bad)).toBeLessThan(1);
    expect(groups(s).every((g) => g.members.length >= 3)).toBe(true);
  });
  it('mentoring: rules, development and character rub off', () => {
    const s = game();
    const all = squadOf(s, 'ash');
    const mentor = all.filter((p) => p.age >= 26 && p.squad === 'First team').sort((a, b) => b.hidden.professionalism - a.hidden.professionalism)[0];
    const kid = all.filter((p) => p.age <= 21 && p.potential - p.ability > 25).sort((a, b) => a.hidden.professionalism - b.hidden.professionalism)[0];
    expect(canMentor(s, kid.id, mentor.id)).toMatch(/26 or older|21 or under/);
    expect(startMentoring(s, mentor.id, kid.id)).toBeNull();
    expect(startMentoring(s, mentor.id, kid.id)).toMatch(/already/);
    const others = all.filter((p) => p.age >= 26 && p.squad === 'First team' && p.id !== mentor.id);
    const kids = all.filter((p) => p.age <= 21 && p.id !== kid.id);
    for (let i = 0; i < MAX_MENTORING - 1; i++) startMentoring(s, others[i].id, kids[i].id);
    expect(canMentor(s, others[5].id, kids[5].id)).toMatch(/up to 3/);
    const ab = kid.ability, pro = kid.hidden.professionalism;
    for (let w = 1; w <= 40; w++) weeklyDynamics(s, w);
    expect(kid.ability).toBeGreaterThan(ab);
    expect(kid.hidden.professionalism).toBeGreaterThanOrEqual(pro);
  });
  it('an unhappy team leader spreads it', () => {
    const s = game();
    const leader = squadMoods(s).find((m) => m.tier === 'Team leader')!;
    const p = s.players[leader.id];
    p.morale = 'low'; s.transferListed.push(p.id);
    for (const q of ft(s)) if (q.id !== p.id) q.morale = 'high';
    const before = ft(s).filter((q) => q.morale === 'high').length;
    for (let w = 1; w <= 30; w++) { p.morale = 'low'; weeklyDynamics(s, w); }
    expect(ft(s).filter((q) => q.morale === 'high').length).toBeLessThan(before);
  });
});
