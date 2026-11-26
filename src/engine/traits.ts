/* Personalities: visible tags from a player's hidden character and mental attributes, and what they do. */
import type { Player } from './types';

export type Trait = 'leader' | 'big-game' | 'nervous' | 'hothead' | 'model-pro' | 'lazy' | 'injury-prone' | 'iron' | 'consistent' | 'inconsistent';
export const TRAIT_TEXT: Record<Trait, { label: string; effect: string; good: boolean }> = {
  leader: { label: 'Leader', effect: 'Lifts the whole side when he plays.', good: true },
  'big-game': { label: 'Big-game player', effect: 'Raises his game in knockouts, finals and derbies.', good: true },
  nervous: { label: 'Nervous', effect: 'Fades in knockouts, finals and derbies.', good: false },
  hothead: { label: 'Hothead', effect: 'Collects more cards than most.', good: false },
  'model-pro': { label: 'Model professional', effect: 'Trains hard and develops faster.', good: true },
  lazy: { label: 'Needs pushing', effect: 'Develops more slowly.', good: false },
  'injury-prone': { label: 'Injury-prone', effect: 'Gets injured more often, and for longer.', good: false },
  iron: { label: 'Iron man', effect: 'Rarely injured.', good: true },
  consistent: { label: 'Consistent', effect: 'Plays to his level week in, week out.', good: true },
  inconsistent: { label: 'Inconsistent', effect: 'Brilliant one week, anonymous the next.', good: false },
};

export function traitsOf(p: Player): Trait[] {
  const h = p.hidden, a = p.attributes;
  const t: Trait[] = [];
  if ((a.Leadership ?? 0) >= 16 && p.age >= 23) t.push('leader');
  // only the clear cases (roughly the top and bottom tenth) get a tag
  if (h.bigMatches >= 18) t.push('big-game'); else if (h.bigMatches <= 5) t.push('nervous');
  if ((a.Aggression ?? 0) >= 15 && h.professionalism <= 9) t.push('hothead');
  if (h.professionalism >= 19) t.push('model-pro'); else if (h.professionalism <= 5) t.push('lazy');
  if (h.injuryProneness >= 16) t.push('injury-prone'); else if (h.injuryProneness <= 3) t.push('iron');
  if (h.consistency >= 19) t.push('consistent'); else if (h.consistency <= 6) t.push('inconsistent');
  return t;
}
