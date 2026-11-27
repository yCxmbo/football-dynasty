import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, startNewSeason, totalMatchdays } from './game';
import { developStep, positionLevel, positionTrainingWeek } from './training';
import { ROLE_BY_ID } from './roles';
import { createRng } from './rng';
import { seasonLabel } from './types';

const game = () => newGame({ seed: 171, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('training and development', () => {
  it('a role focus puts growth into that role\'s key attributes', () => {
    const s = game();
    const p = squadOf(s, 'ash').filter((x) => x.age <= 21 && x.potential - x.ability > 30).sort((a, b) => b.potential - a.potential)[0];
    p.progress = {};
    const rng = createRng(3);
    for (let i = 0; i < 12; i++) developStep(rng, p, 0.3, 1.5, 'role:tf');
    const keys = new Set(ROLE_BY_ID.tf.keys);
    const gained = Object.entries(p.progress).reduce((a, [k, v]) => a + (keys.has(k) ? v : 0), 0);
    const total = Object.values(p.progress).reduce((a, v) => a + v, 0);
    expect(total).toBeGreaterThan(0);
    expect(gained / total).toBeGreaterThan(0.35);
  });
  it('learning a position climbs level by level to accomplished, then stops', () => {
    const s = game();
    const p = squadOf(s, 'ash').find((x) => x.pos === 'CB' && positionLevel(x, 'DM') !== 'accomplished')!;
    delete p.positions.DM;
    (s.training.learn ??= {})[p.id] = { pos: 'DM', progress: 0 };
    const seen = new Set<string>();
    for (let w = 0; w < 60 && s.training.learn[p.id]; w++) { positionTrainingWeek(s); seen.add(positionLevel(p, 'DM')); }
    expect(positionLevel(p, 'DM')).toBe('accomplished');
    expect([...seen]).toEqual(expect.arrayContaining(['unconvincing', 'competent', 'accomplished']));
    expect(s.training.learn[p.id]).toBeUndefined();
  });
  it('your players keep a development history, one entry per season', () => {
    const s = game();
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    startNewSeason(s);
    const mine = squadOf(s, 'ash').filter((p) => p.squad === 'First team');
    expect(mine.some((p) => p.history?.length === 1 && p.history[0].season === seasonLabel(s.year))).toBe(true);
    const other = squadOf(s, Object.keys(s.clubs).find((id) => id !== 'ash')!);
    expect(other.every((p) => !p.history)).toBe(true);
  }, 60_000);
});
