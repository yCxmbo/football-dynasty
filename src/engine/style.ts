/* Your coaching style: a small, constant tilt to how your teams play and develop. */
import type { GameState } from './types';

export type ManagerStyle = 'balanced' | 'attacking' | 'defensive' | 'youth' | 'motivator';
export const STYLES: Array<{ id: ManagerStyle; title: string; text: string }> = [
  { id: 'balanced', title: 'Balanced', text: 'No particular strengths or weaknesses.' },
  { id: 'attacking', title: 'Attacking', text: 'Your teams create more chances, and concede a few more.' },
  { id: 'defensive', title: 'Defensive', text: 'Hard to break down, but fewer chances at the other end.' },
  { id: 'youth', title: 'Youth developer', text: 'Players aged 21 and under develop faster; better youth intakes.' },
  { id: 'motivator', title: 'Motivator', text: 'Team talks land better, and unhappy players come round sooner.' },
];

export const styleOf = (s: GameState): ManagerStyle => s.managerStyle ?? 'balanced';
/** Attack and defence multipliers for your side in a match. */
export function styleTilt(s: GameState): { atk: number; def: number } {
  const st = styleOf(s);
  return st === 'attacking' ? { atk: 1.06, def: 0.97 } : st === 'defensive' ? { atk: 0.96, def: 1.06 } : { atk: 1, def: 1 };
}
export const youthDevelopmentBoost = (s: GameState, age: number) => (styleOf(s) === 'youth' && age <= 21 ? 1.15 : 1);
export const youthIntakeBonus = (s: GameState) => (styleOf(s) === 'youth' ? 4 : 0);
export const talkMultiplier = (s: GameState) => (styleOf(s) === 'motivator' ? 1.5 : 1);
export const moraleBonus = (s: GameState) => (styleOf(s) === 'motivator' ? 0.15 : 0);

/** The style can be changed once a season. */
export function setStyle(s: GameState, style: ManagerStyle): string | null {
  if (s.styleChanged === s.year) return 'You have already changed your style this season.';
  s.managerStyle = style;
  s.styleChanged = s.year;
  return null;
}
