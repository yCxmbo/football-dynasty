import { describe, expect, it } from 'vitest';
import { nextWindow, openWindow, windowsFor } from './windows';
import type { GameState } from './types';

const at = (date: string, year = 2025) => ({ today: date, year, matchday: 1, calendar: [{ date: '2025-08-09' }, { date: '2026-05-20' }] } as unknown as GameState);

describe('transfer windows by country', () => {
  it('uses each country\'s real dates', () => {
    expect(openWindow(at('2025-08-20'), 'eng')?.name).toBe('Summer');
    expect(openWindow(at('2025-09-02'), 'eng')).toBeUndefined();
    expect(openWindow(at('2025-09-15'), 'por')?.name).toBe('Summer'); // Portugal shuts later
    expect(openWindow(at('2025-08-25'), 'usa')).toBeUndefined(); // MLS secondary window closed on 21 August
    expect(openWindow(at('2026-03-15'), 'usa')?.label).toBe('primary window');
    expect(openWindow(at('2025-12-20'), 'mex')?.name).toBe('Winter'); // Mexico's winter window starts in December
    expect(openWindow(at('2026-01-20'), 'esp')?.name).toBe('Winter');
    expect(openWindow(at('2026-02-10'), 'esp')).toBeUndefined();
  });
  it('the next window, and fictional countries use the common dates', () => {
    expect(nextWindow(at('2025-10-01'), 'ger')?.from).toBe('2026-01-01');
    expect(windowsFor('xyz', 2025).map((w) => [w.from, w.to])).toEqual([['2025-06-16', '2025-09-01'], ['2026-01-01', '2026-02-02']]);
  });
  it('between seasons the summer window is open', () => {
    const s = { ...at('2026-06-01'), matchday: 3 } as GameState;
    expect(openWindow(s, 'eng')?.name).toBe('Summer');
  });
});
