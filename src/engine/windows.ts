/* Transfer windows by country, on real dates (approximately the 2025/26 ones). A season starting in year Y has its
   summer window in Y and its winter window in Y+1 (Mexico's winter window starts in December). Countries not
   listed (fictional worlds) use the common European dates. */
import type { GameState } from './types';

export type WindowName = 'Summer' | 'Winter';
interface Def { name: WindowName; from: string; to: string; fromNext?: boolean; toNext?: boolean }

const EUROPE: Def[] = [{ name: 'Summer', from: '06-16', to: '09-01' }, { name: 'Winter', from: '01-01', to: '02-02', fromNext: true, toNext: true }];
export const WINDOWS: Record<string, Def[]> = {
  eng: EUROPE,
  fra: EUROPE,
  esp: [{ name: 'Summer', from: '07-01', to: '09-01' }, { name: 'Winter', from: '01-02', to: '02-03', fromNext: true, toNext: true }],
  ita: [{ name: 'Summer', from: '07-01', to: '09-01' }, { name: 'Winter', from: '01-02', to: '02-02', fromNext: true, toNext: true }],
  ger: [{ name: 'Summer', from: '07-01', to: '09-01' }, { name: 'Winter', from: '01-01', to: '02-02', fromNext: true, toNext: true }],
  por: [{ name: 'Summer', from: '07-01', to: '09-22' }, { name: 'Winter', from: '01-01', to: '02-02', fromNext: true, toNext: true }],
  ned: [{ name: 'Summer', from: '06-16', to: '09-01' }, { name: 'Winter', from: '01-01', to: '02-03', fromNext: true, toNext: true }],
  bel: [{ name: 'Summer', from: '06-16', to: '09-08' }, { name: 'Winter', from: '01-01', to: '02-02', fromNext: true, toNext: true }],
  tur: [{ name: 'Summer', from: '06-14', to: '09-12' }, { name: 'Winter', from: '01-06', to: '02-07', fromNext: true, toNext: true }],
  sco: [{ name: 'Summer', from: '06-13', to: '09-01' }, { name: 'Winter', from: '01-01', to: '02-02', fromNext: true, toNext: true }],
  ksa: [{ name: 'Summer', from: '06-16', to: '09-10' }, { name: 'Winter', from: '01-01', to: '02-02', fromNext: true, toNext: true }],
  bra: [{ name: 'Summer', from: '07-01', to: '09-02' }, { name: 'Winter', from: '01-05', to: '03-03', fromNext: true, toNext: true }],
  arg: [{ name: 'Summer', from: '07-01', to: '08-31' }, { name: 'Winter', from: '01-02', to: '02-28', fromNext: true, toNext: true }],
  usa: [{ name: 'Summer', from: '07-24', to: '08-21' }, { name: 'Winter', from: '01-31', to: '04-23', fromNext: true, toNext: true }],
  mex: [{ name: 'Summer', from: '06-01', to: '09-01' }, { name: 'Winter', from: '12-15', to: '02-02', toNext: true }],
};
/** What a country calls its windows, if not summer and winter. */
const NAMES: Record<string, Partial<Record<WindowName, string>>> = { usa: { Summer: 'secondary window', Winter: 'primary window' } };

export interface WindowDates { name: WindowName; label: string; from: string; to: string }
/** A country's windows for the season starting in `year`. */
export function windowsFor(country: string | undefined, year: number): WindowDates[] {
  return (WINDOWS[country ?? ''] ?? EUROPE).map((d) => ({
    name: d.name, label: NAMES[country ?? '']?.[d.name] ?? `${d.name.toLowerCase()} window`,
    from: `${d.fromNext ? year + 1 : year}-${d.from}`, to: `${d.toNext ? year + 1 : year}-${d.to}`,
  }));
}

/** Today's date in the game (the next fixture date until days have started passing). */
export const dateOf = (s: GameState) => s.today ?? s.calendar[Math.min(s.matchday, s.calendar.length) - 1]?.date ?? '';
const over = (s: GameState) => s.matchday > s.calendar.length;

/** The window open today in a country, if any. Between seasons the summer window is open. */
export function openWindow(s: GameState, country: string | undefined): WindowDates | undefined {
  const all = windowsFor(country, s.year);
  if (over(s)) return windowsFor(country, s.year + 1).find((w) => w.name === 'Summer');
  const d = dateOf(s);
  return all.find((w) => d >= w.from && d <= w.to);
}
/** The next window to open in a country this season, if any. */
export function nextWindow(s: GameState, country: string | undefined): WindowDates | undefined {
  const d = dateOf(s);
  return windowsFor(country, s.year).filter((w) => w.from > d).sort((a, b) => a.from.localeCompare(b.from))[0];
}
