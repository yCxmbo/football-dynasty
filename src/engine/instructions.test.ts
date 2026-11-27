import { describe, expect, it } from 'vitest';
import { aiInstructions, DEFAULT_INSTRUCTIONS, instructionEffects, type Instructions } from './instructions';
import { newGame, setInstructions, squadOf, startUserMatch } from './game';
import { createLive, runToEnd } from './live';
import type { Player } from './types';

const game = () => newGame({ seed: 121, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('instruction effects', () => {
  it('each choice trades something', () => {
    const att = instructionEffects({ ...DEFAULT_INSTRUCTIONS, mentality: 'attacking' });
    expect(att.atk).toBeGreaterThan(1); expect(att.def).toBeLessThan(1);
    const press = instructionEffects({ ...DEFAULT_INSTRUCTIONS, press: 'high' });
    expect(press.oppMid).toBeLessThan(1); expect(press.fatigue).toBeGreaterThan(1);
    const high = (opp: Instructions) => instructionEffects({ ...DEFAULT_INSTRUCTIONS, line: 'high' }, opp).def;
    expect(high({ ...DEFAULT_INSTRUCTIONS, tempo: 'fast' })).toBeLessThan(high(DEFAULT_INSTRUCTIONS));
  });
  it('computer sides chase the game when behind and protect a late lead', () => {
    expect(aiInstructions(60, -1, 1).mentality).toBe('attacking');
    expect(aiInstructions(80, 1, 1).mentality).toBe('defensive');
    expect(aiInstructions(10, 0, 1)).toEqual(DEFAULT_INSTRUCTIONS);
  });
});

describe('in matches', () => {
  const sides = (s: ReturnType<typeof game>) => {
    const ft = (id: string) => squadOf(s, id).filter((p) => p.squad === 'First team');
    const xi = (l: Player[]) => [l.find((p) => p.pos === 'GK')!, ...l.filter((p) => p.pos !== 'GK').slice(0, 10)];
    const ids = Object.keys(s.clubs).filter((id) => id !== 'ash');
    return { a: xi(ft('ash')), b: xi(ft(ids[0])) };
  };
  const run = (s: ReturnType<typeof game>, instr: Instructions, n = 120) => {
    const { a, b } = sides(s);
    let goals = 0, cond = 0;
    for (let i = 0; i < n; i++) {
      const lm = createLive(1000 + i, { xi: a, bench: [], formation: '4-3-3', name: 'A', user: true, instr }, { xi: b, bench: [], formation: '4-3-3', name: 'B', user: true }, 'Ground');
      runToEnd(lm);
      goals += lm.score[0] + lm.score[1];
      cond += a.reduce((x, p) => x + lm.players[p.id].condition, 0) / a.length;
    }
    return { goals: goals / n, cond: cond / n };
  };
  it('open, fast football makes for more goals; a high press tires the side', () => {
    const s = game();
    const open = run(s, { ...DEFAULT_INSTRUCTIONS, mentality: 'attacking', press: 'medium', tempo: 'fast', width: 'normal', line: 'high', passing: 'direct' });
    const shut = run(s, { ...DEFAULT_INSTRUCTIONS, mentality: 'defensive', press: 'low', tempo: 'slow', width: 'narrow', line: 'deep', block: 'low', onWin: 'hold' });
    expect(open.goals).toBeGreaterThan(shut.goals * 1.15);
    const press = run(s, { ...DEFAULT_INSTRUCTIONS, press: 'high' }, 30), calm = run(s, { ...DEFAULT_INSTRUCTIONS, press: 'low' }, 30);
    expect(press.cond).toBeLessThan(calm.cond - 3);
  });
  it('your saved instructions go into your matches', () => {
    const s = game();
    setInstructions(s, { press: 'high', width: 'wide' });
    const lm = startUserMatch(s)!;
    const mine = lm.home.user ? lm.home : lm.away;
    expect(mine.instr).toMatchObject({ press: 'high', width: 'wide', mentality: 'balanced' });
  });
});
