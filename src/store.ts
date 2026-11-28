import { useCallback, useEffect, useRef, useState } from 'react';
import { compressToBase64, decompressFromBase64, decompressFromUTF16 } from 'lz-string';
import { migrate } from './engine/game';
import { seasonLabel, type Currency, type GameState } from './engine/types';
import { idbDel, idbGet, idbPut } from './idb';
import { autoBackup, deleteAllSlots } from './saves';

/* Saves: several careers in IndexedDB, with a small list of them in localStorage.
   The old single save in localStorage is moved over on first start. */
const LEGACY_KEY = 'football-dynasty:save:v1';
const CAREERS_KEY = 'football-dynasty:careers';
const ACTIVE_KEY = 'football-dynasty:active';
const THEME_KEY = 'football-dynasty:theme';
const VERSION = 3;

export interface Career { id: string; club: string; manager: string; season: string; world: string; updated: number }

function readCareers(): Career[] {
  try { return JSON.parse(localStorage.getItem(CAREERS_KEY) ?? '[]') as Career[]; } catch { return []; }
}
function writeCareers(list: Career[]) { try { localStorage.setItem(CAREERS_KEY, JSON.stringify(list)); } catch { /* ignore */ } }
function setActive(id: string | null) { try { if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ } }

const careerOf = (id: string, g: GameState): Career => ({
  id, club: g.clubs[g.userClubId]?.name ?? '?', manager: g.managerName, season: seasonLabel(g.year),
  world: g.world.source === 'real' ? 'Real world' : g.world.source === 'import' ? g.world.name : 'Fictional world', updated: Date.now(),
});

/** Moves a save from the old localStorage slot into IndexedDB. Returns true if an old, incompatible save was found. */
async function migrateLegacy(): Promise<boolean> {
  let raw: string | null = null;
  try { raw = localStorage.getItem(LEGACY_KEY); } catch { return false; }
  if (!raw) return false;
  try {
    const json = raw.startsWith('{') ? raw : decompressFromUTF16(raw);
    const s = JSON.parse(json) as GameState;
    if (s.version !== VERSION) { localStorage.removeItem(LEGACY_KEY); return true; }
    const id = `c${Date.now()}`;
    await idbPut(id, s);
    writeCareers([careerOf(id, s), ...readCareers()]);
    setActive(id);
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* leave it */ }
  return false;
}

export let saveFailed = false;

/** Game state with copy-on-write updates, autosave and several careers. */
export function useGame() {
  const [game, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [oldSave, setOldSave] = useState(false);
  const [careers, setCareers] = useState<Career[]>(() => readCareers());
  const activeId = useRef<string | null>(null);

  useEffect(() => {
    void (async () => {
      setOldSave(await migrateLegacy());
      setCareers(readCareers());
      const id = localStorage.getItem(ACTIVE_KEY);
      if (id) {
        const s = await idbGet<GameState>(id).catch(() => undefined);
        if (s && s.version === VERSION) { activeId.current = id; setGameState(migrate(s)); }
      }
      setLoading(false);
    })();
  }, []);

  // Save once things are quiet, and always when the page is hidden.
  const latest = useRef(game);
  const dirty = useRef(false);
  const save = useCallback(() => {
    const g = latest.current;
    if (!dirty.current || !g) return;
    dirty.current = false;
    let id = activeId.current;
    if (!id) { id = `c${Date.now()}`; activeId.current = id; setActive(id); }
    const sid = id;
    idbPut(sid, g).then(() => {
      saveFailed = false;
      void autoBackup(sid, g).catch(() => undefined); // daily and season-start backups
      const list = [careerOf(sid, g), ...readCareers().filter((c) => c.id !== sid)];
      writeCareers(list); setCareers(list);
    }).catch(() => { saveFailed = true; });
  }, []);
  useEffect(() => {
    latest.current = game;
    if (!game) return;
    dirty.current = true;
    const t = setTimeout(save, 1500);
    return () => clearTimeout(t);
  }, [game, save]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') save(); };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', onVis); };
  }, [save]);

  const update = useCallback((fn: (draft: GameState) => void) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  /** Replaces the game in the current career (a new game started from the menu gets a new career). */
  const setGame = useCallback((g: GameState | null) => { setGameState(g); }, []);

  /** Leaves the current career (it stays saved) to start or load another. */
  const leave = useCallback(() => { save(); activeId.current = null; setActive(null); setGameState(null); }, [save]);

  const loadCareer = useCallback(async (id: string) => {
    save();
    setLoading(true);
    const s = await idbGet<GameState>(id).catch(() => undefined);
    if (s && s.version === VERSION) { activeId.current = id; setActive(id); setGameState(migrate(s)); }
    setLoading(false);
  }, [save]);

  const deleteCareer = useCallback(async (id: string) => {
    await idbDel(id).catch(() => undefined);
    await deleteAllSlots(id).catch(() => undefined);
    const list = readCareers().filter((c) => c.id !== id);
    writeCareers(list); setCareers(list);
    if (activeId.current === id) { activeId.current = null; setActive(null); setGameState(null); }
  }, []);

  /** Reads an exported save file and opens it as a new career. Returns an error message, or null. */
  const importSave = useCallback(async (text: string): Promise<string | null> => {
    try {
      const json = text.trim().startsWith('{') ? text : decompressFromBase64(text.trim());
      const s = JSON.parse(json ?? '') as GameState;
      if (s.version !== VERSION || !s.clubs || !s.players) return 'This file is not a save from this version of Football Dynasty.';
      save();
      const id = `c${Date.now()}`;
      await idbPut(id, s);
      const list = [careerOf(id, s), ...readCareers()];
      writeCareers(list); setCareers(list);
      activeId.current = id; setActive(id); setGameState(migrate(s));
      return null;
    } catch { return 'This file could not be read as a Football Dynasty save.'; }
  }, [save]);

  /** Puts a saved slot or backup in place of the current game (the career's own save is overwritten next autosave). */
  const restore = useCallback((s: GameState) => { if (s.version === VERSION) setGameState(migrate(s)); }, []);

  return { game, setGame, update, loading, oldSave, careers, activeId: activeId.current, leave, loadCareer, deleteCareer, importSave, restore };
}

/** A save as a compact text file (lz-string, base64). */
export function exportSave(g: GameState) {
  const blob = new Blob([compressToBase64(JSON.stringify(g))], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const name = `${g.clubs[g.userClubId]?.name ?? 'career'} ${seasonLabel(g.year).replace('/', '-')}`.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
  Object.assign(document.createElement('a'), { href: url, download: `${name}.fdsave` }).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
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
