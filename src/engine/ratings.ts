/* Rating rules from the design system's brand book ("Player ratings").
   Visible attributes 1–20; hidden Current/Potential Ability 1–200, position-weighted. */

export const ATTRIBUTE_GROUPS = {
  Technical: ['Corners', 'Crossing', 'Dribbling', 'Finishing', 'First Touch', 'Free Kicks', 'Heading', 'Long Shots', 'Marking', 'Passing', 'Penalties', 'Tackling', 'Technique'],
  Mental: ['Aggression', 'Anticipation', 'Bravery', 'Composure', 'Concentration', 'Decisions', 'Determination', 'Flair', 'Leadership', 'Off the Ball', 'Positioning', 'Teamwork', 'Vision', 'Work Rate'],
  Physical: ['Acceleration', 'Agility', 'Balance', 'Jumping Reach', 'Natural Fitness', 'Pace', 'Stamina', 'Strength'],
  Goalkeeping: ['Aerial Reach', 'Command of Area', 'Communication', 'Handling', 'Kicking', 'One on Ones', 'Reflexes', 'Rushing Out', 'Throwing'],
} as const;

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'DM' | 'CM' | 'AM' | 'LW' | 'RW' | 'ST';
export type PosGroup = 'GK' | 'CB' | 'FB' | 'DM' | 'CM' | 'AM' | 'W' | 'ST';
export const POS_GROUP: Record<string, PosGroup> = { GK: 'GK', CB: 'CB', LB: 'FB', RB: 'FB', LWB: 'FB', RWB: 'FB', DM: 'DM', CM: 'CM', AM: 'AM', LM: 'W', RM: 'W', LW: 'W', RW: 'W', ST: 'ST' };

export const POSITION_WEIGHTS: Record<PosGroup, { key: string[]; imp: string[] }> = {
  GK: { key: ['Reflexes', 'Handling', 'One on Ones', 'Aerial Reach', 'Positioning', 'Command of Area'], imp: ['Communication', 'Kicking', 'Concentration', 'Decisions', 'Agility', 'Rushing Out'] },
  CB: { key: ['Marking', 'Tackling', 'Heading', 'Positioning', 'Jumping Reach', 'Strength'], imp: ['Anticipation', 'Concentration', 'Bravery', 'Decisions', 'Pace', 'Composure'] },
  FB: { key: ['Tackling', 'Pace', 'Stamina', 'Crossing', 'Positioning', 'Work Rate'], imp: ['Marking', 'Acceleration', 'Dribbling', 'Teamwork', 'Anticipation', 'Passing'] },
  DM: { key: ['Tackling', 'Positioning', 'Passing', 'Anticipation', 'Teamwork', 'Decisions'], imp: ['Marking', 'Concentration', 'Stamina', 'Strength', 'Composure', 'Work Rate'] },
  CM: { key: ['Passing', 'Decisions', 'Vision', 'First Touch', 'Teamwork', 'Stamina'], imp: ['Technique', 'Anticipation', 'Composure', 'Work Rate', 'Tackling', 'Off the Ball'] },
  AM: { key: ['Passing', 'Vision', 'Technique', 'First Touch', 'Decisions', 'Flair'], imp: ['Dribbling', 'Off the Ball', 'Composure', 'Long Shots', 'Agility', 'Anticipation'] },
  W: { key: ['Dribbling', 'Pace', 'Acceleration', 'Crossing', 'Technique', 'Flair'], imp: ['Agility', 'Off the Ball', 'First Touch', 'Passing', 'Finishing', 'Work Rate'] },
  ST: { key: ['Finishing', 'Off the Ball', 'Composure', 'First Touch', 'Anticipation', 'Acceleration'], imp: ['Heading', 'Dribbling', 'Strength', 'Technique', 'Pace', 'Decisions'] },
};

const GK_ATTRS: readonly string[] = ATTRIBUTE_GROUPS.Goalkeeping;
const TECH: readonly string[] = ATTRIBUTE_GROUPS.Technical;

export function attributeWeight(attr: string, pos: string): 0 | 1 | 2 | 3 {
  const group = POS_GROUP[pos] ?? 'CM';
  const g = POSITION_WEIGHTS[group];
  if (g.key.includes(attr)) return 3;
  if (g.imp.includes(attr)) return 2;
  const isGK = group === 'GK';
  if (!isGK && GK_ATTRS.includes(attr)) return 0;
  if (isGK && TECH.includes(attr) && attr !== 'Passing' && attr !== 'First Touch') return 0;
  return 1;
}

/** Position-weighted average of 1–20 attributes → Current Ability 1–200. */
export function abilityFromAttributes(attributes: Record<string, number>, pos: string): number {
  let sum = 0, w = 0;
  for (const [k, v] of Object.entries(attributes)) {
    const wt = attributeWeight(k, pos);
    sum += v * wt; w += wt;
  }
  if (!w) return 1;
  return clamp(Math.round(((sum / w - 1) / 19) * 199 + 1), 1, 200);
}

export function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

/** Attribute level (1–20) that corresponds to an ability (1–200). */
export function levelForAbility(ca: number) { return ((ca - 1) / 199) * 19 + 1; }
