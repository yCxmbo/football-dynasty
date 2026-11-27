import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, startNewSeason, totalMatchdays } from './game';
import { askBoard, judgeVision, makeVision, maybeTakeover, renewVisionIfDone, visionOf } from './vision';
import { realWorld } from '../data/real';
import type { Rng } from './rng';

const real = (club: string) => newGame({ seed: 191, userClubId: club, managerName: 'T', currency: 'EUR', world: realWorld(), source: 'real' });

describe('club vision', () => {
  it('fits the club: giants must win the league, second-tier clubs go up', () => {
    const s = real('eng-everton');
    expect(makeVision(s, 'eng-liverpool').goals[0]).toMatchObject({ kind: 'league', pos: 1 });
    expect(makeVision(s, 'eng-leicester').goals[0].text).toMatch(/promotion/);
    expect(visionOf(s).goals.length).toBe(3);
  });
  it("is judged at season end into the board's trust, with a report", () => {
    const s = newGame({ seed: 192, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const v = visionOf(s);
    v.goals = v.goals.filter((g) => g.kind !== 'youth').concat({ kind: 'youth', text: 'Give young players a chance' });
    for (let i = 0, n = totalMatchdays(s); i < n; i++) playMatchday(s);
    const kids = squadOf(s, 'ash').filter((p) => p.age <= 21).slice(0, 2);
    for (const k of kids) k.current.apps = Math.max(k.current.apps, 12);
    const j = judgeVision(s);
    expect(j.lines.length).toBe(visionOf(s).goals.length);
    expect(visionOf(s).goals.find((g) => g.kind === 'youth')!.status).toBe('met');
    startNewSeason(s);
    expect(s.inbox.some((m) => m.subject.startsWith('Club vision'))).toBe(true);
  }, 60_000);
  it('a met league objective brings a new, tougher vision', () => {
    const s = newGame({ seed: 193, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const v = visionOf(s);
    v.goals[0].status = 'met';
    expect(renewVisionIfDone(s)).toBe(true);
    expect(visionOf(s).set).toBe(s.year + 1);
  });
  it('requests: once a season, only with trust, and they do something', () => {
    const s = newGame({ seed: 194, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const c = s.clubs.ash;
    c.balance = 100_000_000;
    expect(askBoard(s, 'transfer', 40).ok).toBe(false);
    s.vision!.asked = undefined;
    const before = c.transferBudget;
    expect(askBoard(s, 'transfer', 80).ok).toBe(true);
    expect(c.transferBudget).toBeGreaterThan(before);
    expect(askBoard(s, 'wages', 80).text).toMatch(/already/);
  });
  it('takeovers change the money and the vision', () => {
    const s = newGame({ seed: 195, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
    const always = { chance: () => true, pick: <T,>(a: T[]) => a[0], next: () => 0, int: (a: number) => a, normal: () => 0, weighted: <T,>(a: T[]) => a[0], state: () => 0 } as unknown as Rng;
    const budget = s.clubs.ash.transferBudget;
    const news = maybeTakeover(s, always)!;
    expect(news[0]).toMatch(/taken over/);
    expect(s.clubs.ash.transferBudget).toBeGreaterThan(budget);
    expect(visionOf(s).owners).toMatch(/ambitious/);
  });
});
