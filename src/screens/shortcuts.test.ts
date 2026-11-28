import { describe, expect, it } from 'vitest';
import { shortcutAction } from './shortcuts';

const o = (x: Partial<{ pendingG: boolean; typing: boolean; modifier: boolean }> = {}) => ({ pendingG: false, typing: false, modifier: false, ...x });
describe('shortcuts', () => {
  it('maps keys to actions and stays out of text fields and modified keys', () => {
    expect(shortcutAction(' ', o())).toEqual({ kind: 'continue' });
    expect(shortcutAction('S', o())).toEqual({ kind: 'sim' });
    expect(shortcutAction('/', o())).toEqual({ kind: 'search' });
    expect(shortcutAction('?', o())).toEqual({ kind: 'help' });
    expect(shortcutAction('Escape', o())).toEqual({ kind: 'back' });
    expect(shortcutAction('g', o())).toEqual({ kind: 'goPending' });
    expect(shortcutAction('t', o({ pendingG: true }))).toEqual({ kind: 'go', screen: 'tactics' });
    expect(shortcutAction('z', o({ pendingG: true }))).toBeNull();
    expect(shortcutAction('s', o({ typing: true }))).toBeNull();
    expect(shortcutAction('s', o({ modifier: true }))).toBeNull();
  });
});
