import { FIRST_NAMES, LAST_NAMES, NATIONALITIES } from './names';
import { ATTRIBUTE_GROUPS, POS_GROUP, POSITION_WEIGHTS, abilityFromAttributes, clamp, levelForAbility, type Position } from './ratings';
import type { Rng } from './rng';
import type { Familiarity, Player, Squad } from './types';

const ALL_ATTRS = [...ATTRIBUTE_GROUPS.Technical, ...ATTRIBUTE_GROUPS.Mental, ...ATTRIBUTE_GROUPS.Physical, ...ATTRIBUTE_GROUPS.Goalkeeping];

/** Squad template: 22 first-team players covering a 4-3-3 twice. */
export const SQUAD_TEMPLATE: Position[] = ['GK', 'GK', 'CB', 'CB', 'CB', 'CB', 'LB', 'LB', 'RB', 'RB', 'DM', 'DM', 'CM', 'CM', 'CM', 'AM', 'AM', 'LW', 'RW', 'RW', 'ST', 'ST'];

const RELATED: Record<string, Position[]> = {
  GK: [], CB: ['DM', 'RB'], LB: ['RB', 'LW'], RB: ['LB', 'RW'], DM: ['CM', 'CB'], CM: ['DM', 'AM'], AM: ['CM', 'ST', 'LW'], LW: ['RW', 'AM', 'ST'], RW: ['LW', 'AM', 'ST'], ST: ['AM', 'LW'],
};

export function makeAttributes(rng: Rng, pos: Position, targetCA: number): Record<string, number> {
  const group = POS_GROUP[pos];
  const w = POSITION_WEIGHTS[group];
  const level = levelForAbility(targetCA);
  const attrs: Record<string, number> = {};
  for (const a of ALL_ATTRS) {
    let base = level;
    if (w.key.includes(a)) base += 2.2;
    else if (w.imp.includes(a)) base += 1;
    else base -= 1.5;
    if (group !== 'GK' && (ATTRIBUTE_GROUPS.Goalkeeping as readonly string[]).includes(a)) base = 2 + rng.next() * 2;
    if (group === 'GK' && (ATTRIBUTE_GROUPS.Technical as readonly string[]).includes(a) && a !== 'Passing' && a !== 'First Touch') base = level - 5;
    attrs[a] = clamp(Math.round(rng.normal(base, 1.6)), 1, 20);
  }
  // nudge the overall toward the target ability
  for (let i = 0; i < 6; i++) {
    const ca = abilityFromAttributes(attrs, pos);
    const diff = targetCA - ca;
    if (Math.abs(diff) < 3) break;
    const step = diff > 0 ? 1 : -1;
    for (const a of [...w.key, ...w.imp]) attrs[a] = clamp(attrs[a] + step, 1, 20);
  }
  return attrs;
}

/** Wide positions that are the same job in another formation. */
export const EQUIVALENT: Record<string, string[]> = { LW: ['LM'], RW: ['RM'], LB: ['LWB'], RB: ['RWB'] };

function familiarity(rng: Rng, pos: Position): Record<string, Familiarity> {
  const out: Record<string, Familiarity> = { [pos]: 'natural' };
  for (const e of EQUIVALENT[pos] ?? []) out[e] = 'accomplished';
  for (const r of RELATED[pos] ?? []) {
    out[r] = rng.pick<Familiarity>(['accomplished', 'competent', 'competent', 'unconvincing']);
  }
  return out;
}

export function wageFor(ca: number, reputation: number) {
  return Math.round((Math.pow(ca / 100, 3.2) * 17000 * (0.6 + reputation / 100)) / 500) * 500 + 1500;
}
export function valueFor(ca: number, pa: number, age: number) {
  const youthBonus = age < 24 ? 1 + (24 - age) * 0.07 * Math.max(0, (pa - ca) / 60) : age > 30 ? Math.max(0.25, 1 - (age - 30) * 0.18) : 1;
  return Math.max(25000, Math.round((Math.pow(ca / 100, 4.2) * 5.5e6 * youthBonus) / 50000) * 50000);
}

export interface MakePlayerOpts { id: string; clubId: string; pos: Position; ca: number; pa: number; age: number; squad: Squad; number: number; year: number; reputation: number }

export function makePlayer(rng: Rng, o: MakePlayerOpts): Player {
  const attributes = makeAttributes(rng, o.pos, o.ca);
  const ability = abilityFromAttributes(attributes, o.pos);
  const youth = o.squad !== 'First team';
  return {
    id: o.id, clubId: o.clubId,
    name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
    nationality: rng.pick(NATIONALITIES),
    pos: o.pos, positions: familiarity(rng, o.pos), age: o.age,
    attributes, ability, potential: Math.max(ability, o.pa),
    hidden: { professionalism: rng.int(4, 20), injuryProneness: rng.int(2, 18), consistency: rng.int(5, 20), bigMatches: rng.int(4, 20) },
    squad: o.squad, contractType: youth ? 'youth' : 'full-time', number: o.number,
    wage: youth ? 1000 + Math.round(ability * 20 / 100) * 100 : wageFor(ability, o.reputation),
    value: valueFor(ability, o.pa, o.age),
    contractEnd: o.year + rng.int(1, 4),
    morale: rng.pick(['high', 'ok', 'ok', 'high'] as const), // pre-season optimism: nobody starts unhappy
    injuredFor: 0, suspendedFor: 0, yellowCards: 0,
    career: [], current: { apps: 0, goals: 0, assists: 0, ratingSum: 0 },
  };
}

