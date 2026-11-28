/* Keyboard shortcuts: a pure mapping from keys to actions (App runs them). "g" then a letter goes to a screen. */
import type { Screen } from './shared';

export type ShortcutAction = { kind: 'continue' } | { kind: 'sim' } | { kind: 'search' } | { kind: 'back' } | { kind: 'help' } | { kind: 'go'; screen: Screen } | { kind: 'goPending' };

export const GO_KEYS: Record<string, [Screen, string]> = {
  h: ['home', 'Home'], i: ['inbox', 'Inbox'], s: ['squad', 'Squad'], t: ['tactics', 'Tactics'], f: ['fixtures', 'Fixtures'],
  c: ['calendar', 'Calendar'], l: ['table', 'Competitions'], r: ['transfers', 'Transfers'], m: ['medical', 'Medical'], n: ['finances', 'Finances'],
};

export const SHORTCUT_HELP: Array<[string, string]> = [
  ['Space', 'Continue (or play the match today)'],
  ['S', 'Sim to your next match'],
  ['/', 'Search players'],
  ['Esc', 'Back'],
  ...Object.entries(GO_KEYS).map(([k, [, l]]) => [`G then ${k.toUpperCase()}`, `Go to ${l}`] as [string, string]),
  ['?', 'Show this list'],
];

/** What a key press does. `pendingG`: "g" was pressed just before. `typing`: focus is in a text field. */
export function shortcutAction(key: string, opts: { pendingG: boolean; typing: boolean; modifier: boolean }): ShortcutAction | null {
  if (opts.modifier) return null;
  if (opts.typing) return null;
  const k = key.length === 1 ? key.toLowerCase() : key;
  if (opts.pendingG) { const target = GO_KEYS[k]; return target ? { kind: 'go', screen: target[0] } : null; }
  if (k === 'g') return { kind: 'goPending' };
  if (k === ' ' || k === 'Spacebar') return { kind: 'continue' };
  if (k === 's') return { kind: 'sim' };
  if (k === '/') return { kind: 'search' };
  if (k === '?') return { kind: 'help' };
  if (k === 'Escape') return { kind: 'back' };
  return null;
}

/** Whether a key event's target is somewhere you type (so shortcuts stay out of the way). */
export function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t || !t.tagName) return false;
  const tag = t.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
}
