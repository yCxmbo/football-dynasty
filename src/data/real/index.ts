/* The built-in real-world database: 15 countries' leagues (England with three divisions, twelve more with two), their cups,
   continental competitions, and notable players as of the start of 2025/26. Ratings are estimates. */
import { WORLD_FORMAT, WORLD_VERSION, type ClubDef, type PlayerDef, type WorldDef } from '../../engine/worlddef';
import { ENGLAND } from './england';
import { SPAIN } from './spain';
import { ITALY } from './italy';
import { GERMANY } from './germany';
import { FRANCE } from './france';
import { PORTUGAL, NETHERLANDS, BELGIUM, TURKEY, SCOTLAND } from './smaller';
import { BRAZIL, ARGENTINA, USA, MEXICO } from './americas';
import { SAUDI } from './saudi';
import { EUROPE_REST, SOUTH_AMERICA_REST, ASIA_REST } from './fillers';
import type { RC, RCountry, RFillers } from './types';
import { REAL_RIVALRIES } from '../../engine/rivalries';

export const REAL_COUNTRIES: RCountry[] = [ENGLAND, SPAIN, ITALY, GERMANY, FRANCE, PORTUGAL, NETHERLANDS, BELGIUM, TURKEY, SCOTLAND, BRAZIL, ARGENTINA, USA, SAUDI, MEXICO];
const FILLERS: RFillers[] = [EUROPE_REST, SOUTH_AMERICA_REST, ASIA_REST];

let cached: WorldDef | null = null;

/** Converts the compact data to a world file. Club ids are prefixed with the country so they stay unique. */
export function realWorld(): WorldDef {
  if (cached) return cached;
  const clubs: ClubDef[] = [], players: PlayerDef[] = [];
  const seen = new Set<string>();
  const addClub = (country: string, rc: RC, league?: string) => {
    const id = `${country}-${rc.id}`;
    clubs.push({ id, name: rc.name, short: rc.short, country, league, reputation: rc.rep, stadium: rc.st, capacity: rc.cap, colours: rc.col, ...(rc.reserve ? { reserve: true } : {}) });
    for (const [name, pos, age, overall, nationality, potential] of rc.p ?? []) {
      if (!overall || seen.has(name)) continue; // a 0 marks a player listed at his former club
      seen.add(name);
      players.push({ name, club: id, pos, age, overall, nationality, ...(potential ? { potential } : {}) });
    }
    return id;
  };
  for (const k of REAL_COUNTRIES) for (const l of k.leagues) for (const rc of l.clubs) addClub(k.id, rc, l.id);
  const fill: Record<string, string[]> = {};
  for (const f of FILLERS) fill[f.id] = [...f.clubs].sort((a, b) => b.rep - a.rep).map((rc) => addClub(f.id, rc));
  const leagues = REAL_COUNTRIES.flatMap((k) => k.leagues.map(({ clubs: _c, ...l }) => ({ ...l, country: k.id, playoff: l.playoff ?? null })));
  cached = {
    format: WORLD_FORMAT, version: WORLD_VERSION, name: 'Real world 2025/26', startYear: 2025,
    countries: [...REAL_COUNTRIES.map((k) => ({ id: k.id, name: k.name, superCup: k.superCup })), ...FILLERS.map((f) => ({ id: f.id, name: f.name }))],
    leagues,
    cups: REAL_COUNTRIES.flatMap((k) => k.cups.map((cup) => ({ ...cup, country: k.id }))),
    continental: [
      { id: 'ucl', name: 'UEFA Champions League', short: 'Champions League', rank: 1, size: 36, format: 'league', places: { eng: 4, esp: 4, ita: 4, ger: 4, fra: 3, por: 2, ned: 2, bel: 1, tur: 1, sco: 1 }, fillers: fill.eur },
      { id: 'uel', name: 'UEFA Europa League', short: 'Europa League', rank: 2, size: 36, format: 'league', places: { eng: 2, esp: 2, ita: 2, ger: 2, fra: 2, por: 2, ned: 2, bel: 2, tur: 2, sco: 1 }, cupWinners: true, fillers: fill.eur },
      { id: 'lib', name: 'Copa Libertadores', short: 'Libertadores', rank: 1, size: 16, places: { bra: 6, arg: 6 }, fillers: fill.sam },
      { id: 'nacc', name: 'CONCACAF Champions Cup', short: 'Champions Cup', rank: 1, size: 16, places: { mex: 8, usa: 8 } },
      { id: 'acl', name: 'AFC Champions League Elite', short: 'ACL Elite', rank: 1, size: 16, places: { ksa: 4 }, fillers: fill.asi },
    ],
    clubs, players,
    rivalries: REAL_RIVALRIES,
  };
  return cached;
}
