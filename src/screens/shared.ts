import { ATTRIBUTE_GROUPS, attributeWeight } from '../engine/ratings';
import type { Currency, GameState, Player } from '../engine/types';
import { seasonLabel } from '../engine/types';
import { toCur } from '../store';

export type Screen = 'home' | 'inbox' | 'squad' | 'player' | 'tactics' | 'fixtures' | 'table' | 'match' | 'youth' | 'history' | 'settings' | 'transfers' | 'training' | 'scouting' | 'finances';

export const NAV = (unread: number) => [
  { id: 'home', label: 'Home', icon: 'home' }, { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: unread || undefined },
  { id: 'squad', label: 'Squad', icon: 'squad' }, { id: 'tactics', label: 'Tactics', icon: 'tactics' },
  { id: 'fixtures', label: 'Fixtures', icon: 'fixtures' }, { id: 'table', label: 'League table', icon: 'league-table' },
  { id: 'youth', label: 'Academy', icon: 'youth' }, { id: 'history', label: 'Club history', icon: 'trophy' },
  { id: 'transfers', label: 'Transfers', icon: 'transfers' }, { id: 'training', label: 'Training', icon: 'training' },
  { id: 'finances', label: 'Finances', icon: 'finances' }, { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function moraleOf(p: Player) { return p.morale; }

/** Player → design-system SquadTable row (money converted to the chosen currency). */
export function squadRow(p: Player, cur: Currency, selected?: boolean) {
  return {
    id: p.id, number: p.number, name: p.name, pos: p.pos, age: p.age, ability: p.ability, potential: p.potential,
    knowledge: 100, morale: p.morale, wage: toCur(p.wage, cur), contractEnd: p.contractEnd + 1, captain: p.captain,
    squad: p.squad, contractType: p.contractType, selected,
    status: p.injuredFor > 0 ? 'injured' : p.suspendedFor > 0 ? 'suspended' : undefined,
  };
}

const TRAITS: Array<[(p: Player) => boolean, string]> = [
  [(p) => p.hidden.bigMatches >= 16, 'Big-game player'], [(p) => p.hidden.bigMatches <= 6, 'Nervous on the big stage'],
  [(p) => p.hidden.consistency >= 16, 'Very consistent'], [(p) => p.hidden.consistency <= 7, 'Inconsistent'],
  [(p) => p.hidden.injuryProneness >= 15, 'Prone to injury'], [(p) => p.hidden.injuryProneness <= 4, 'Rarely injured'],
  [(p) => p.hidden.professionalism >= 16, 'Model professional'], [(p) => p.hidden.professionalism <= 6, 'Needs pushing in training'],
];

/** Scout report in words: hidden attributes are never shown as numbers. */
export function scoutReport(p: Player) {
  const relevant = Object.entries(p.attributes).filter(([a]) => attributeWeight(a, p.pos) > 0);
  const byKey = relevant.filter(([a]) => attributeWeight(a, p.pos) >= 2).sort((a, b) => b[1] - a[1]);
  const pros = byKey.slice(0, 3).filter(([, v]) => v >= 12).map(([a, v]) => `${v >= 16 ? 'Excellent' : 'Good'} ${a.toLowerCase()}`);
  const cons = byKey.slice(-3).filter(([, v]) => v <= 10).map(([a]) => `Weak ${a.toLowerCase()}`);
  const growth = p.potential - p.ability;
  const summary = p.age >= 31 ? 'Experienced player, probably past their peak.' : growth > 40 ? 'Raw talent with a very high ceiling.' : growth > 15 ? 'Still improving and should get better.' : 'Close to their best.';
  return { summary, pros: pros.length ? pros : ['Solid all-round'], cons: cons.length ? cons : ['No clear weaknesses'], traits: TRAITS.filter(([t]) => t(p)).map(([, s]) => s) };
}

export function profileData(state: GameState, p: Player, cur: Currency) {
  const club = state.clubs[p.clubId];
  const history = [
    ...(p.current.apps ? [{ season: seasonLabel(state.year), club: club.name, apps: p.current.apps, goals: p.current.goals, rating: p.current.ratingSum / p.current.apps }] : []),
    ...p.career,
  ];
  return {
    number: p.number, name: p.name, pos: p.pos, age: p.age, nationality: p.nationality, club: `${club.name} · ${p.squad}`,
    ability: p.ability, potential: p.potential, knowledge: 100, positions: p.positions,
    value: toCur(p.value, cur), wage: toCur(p.wage, cur), contractEnd: `June ${p.contractEnd + 1}`, morale: p.morale,
    foot: p.attributes['Balance'] % 3 === 0 ? 'Left' : 'Right', attributes: p.attributes, report: scoutReport(p), history,
    squad: p.squad, contractType: p.contractType,
  };
}

export const ALL_GROUPS = ATTRIBUTE_GROUPS;
