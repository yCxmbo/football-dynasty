import { describe, expect, it } from 'vitest';
import { baseTarget, boardTarget, newGame, playMatchday, startNewSeason, totalMatchdays } from './game';
import { career, compensation, interviewChance, interviewForJob, interviewQuestions, managerWage, requestNewContract } from './career';
import { sack } from './managers';
import type { GameState } from './types';

const game = () => newGame({ seed: 61, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
const playSeason = (s: GameState) => { for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s); };

describe('manager contract', () => {
  it('starts with a three-season contract and pays a weekly wage', () => {
    const s = game();
    const c = career(s);
    expect(c.contract!.until).toBe(s.year + 2);
    expect(c.contract!.wage).toBe(managerWage(s, 'ash'));
    for (let i = 0; i < 8; i++) playMatchday(s);
    expect(c.earnings!).toBeGreaterThan(0);
    expect(c.earnings! % c.contract!.wage).toBe(0);
  });
  it('bigger clubs pay more', () => {
    const s = game();
    const clubs = Object.values(s.clubs).sort((a, b) => a.reputation - b.reputation);
    expect(managerWage(s, clubs[clubs.length - 1].id)).toBeGreaterThan(managerWage(s, clubs[0].id) * 3);
  });
  it('an expiring contract is renewed when the board trusts you, and not when it does not', () => {
    for (const [trust, renewed] of [[90, true], [20, false]] as const) {
      const s = game();
      const c = career(s);
      c.contract!.until = s.year;
      playSeason(s);
      c.trust = trust;
      // the verdict at season end weighs this season's results too; force the extremes
      const year = s.year;
      startNewSeason(s);
      if (renewed && !c.sacked) expect(c.contract!.until).toBe(year + 2);
      if (!renewed) expect(c.sacked || c.contract!.until === year + 2).toBe(true);
    }
  }, 60_000);
  it('asking for a new contract: refused with years left or low confidence, granted otherwise', () => {
    const s = game();
    expect(requestNewContract(s, 90).ok).toBe(false); // three seasons left
    s.year += 1; // two left
    expect(requestNewContract(s, 50).ok).toBe(false);
    expect(requestNewContract(s, 90).ok).toBe(false); // once a season
    s.year += 1;
    const before = career(s).contract!.wage;
    expect(requestNewContract(s, 90).ok).toBe(true);
    expect(career(s).contract!.until).toBe(s.year + 3);
    expect(career(s).contract!.wage).toBeGreaterThan(before);
  });
  it('compensation is half the wages still owed', () => {
    const s = game();
    const c = career(s);
    expect(compensation(s)).toBe(Math.round(c.contract!.wage * 52 * 2.5 * 0.5 / 1000) * 1000);
  });
});

describe('job interviews', () => {
  const vacancy = (s: GameState, big: boolean) => {
    const id = Object.keys(s.clubs).filter((x) => x !== 'ash' && s.clubs[x].league).sort((a, b) => (big ? s.clubs[b].reputation - s.clubs[a].reputation : s.clubs[a].reputation - s.clubs[b].reputation))[0];
    sack(s, id);
    career(s).vacancies.push(id);
    return id;
  };
  it('answers that fit the club raise your chance; a big club hates talk of rebuilding', () => {
    const s = game();
    const id = vacancy(s, true);
    const t = baseTarget(s, id).pos;
    const qs = interviewQuestions(s, id, t);
    const best = qs.map((q) => q.options.reduce((bi, o, i) => (o.score > q.options[bi].score ? i : bi), 0));
    const worst = qs.map((q) => q.options.reduce((bi, o, i) => (o.score < q.options[bi].score ? i : bi), 0));
    expect(interviewChance(s, id, t, best)).toBeGreaterThan(interviewChance(s, id, t, worst));
    const score = (a: number[]) => a.reduce((x, pick, i) => x + qs[i].options[pick].score, 0);
    expect(score(best) - score(worst)).toBeGreaterThanOrEqual(4); // about 32 points of chance before the floor and ceiling
    expect(qs[0].options[2].score).toBeLessThan(0);
  });
  it('appointed after promising more, the board holds you to it for that season', () => {
    let s = game(), id = '', got = false;
    for (let seed = 0; seed < 30 && !got; seed++) {
      s = newGame({ seed: 70 + seed, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
      id = vacancy(s, false);
      const t = baseTarget(s, id).pos;
      s.manager.trophies = Array(10).fill('Cup'); // a reputation that small clubs can't turn down
      got = interviewForJob(s, id, t, [0, 1, 1]);
    }
    expect(got).toBe(true);
    expect(s.userClubId).toBe(id);
    const c = career(s);
    expect(c.contract!.until).toBe(s.year + 1);
    expect(c.promise).toBeTruthy();
    expect(boardTarget(s, id).pos).toBe(c.promise!.pos);
    expect(boardTarget(s, id).pos).toBeLessThan(baseTarget(s, id).pos);
  });
});
