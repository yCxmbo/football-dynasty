import { useCallback, useEffect, useState } from 'react';
import { migrate } from './engine/game';
import type { Currency, GameState } from './engine/types';

const SAVE_KEY = 'football-dynasty:save:v1';
const THEME_KEY = 'football-dynasty:theme';

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 1 ? migrate(s) : null;
  } catch { return null; }
}

function saveGame(s: GameState | null) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, JSON.stringify(s)); else localStorage.removeItem(SAVE_KEY);
  } catch { /* storage full or blocked: the game keeps running, unsaved */ }
}

/** Game state with copy-on-write updates and autosave. */
export function useGame() {
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  useEffect(() => { saveGame(game); }, [game]);
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
