import { describe, expect, it } from 'vitest';
import { applyPreset, bestLineup, newGame, playMatchday, setInstructions, setRole, setTactics, squadOf, startUserMatch, useTactic } from './game';
import { FORMATIONS, slotsOf, type Formation } from './match';
import { bestRoles, fixRoles, instrEffect, ROLES, roleStars, slotShape } from './roles';
import { familiarity, formationFamiliarity, STYLE_PRESETS, presetTactic, tacticsOf } from './tactics';
import { instructionEffects, DEFAULT_INSTRUCTIONS } from './instructions';
import { changeTactic, createLive, runToEnd } from './live';
import { aiFormation } from './managers';

const game = () => newGame({ seed: 141, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('formations and roles', () => {
  it('every formation has eleven slots, one keeper, and valid default roles', () => {
    for (const f of Object.keys(FORMATIONS) as Formation[]) {
      const slots = slotsOf(f);
      expect(slots.length, f).toBe(11);
      expect(slots.filter((s) => s === 'GK').length).toBe(1);
      fixRoles(f).forEach((r, i) => expect(ROLES.find((x) => x.id === r.role)!.slots).toContain(slots[i]));
    }
  });
  it('duties push a player back or forward; shares always add up to one', () => {
    for (const r of ROLES) for (const d of r.duties) {
      const w = slotShape({ role: r.id, duty: d }).w;
      expect(w[0] + w[1] + w[2]).toBeCloseTo(1, 5);
    }
    const s = slotShape({ role: 'cm', duty: 'S' }), a = slotShape({ role: 'cm', duty: 'A' }), d = slotShape({ role: 'cm', duty: 'D' });
    expect(a.w[2]).toBeGreaterThan(s.w[2]); expect(d.w[0]).toBeGreaterThan(s.w[0]);
    expect(a.scorer).toBeGreaterThan(d.scorer);
  });
  it("suitability follows the role's key attributes", () => {
    const p = { attributes: { Heading: 19, Strength: 19, 'Jumping Reach': 19, Bravery: 18, Finishing: 14, Passing: 5, Vision: 5, Technique: 6, 'First Touch': 7, 'Off the Ball': 8, Dribbling: 5 } as Record<string, number> };
    expect(roleStars(p, 'tf')).toBeGreaterThan(roleStars(p, 'f9') + 2);
  });
  it('computer-run sides pick roles that suit their players, and each manager has his own shape', () => {
    const s = game();
    const ids = Object.keys(s.clubs).filter((id) => id !== 'ash');
    expect(new Set(ids.map((id) => aiFormation(s, id))).size).toBeGreaterThan(4);
    const xi = squadOf(s, ids[0]).filter((p) => p.squad === 'First team').slice(0, 11);
    const roles = bestRoles('4-3-3', xi);
    expect(roles.length).toBe(11);
    roles.forEach((r, i) => expect(ROLES.find((x) => x.id === r.role)!.slots).toContain(slotsOf('4-3-3')[i]));
  });
});

describe('instructions in three phases', () => {
  it('counter-attacks punish a high line; direct play beats a high press; patience struggles against a low block', () => {
    const counter = instructionEffects({ onWin: 'counter' }, { line: 'high' }).atk;
    expect(counter).toBeGreaterThan(instructionEffects({ onWin: 'counter' }, { line: 'deep' }).atk);
    expect(instructionEffects({ line: 'high' }, { onWin: 'counter' }).def).toBeLessThan(instructionEffects({ line: 'high' }).def);
    expect(instructionEffects({ passing: 'direct' }, { press: 'high' }).atk).toBeGreaterThan(instructionEffects({ passing: 'direct' }).atk);
    expect(instructionEffects({ finalThird: 'patient' }, { block: 'low' }).atk).toBeLessThan(instructionEffects({ finalThird: 'patient' }).atk);
  });
});

describe('tactics, presets and familiarity', () => {
  it('three tactics; presets build valid tactics; switching applies shape, roles and instructions', () => {
    const s = game();
    const ts = tacticsOf(s);
    expect(ts.slots.length).toBe(3);
    for (const p of STYLE_PRESETS) {
      const t = presetTactic(p);
      t.roles.forEach((r, i) => expect(ROLES.find((x) => x.id === r.role)!.slots, `${p.id} ${i}`).toContain(slotsOf(t.formation)[i]));
    }
    applyPreset(s, 'block');
    expect(s.formation).toBe('5-4-1');
    expect(s.instructions!.block).toBe('low');
    expect(s.lineup.length).toBe(11);
    useTactic(s, 2);
    expect(s.formation).toBe(tacticsOf(s).slots[2].formation);
    useTactic(s, 0);
    expect(s.formation).toBe('5-4-1');
  });
  it('a new shape starts unfamiliar and is learned by playing it; big instruction changes cost familiarity', () => {
    const s = game();
    const start = familiarity(s);
    setTactics(s, '3-4-3', bestLineup(s, '3-4-3'));
    expect(formationFamiliarity(s, '3-4-3')).toBe(25);
    const fresh = familiarity(s);
    expect(fresh).toBeLessThan(start);
    for (let i = 0; i < 6; i++) playMatchday(s);
    expect(familiarity(s)).toBeGreaterThan(fresh);
    const before = familiarity(s);
    setInstructions(s, { passing: 'direct', tempo: 'fast', width: 'wide', press: 'high' });
    expect(familiarity(s)).toBeLessThan(before);
  });
  it('your roles and tactic go into your matches, and a tactic can be changed mid-match', () => {
    const s = game();
    setRole(s, 9, { role: 'p', duty: 'A' });
    const lm = startUserMatch(s)!;
    const mine = lm.home.user ? lm.home : lm.away;
    expect(mine.roles![9]).toEqual({ role: 'p', duty: 'A' });
    const key = lm.home.user ? 'home' : 'away';
    changeTactic(lm, key, { formation: '5-4-1', instr: { ...DEFAULT_INSTRUCTIONS, block: 'low' } });
    expect(lm[key].formation).toBe('5-4-1');
    expect(lm[key].xi.filter(Boolean).length).toBe(11);
    runToEnd(lm);
    expect(lm.done).toBe(true);
  });
  it('a side down to ten keeps a gap in attack when it changes shape', () => {
    const s = game();
    const ft = squadOf(s, 'ash').filter((p) => p.squad === 'First team');
    const xi = [ft.find((p) => p.pos === 'GK')!, ...ft.filter((p) => p.pos !== 'GK').slice(0, 10)];
    const lm = createLive(5, { xi, bench: [], formation: '4-3-3', name: 'A' }, { xi, bench: [], formation: '4-3-3', name: 'B' }, 'Ground');
    lm.home.xi[9] = null;
    changeTactic(lm, 'home', { formation: '4-4-2' });
    expect(lm.home.xi.filter(Boolean).length).toBe(10);
    expect(lm.home.xi[0]).toBe(xi[0].id);
    expect(['LM', 'RM', 'ST']).toContain(slotsOf('4-4-2')[lm.home.xi.indexOf(null)]);
  });
});

describe('player instructions', () => {
  it('movement and shooting change his share of the play; effects depend on his attributes', () => {
    const base = slotShape({ role: 'cm', duty: 'S' });
    const fwd = slotShape({ role: 'cm', duty: 'S', pi: { move: 'forward', shoot: 'more' } });
    expect(fwd.w[2]).toBeGreaterThan(base.w[2]);
    expect(fwd.scorer).toBeGreaterThan(base.scorer);
    const good = instrEffect({ shoot: 'more', pass: 'riskier' }, { 'Long Shots': 18, Finishing: 17, Vision: 18, Passing: 17 });
    const poor = instrEffect({ shoot: 'more', pass: 'riskier' }, { 'Long Shots': 6, Finishing: 7, Vision: 6, Passing: 8 });
    expect(good.att).toBeGreaterThan(1);
    expect(poor.att).toBeLessThan(1);
    expect(instrEffect({ pass: 'safer' }, {}).mid).toBeGreaterThan(1);
  });
  it('instructions survive role fixes and reach the match', () => {
    const s = game();
    setRole(s, 9, { role: 'af', duty: 'A', pi: { shoot: 'more', press: 'more' } });
    expect(fixRoles(s.formation, s.roles)[9].pi).toEqual({ shoot: 'more', press: 'more' });
    const lm = startUserMatch(s)!;
    const mine = lm.home.user ? lm.home : lm.away;
    expect(mine.roles![9].pi).toEqual({ shoot: 'more', press: 'more' });
    runToEnd(lm);
    expect(lm.done).toBe(true);
  });
});
