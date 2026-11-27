import { describe, expect, it } from 'vitest';
import { advanceDay, newGame, todaysFixture } from './game';
import { answerPress, pendingPress, skipPress } from './press';
import { fansOf } from './fans';

const game = () => newGame({ seed: 31, userClubId: 'ash', managerName: 'T', currency: 'EUR' });

describe('press conferences', () => {
  it('a pre-match conference comes the day before a competitive match; answers have effects; then post-match', () => {
    const s = game();
    let guard = 0;
    while (!(s.press && s.press.kind === 'pre') && guard++ < 80) advanceDay(s);
    const c = pendingPress(s)!;
    expect(c.kind).toBe('pre');
    expect(c.questions.length).toBeGreaterThanOrEqual(2);
    expect(s.inbox.some((m) => m.link?.screen === 'press')).toBe(true);
    const trust = s.career!.trust, mood = fansOf(s).mood;
    for (let i = 0; i < c.questions.length; i++) expect(answerPress(s, i, 0)).toBeTruthy();
    expect(answerPress(s, 0, 1)).toBeNull(); // one answer each
    expect(s.press!.done).toBe(true);
    const board = c.questions.reduce((acc, q) => acc + (q.options[0].effect.board ?? 0), 0);
    const fans = c.questions.reduce((acc, q) => acc + (q.options[0].effect.fans ?? 0), 0);
    expect(s.career!.trust).toBeCloseTo(Math.max(0, Math.min(100, trust + board)), 5);
    expect(fansOf(s).mood).toBeCloseTo(Math.max(0, Math.min(100, mood + fans)), 5);
    guard = 0;
    while (!todaysFixture(s) && guard++ < 10) advanceDay(s);
    advanceDay(s); // play the match
    const post = pendingPress(s);
    if (post) { expect(post.kind).toBe('post'); skipPress(s); expect(s.press!.skipped).toBe(true); }
  });
});
