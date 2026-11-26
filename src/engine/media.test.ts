import { describe, expect, it } from 'vitest';
import { newGame, playMatchday, squadOf, startUserMatch, userFixture } from './game';
import { talkDue, teamTalk, tick } from './live';
import { answer, weeklyMood } from './media';
import { createRng } from './rng';
import type { GameState } from './types';

const game = () => newGame({ seed: 41, userClubId: 'ash', managerName: 'T', currency: 'EUR' });
const toUserMatch = (s: GameState) => { while (!userFixture(s)) playMatchday(s); };

describe('team talks', () => {
  it('the match waits for a talk at kickoff and half-time; the talk changes the side and shows in the commentary', () => {
    const s = game();
    toUserMatch(s);
    const lm = startUserMatch(s)!;
    const key = lm.home.user ? 'home' : 'away';
    expect(talkDue(lm, key)).toBe('pre');
    const before = lm[key].boost;
    teamTalk(lm, key, 'encourage');
    expect(lm[key].boost).not.toBe(before);
    expect(lm.events.some((e) => e.text.startsWith('Team talk'))).toBe(true);
    expect(talkDue(lm, key)).toBeNull();
    while (lm.minute < 45) tick(lm);
    expect(talkDue(lm, key)).toBe('ht');
    teamTalk(lm, key, 'skip');
    expect(talkDue(lm, key)).toBeNull();
  });
});

describe('press and player requests', () => {
  it('an unhappy regular who is not playing asks to leave; promising games and breaking the promise has consequences', () => {
    const s = game();
    for (let i = 0; i < 16; i++) playMatchday(s);
    const p = squadOf(s, 'ash').filter((x) => x.squad === 'First team').sort((a, b) => b.ability - a.ability)[3];
    p.morale = 'low'; p.current.apps = 0;
    for (let w = 0; w < 30 && !s.inbox.some((m) => m.choice?.question === 'leave'); w++) weeklyMood(s, createRng(w), 10);
    const msg = s.inbox.find((m) => m.choice?.question === 'leave')!;
    expect(msg).toBeTruthy();
    const who = s.players[msg.choice!.playerId!];
    expect(answer(s, msg.id, 0)).toMatch(/expects/);
    expect(who.morale).toBe('ok');
    expect(s.promises!.length).toBe(1);
    expect(answer(s, msg.id, 1)).toBeNull(); // only one answer
    // six weeks on without games: the promise is broken
    weeklyMood(s, createRng(99), s.promises![0].byWeek);
    expect(who.morale).toBe('low');
    expect(s.transferListed).toContain(who.id);
    expect(s.inbox[0].subject).toMatch(/broke your promise/);
  });

  it('press answers change morale or board trust', () => {
    const s = game();
    s.inbox.unshift({ id: 'q1', category: 'media', from: 'Press conference', date: '', subject: 'Press', body: [], unread: true, choice: { kind: 'press', question: 'pressure', options: ['a', 'b', 'c'] } });
    const trust = s.career!.trust;
    answer(s, 'q1', 0);
    expect(s.career!.trust).toBe(trust + 3);
    expect(s.inbox[0].body.join(' ')).toMatch(/You answered/);
  });
});
