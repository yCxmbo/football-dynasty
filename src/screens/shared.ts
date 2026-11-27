import { nationName } from '../engine/nations';
import { ATTRIBUTE_GROUPS, attributeWeight } from '../engine/ratings';
import { knowledgeOf } from '../engine/transfers';
import { FREE_AGENT, type Currency, type GameState, type Player } from '../engine/types';
import { seasonLabel } from '../engine/types';
import { toCur } from '../store';

export type Screen = 'home' | 'inbox' | 'squad' | 'player' | 'tactics' | 'fixtures' | 'table' | 'match' | 'youth' | 'history' | 'settings' | 'transfers' | 'training' | 'scouting' | 'finances' | 'offer' | 'contract' | 'international' | 'career' | 'staff' | 'facilities' | 'nationalMatch' | 'records' | 'club' | 'stats' | 'calendar' | 'medical' | 'review';

export const NAV = (unread: number) => [
  { id: 'home', label: 'Home', icon: 'home' }, { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: unread || undefined },
  { id: 'squad', label: 'Squad', icon: 'squad', group: 'Team' }, { id: 'tactics', label: 'Tactics', icon: 'tactics', group: 'Team' },
  { id: 'training', label: 'Training', icon: 'training', group: 'Team' }, { id: 'medical', label: 'Medical', icon: 'injury', group: 'Team' }, { id: 'youth', label: 'Academy', icon: 'youth', group: 'Team' }, { id: 'staff', label: 'Staff', icon: 'captain', group: 'Team' },
  { id: 'fixtures', label: 'Fixtures', icon: 'fixtures', group: 'Matches' }, { id: 'calendar', label: 'Calendar', icon: 'fixtures', group: 'Matches' },
  { id: 'table', label: 'Competitions', icon: 'league-table', group: 'Matches' }, { id: 'international', label: 'International', icon: 'crown', group: 'Matches' }, { id: 'stats', label: 'Stats', icon: 'trend-up', group: 'Matches' }, { id: 'review', label: 'Season review', icon: 'pitch', group: 'Matches' },
  { id: 'transfers', label: 'Transfers', icon: 'transfers', group: 'Club' }, { id: 'scouting', label: 'Scouting', icon: 'scouting', group: 'Club' },
  { id: 'finances', label: 'Finances', icon: 'finances', group: 'Club' }, { id: 'facilities', label: 'Facilities', icon: 'stadium', group: 'Club' },
  { id: 'history', label: 'Club history', icon: 'trophy', group: 'Club' }, { id: 'records', label: 'Records', icon: 'star', group: 'Club' },
  { id: 'career', label: 'Career', icon: 'contract', group: 'You' }, { id: 'settings', label: 'Settings', icon: 'settings', group: 'You' },
];

export function moraleOf(p: Player) { return p.morale; }

/** Player → design-system SquadTable row (money converted to the chosen currency). */
export function squadRow(p: Player, cur: Currency, year: number, selected?: boolean) {
  return {
    id: p.id, number: p.number, name: p.loan ? `${p.name} (loan)` : p.name, pos: p.pos, age: p.age, ability: p.ability, potential: p.potential,
    knowledge: 100, morale: p.morale, wage: toCur(p.wage, cur), contractEnd: p.contractEnd + 1, captain: p.captain,
    squad: p.squad, contractType: p.contractType, selected,
    status: p.injuredFor > 0 ? 'injured' : p.suspendedFor > 0 ? 'suspended' : p.squad === 'First team' && p.contractEnd <= year ? 'expiring' : undefined,
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
  const club = state.clubs[p.clubId] ?? { name: 'Free agent' };
  const knowledge = knowledgeOf(state, p);
  const history = [
    ...(p.current.apps ? [{ season: seasonLabel(state.year), club: club.name, apps: p.current.apps, goals: p.current.goals, rating: p.current.ratingSum / p.current.apps }] : []),
    ...p.career,
  ];
  return {
    number: p.clubId === FREE_AGENT ? undefined : p.number, name: p.name, pos: p.pos, age: p.age, nationality: nationName(p.nationality),
    club: p.clubId === FREE_AGENT ? 'Free agent' : p.clubId === state.userClubId ? `${club.name} · ${p.squad}` : club.name,
    ability: p.ability, potential: p.potential, knowledge, positions: p.positions,
    value: toCur(p.value, cur), wage: toCur(p.wage, cur), contractEnd: `June ${p.contractEnd + 1}`, morale: p.morale,
    foot: p.attributes['Balance'] % 3 === 0 ? 'Left' : 'Right', attributes: p.attributes,
    report: knowledge >= 50 ? scoutReport(p) : { summary: `Scouting knowledge ${knowledge}%. Scout him for a full report.` }, history,
    squad: p.squad, contractType: p.contractType,
  };
}

export const ALL_GROUPS = ATTRIBUTE_GROUPS;

/** Names for the Back button. */
export const NAV_LABEL: Partial<Record<Screen, string>> = {
  home: 'Home', inbox: 'Inbox', squad: 'Squad', player: 'player', tactics: 'Tactics', fixtures: 'Fixtures', table: 'Competitions', match: 'match',
  youth: 'Academy', history: 'Club history', settings: 'Settings', transfers: 'Transfers', training: 'Training', scouting: 'Scouting', finances: 'Finances',
  offer: 'offer', contract: 'contract', international: 'International', career: 'Career', staff: 'Staff', facilities: 'Facilities', nationalMatch: 'match',
  records: 'Records', club: 'club', stats: 'Stats', calendar: 'Calendar', medical: 'Medical', review: 'Season review',
};
