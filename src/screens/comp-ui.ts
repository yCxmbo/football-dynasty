import { compInfo, leagueDef, leagueTableOf, withThe } from '../engine/competitions';
import { formatDate } from '../engine/fixtures';
import type { Fixture, GameState } from '../engine/types';
import { badgeUrl } from './badge';

/** Zones for the design system's LeagueTable from the league's rules. */
export function zonesFor(g: GameState, leagueId: string | undefined) {
  const l = leagueDef(g, leagueId);
  if (!l) return {};
  const below = g.world.leagues.find((x) => x.country === l.country && x.tier === l.tier + 1);
  const cont = g.world.continental.filter((k) => k.rank === 1).reduce((a, k) => a + (k.places[l.country] ?? 0), 0);
  return {
    ...(l.tier === 1 && cont ? { champions: cont, championsLabel: `${g.world.continental.find((k) => k.rank === 1 && k.places[l.country])?.name ?? 'Continental'} places` } : {}),
    ...(l.promote ? { promotion: l.promote, promotionLabel: 'Promoted' } : {}),
    ...(l.playoff ? { playoff: l.playoff, playoffLabel: 'Play-offs (one more place up)' } : {}),
    ...(l.relegate ? { relegation: l.relegate, relegationLabel: `Relegated${below ? ` to ${withThe(below.name)}` : ''}` } : {}),
  };
}

function formOf(g: GameState, id: string) {
  const l = g.clubs[id]?.league;
  return l ? leagueTableOf(g, l).find((r) => r.clubId === id)?.form : undefined;
}

export function fixtureCardProps(g: GameState, f: Fixture) {
  const H = g.clubs[f.homeId], A = g.clubs[f.awayId];
  const r = f.result;
  const pens = r?.pens ? ` · ${r.pens[0]}–${r.pens[1]} pens` : '';
  const day = new Date(f.date + 'T12:00:00Z').getUTCDay();
  return {
    competition: compInfo(g, f.comp).name, matchday: compInfo(g, f.comp).kind === 'league' ? f.round : f.round + pens, status: r ? 'FT' : 'upcoming', score: r?.score,
    date: formatDate(f.date), kickoff: day === 3 || day === 2 || day === 4 ? '19:45' : '15:00', venue: f.neutral ? 'Neutral venue' : H.stadium,
    home: { name: H.name, short: H.short, crest: badgeUrl(H), isUser: H.id === g.userClubId, form: formOf(g, H.id) },
    away: { name: A.name, short: A.short, crest: badgeUrl(A), isUser: A.id === g.userClubId, form: formOf(g, A.id) },
  };
}

export const leagueLabel = (g: GameState, id?: string) => leagueDef(g, id)?.name ?? 'No league';
