import { COMPS, divisionComp, divisionTable } from '../engine/competitions';
import { formatDate } from '../engine/fixtures';
import type { Fixture, GameState } from '../engine/types';

/** Zones for the design system's LeagueTable, per division. */
export function zonesFor(division: number) {
  if (division === 1) return { champions: 3, championsLabel: 'Continental Cup (top 3)', relegation: 3, relegationLabel: 'Relegated to the Championship' };
  if (division === 2) return { promotion: 2, promotionLabel: 'Promoted', playoff: [3, 6] as [number, number], playoffLabel: 'Play-offs (one more place up)', relegation: 3, relegationLabel: 'Relegated to League One' };
  return { promotion: 2, promotionLabel: 'Promoted', playoff: [3, 6] as [number, number], playoffLabel: 'Play-offs (one more place up)' };
}

function formOf(g: GameState, id: string) {
  const d = g.clubs[id]?.division;
  if (!d) return undefined;
  return divisionTable(g, d).find((r) => r.clubId === id)?.form;
}

export function fixtureCardProps(g: GameState, f: Fixture) {
  const H = g.clubs[f.homeId], A = g.clubs[f.awayId];
  const r = f.result;
  const userHome = f.homeId === g.userClubId;
  const pens = r?.pens ? ` · ${r.pens[0]}–${r.pens[1]} pens` : '';
  return {
    competition: COMPS[f.comp].name, matchday: f.comp.startsWith('D') ? f.round : f.round + pens, status: r ? 'FT' : 'upcoming', score: r?.score,
    date: formatDate(f.date), kickoff: f.date && new Date(f.date + 'T12:00:00Z').getUTCDay() === 3 ? '19:45' : '15:00', venue: f.neutral ? 'National Stadium' : H.stadium,
    home: { name: H.name, short: H.short, isUser: H.id === g.userClubId, form: formOf(g, H.id) },
    away: { name: A.name, short: A.short, isUser: A.id === g.userClubId, form: formOf(g, A.id) },
    userHome,
  };
}

export const divisionLabel = (d: number) => (d ? COMPS[divisionComp(d)].name : 'Abroad');
