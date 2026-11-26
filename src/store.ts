import { useCallback, useEffect, useRef, useState } from 'react';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { migrate } from './engine/game';
import type { Currency, GameState } from './engine/types';

const SAVE_KEY = 'football-dynasty:save:v1';
const THEME_KEY = 'football-dynasty:theme';

/** Saves are compressed (lz-string) to stay well inside the browser's ~5 MB storage limit. */
function readRaw(): string | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  return raw.startsWith('{') ? raw : decompressFromUTF16(raw);
}

/** True when an older, incompatible save exists (before divisions and cups). */
export function hasOldSave() {
  try { const raw = readRaw(); return !!raw && (JSON.parse(raw) as { version?: number }).version !== 3; } catch { return false; }
}

export function loadGame(): GameState | null {
  try {
    const raw = readRaw();
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 3 ? migrate(s) : null;
  } catch { return null; }
}

export let saveFailed = false;

function saveGame(s: GameState | null) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, compressToUTF16(JSON.stringify(s))); else localStorage.removeItem(SAVE_KEY);
  } catch {
    saveFailed = true; // storage full or blocked: the game keeps running, unsaved
  }
}

/** Game state with copy-on-write updates and autosave. */
export function useGame() {
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  // Saving a large world takes a moment, so save once things are quiet, and always when the page is hidden.
  const latest = useRef(game);
  const dirty = useRef(false);
  useEffect(() => {
    latest.current = game;
    dirty.current = true;
    if (!game) { saveGame(null); dirty.current = false; return; }
    const t = setTimeout(() => { if (dirty.current) { saveGame(latest.current); dirty.current = false; } }, 1500);
    return () => clearTimeout(t);
  }, [game]);
  useEffect(() => {
    const flush = () => { if (dirty.current) { saveGame(latest.current); dirty.current = false; } };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  const update = useCallback((fn: (draft: GameState) => void) => {
    setGame((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);
  return { game, setGame, update };
}

export type Theme = 'dark' | 'light';
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem(THEME_KEY) as Theme) || 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  return [theme, setTheme] as const;
}

/** Fixed in-game exchange rates; all amounts are stored in euros. */
export const RATES: Record<Currency, number> = { EUR: 1, USD: 1.08, GBP: 0.86 };
export const toCur = (eur: number, c: Currency) => Math.round(eur * RATES[c]);
export const fromCur = (amount: number, c: Currency) => Math.round(amount / RATES[c]);
