import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, startNewSeason, totalMatchdays } from './game';
import { favouriteFor, managerOf, managers, sack } from './managers';
import { applyChance, career, moveTo } from './career';
import { createRng } from './rng';
import { managerReputation } from './nationaljob';

const game = () => newGame({ seed: 77, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('AI managers', () => {
  it('every other club starts with a named manager, and some are out of work', () => {
    const s = game();
    const m = managers(s);
    for (const id of Object.keys(s.clubs)) {
      if (id === 'ash') expect(managerOf(s, id)).toBeUndefined();
      else expect(managerOf(s, id)?.name, id).toBeTruthy();
    }
    expect(Object.values(m.all).filter((x) => !x.clubId).length).toBeGreaterThan(0);
    const reps = Object.keys(s.clubs).filter((id) => id !== 'ash').map((id) => [s.clubs[id].reputation, managerOf(s, id)!.rep]);
    const close = reps.filter(([c, r]) => Math.abs(c - r) <= 20).length;
    expect(close / reps.length).toBeGreaterThan(0.9);
  });

  it('after a season: records kept, sacked managers replaced from the pool over the next weeks', () => {
    const s = game();
    const before = Object.fromEntries(Object.keys(s.clubs).map((id) => [id, managerOf(s, id)?.id]));
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    startNewSeason(s);
    const m = managers(s);
    const kept = Object.keys(s.clubs).filter((id) => managerOf(s, id) && managerOf(s, id)!.id === before[id]);
    expect(kept.some((id) => managerOf(s, id)!.w + managerOf(s, id)!.d + managerOf(s, id)!.l > 0)).toBe(true);
    const vacant = Object.keys(s.clubs).filter((id) => id !== 'ash' && s.clubs[id].league && !m.byClub[id]);
    expect(vacant.length).toBeGreaterThan(0);
    expect([...career(s).vacancies].sort()).toEqual([...vacant].sort());
    for (let i = 0; i < 16; i++) playMatchday(s);
    const still = Object.keys(s.clubs).filter((id) => id !== 'ash' && s.clubs[id].league && !m.byClub[id]);
    expect(still.length).toBeLessThan(vacant.length);
    for (const id of vacant.filter((x) => !still.includes(x))) {
      expect(career(s).vacancies).not.toContain(id);
      expect(managerOf(s, id)!.spells[0].clubId).toBe(id);
    }
    // a sacked manager's spell is closed
    const gone = Object.values(m.all).filter((x) => x.spells.some((sp) => sp.left === 'sacked'));
    expect(gone.length).toBeGreaterThan(0);
  }, 120_000);

  it('taking a job moves its manager to the pool; your old club is filled later', () => {
    const s = game();
    const target = Object.keys(s.clubs).find((id) => id !== 'ash' && s.clubs[id].league)!;
    const mgr = managerOf(s, target)!;
    moveTo(s, createRng(1), target, 'moved');
    expect(mgr.clubId).toBeUndefined();
    expect(managerOf(s, target)).toBeUndefined();
    expect(managerOf(s, 'ash')).toBeUndefined();
    for (let i = 0; i < 20 && !managerOf(s, 'ash'); i++) playMatchday(s);
    expect(managerOf(s, 'ash')).toBeTruthy();
  });

  it('a strong rival makes a job harder to get', () => {
    const s = game();
    const id = Object.keys(s.clubs).filter((x) => x !== 'ash' && s.clubs[x].league).sort((a, b) => Math.abs(s.clubs[a].reputation - managerReputation(s)) - Math.abs(s.clubs[b].reputation - managerReputation(s)))[0];
    sack(s, id);
    for (const x of Object.values(managers(s).all)) if (!x.clubId) x.rep = 10;
    const easy = applyChance(s, id);
    const star = favouriteFor(s, id)!;
    star.rep = s.clubs[id].reputation + 12;
    expect(applyChance(s, id)).toBeLessThan(easy);
  });
});
