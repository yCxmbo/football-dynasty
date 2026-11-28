import { describe, expect, it } from 'vitest';
import { compareIds, MAX_COMPARE, onCompareChange, setCompare, toggleCompare } from './compareStore';

describe('compare selection', () => {
  it('keeps up to three, drops the oldest, toggles off, and notifies', () => {
    setCompare([]);
    let calls = 0;
    const off = onCompareChange(() => calls++);
    ['a', 'b', 'c', 'd'].forEach(toggleCompare);
    expect(compareIds()).toEqual(['b', 'c', 'd']);
    expect(compareIds().length).toBe(MAX_COMPARE);
    toggleCompare('c');
    expect(compareIds()).toEqual(['b', 'd']);
    expect(calls).toBe(5);
    off();
  });
});
