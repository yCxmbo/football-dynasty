/* World files: one format for the built-in fictional world and for worlds players import themselves
   (for example real leagues, clubs and players they have the right to use). See WORLD_FILES.md. */
import { abilityFromAttributes, clamp, type Position } from './ratings';
import type { Rng } from './rng';
import type { Club, Player, Squad } from './types';
import { nationCode } from './nations';
import { reserveNames } from './namepools';
import { assignReleaseClauses } from './contracts';
import { makeAttributes, makePlayer, valueFor, wageFor, SQUAD_TEMPLATE } from './world';

export const WORLD_FORMAT = 'football-dynasty-world';
export const WORLD_VERSION = 1;

export interface CountryDef { id: string; name: string; /** Name of the season-opening super cup (champions v main cup winners, or v runners-up without a main cup). false: no super cup. */ superCup?: string | false }
export interface LeagueDef {
  id: string; name: string; short?: string; country: string; tier: number;
  /** Automatic promotion places (0 for a country's top league). */ promote: number;
  /** Play-off places for one more promotion spot, e.g. [3, 6]. Always four clubs. */ playoff?: [number, number] | null;
  /** Relegation places (0 for a country's bottom league). */ relegate: number;
  /** League TV money per matchday, in euros. */ tv: number;
  /** The title is decided by play-offs among the top eight (MLS Cup, Liguilla). The trophy goes to the winner; `shield`, if set, to the club top of the table. */
  titlePlayoff?: { name: string; trophy: string; shield?: string } | null;
  /** Scottish-style split: everyone plays everyone three times, then the top and bottom halves play each other once more; clubs stay in their half. */
  split?: boolean;
}
export interface CupDef { id: string; name: string; country: string; /** League tiers that enter. */ tiers: number[]; /** The main cup's winner plays in the super cup and second continental competition. */ main?: boolean }
export interface ContinentalDef { id: string; name: string; short?: string; rank: 1 | 2 | 3; size: 16 | 32 | 36; /** "league": a 36-club league phase (eight matches each, one table) instead of groups of four. */ format?: 'groups' | 'league'; /** Places per country from the top league (rank 1: top N; rank 2: the next N, and so on). */ places: Record<string, number>; /** Main cup winners also qualify (if not already in a higher competition). */ cupWinners?: boolean; /** Clubs without a league that fill any empty places, best first. */ fillers?: string[] }
export interface ClubDef { id: string; name: string; short?: string; country: string; league?: string; reputation: number; stadium?: string; capacity?: number; nickname?: string; founded?: number; balance?: number; /** Badge colours, e.g. ["#ef0107", "#ffffff"]. */ colours?: [string, string]; /** A reserve side (Jong Ajax, Benfica B): plays in the league but can't be promoted. */ reserve?: boolean }
export interface PlayerDef {
  name: string; club: string; pos: string; age: number; nationality?: string;
  /** Either ability (1–200), overall (1–100) or attributes (1–20). */ ability?: number; overall?: number; potential?: number;
  attributes?: Record<string, number>; number?: number; wage?: number; contractEnd?: number; squad?: Squad;
}
export interface WorldDef {
  format: typeof WORLD_FORMAT; version: number; name: string; startYear?: number;
  countries: CountryDef[]; leagues: LeagueDef[]; cups: CupDef[]; continental: ContinentalDef[]; clubs: ClubDef[]; players?: PlayerDef[];
  /** Named derbies between two club ids, e.g. { "a": "arsenal", "b": "tottenham", "name": "North London derby" }. */
  rivalries?: Array<{ a: string; b: string; name: string }>;
}

/* ---------- validation ---------- */
const POS_ALIASES: Record<string, Position> = {
  GK: 'GK', G: 'GK', CB: 'CB', D: 'CB', LB: 'LB', LWB: 'LB', RB: 'RB', RWB: 'RB', DM: 'DM', CDM: 'DM', CM: 'CM', M: 'CM', AM: 'AM', CAM: 'AM',
  LM: 'LW', LW: 'LW', RM: 'RW', RW: 'RW', ST: 'ST', CF: 'ST', F: 'ST', FW: 'ST',
};
export const normalisePos = (p: string): Position | undefined => POS_ALIASES[String(p).trim().toUpperCase()];

export interface Validation { ok: boolean; errors: string[]; warnings: string[]; summary: string }

/** Checks a parsed world file. Errors stop the import; warnings explain what will be filled in. */
export function validateWorld(raw: unknown): Validation {
  const errors: string[] = [], warnings: string[] = [];
  const w = raw as Partial<WorldDef>;
  const fail = (m: string) => { errors.push(m); };
  if (!w || typeof w !== 'object') return { ok: false, errors: ['The file is not a JSON object.'], warnings, summary: '' };
  if (w.format !== WORLD_FORMAT) fail(`"format" must be "${WORLD_FORMAT}".`);
  if (w.version !== WORLD_VERSION) fail(`"version" must be ${WORLD_VERSION}.`);
  for (const k of ['countries', 'leagues', 'cups', 'continental', 'clubs'] as const) if (!Array.isArray(w[k])) fail(`"${k}" must be a list.`);
  if (errors.length) return { ok: false, errors, warnings, summary: '' };
  const countries = new Set(w.countries!.map((c) => c.id));
  const clubIds = new Set<string>();
  for (const c of w.clubs!) {
    if (!c.id || !c.name) { fail(`A club is missing "id" or "name": ${JSON.stringify(c).slice(0, 80)}`); continue; }
    if (clubIds.has(c.id)) fail(`Club id "${c.id}" is used twice.`);
    clubIds.add(c.id);
    if (!countries.has(c.country)) fail(`Club "${c.name}" has unknown country "${c.country}".`);
    if (typeof c.reputation !== 'number' || c.reputation < 1 || c.reputation > 100) fail(`Club "${c.name}" needs a reputation from 1 to 100.`);
  }
  const leagues = new Map(w.leagues!.map((l) => [l.id, l]));
  for (const l of w.leagues!) {
    if (!countries.has(l.country)) fail(`League "${l.name}" has unknown country "${l.country}".`);
    const n = w.clubs!.filter((c) => c.league === l.id).length;
    if (n < 4) fail(`League "${l.name}" has ${n} clubs; it needs at least 4.`);
    if (n % 2) fail(`League "${l.name}" has ${n} clubs; use an even number.`);
    if (l.playoff && (l.playoff[1] - l.playoff[0] !== 3 || l.playoff[0] <= l.promote)) fail(`League "${l.name}": "playoff" must be four places just below the automatic promotion places, e.g. [3, 6].`);
    if (l.promote + (l.playoff ? 4 : 0) + l.relegate > n) fail(`League "${l.name}": promotion, play-off and relegation places add up to more than its ${n} clubs.`);
  }
  for (const c of w.clubs!) if (c.league && !leagues.has(c.league)) fail(`Club "${c.name}" is in unknown league "${c.league}".`);
  // promotion and relegation must balance between neighbouring tiers
  for (const country of countries) {
    const ls = w.leagues!.filter((l) => l.country === country).sort((a, b) => a.tier - b.tier);
    ls.forEach((l, i) => {
      if (l.tier !== i + 1) fail(`Leagues in ${country} must have tiers 1, 2, 3… with one league per tier (found tier ${l.tier}).`);
      const below = ls[i + 1];
      if (i === 0 && l.promote) fail(`League "${l.name}" is a top league and can't promote clubs.`);
      if (!below && l.relegate) fail(`League "${l.name}" is the bottom league in its country and can't relegate clubs.`);
      if (below && l.relegate !== below.promote + (below.playoff ? 1 : 0)) fail(`"${l.name}" relegates ${l.relegate} but "${below.name}" sends up ${below.promote + (below.playoff ? 1 : 0)}; they must match.`);
    });
  }
  for (const cup of w.cups!) {
    if (!countries.has(cup.country)) fail(`Cup "${cup.name}" has unknown country "${cup.country}".`);
    const entrants = w.clubs!.filter((c) => c.country === cup.country && c.league && cup.tiers.includes(leagues.get(c.league)?.tier ?? 0)).length;
    if (entrants < 4) fail(`Cup "${cup.name}" has only ${entrants} clubs entering.`);
  }
  for (const k of w.continental!) {
    if (k.size !== 16 && k.size !== 32 && k.size !== 36) fail(`Continental competition "${k.name}" must have size 16, 32 or 36.`);
    if (k.size === 36 && k.format !== 'league') fail(`Continental competition "${k.name}": size 36 needs "format": "league".`);
    for (const c of Object.keys(k.places)) if (!countries.has(c)) fail(`"${k.name}" gives places to unknown country "${c}".`);
  }
  let players = 0;
  for (const p of w.players ?? []) {
    players++;
    if (!p.name || !clubIds.has(p.club)) { fail(`Player "${p.name ?? '?'}" has unknown club "${p.club}".`); continue; }
    if (!normalisePos(p.pos)) fail(`Player "${p.name}" has unknown position "${p.pos}" (use GK, CB, LB, RB, DM, CM, AM, LW, RW or ST).`);
    if (typeof p.age !== 'number' || p.age < 14 || p.age > 45) fail(`Player "${p.name}" needs an age from 14 to 45.`);
    if (p.ability === undefined && p.overall === undefined && !p.attributes) fail(`Player "${p.name}" needs "ability" (1–200), "overall" (1–100) or "attributes".`);
    if (errors.length > 50) { errors.push('…and more. Fix these first.'); break; }
  }
  const perClub = new Map<string, number>();
  for (const p of w.players ?? []) perClub.set(p.club, (perClub.get(p.club) ?? 0) + 1);
  const thin = [...clubIds].filter((id) => (perClub.get(id) ?? 0) < 18).length;
  if (thin) warnings.push(`${thin} ${thin === 1 ? 'club has' : 'clubs have'} fewer than 18 players; fictional players will fill their squads.`);
  const summary = `${w.countries!.length} countries · ${w.leagues!.length} leagues · ${w.cups!.length} cups · ${w.continental!.length} continental competitions · ${clubIds.size} clubs · ${players} players`;
  return { ok: errors.length === 0, errors, warnings, summary };
}

/* ---------- building clubs and players ---------- */
const youthCountry = (def: WorldDef, c: ClubDef, userCountry: string) => !!c.league && c.country === userCountry && !!def;

/** Turns a world definition into clubs and players. Missing players are generated from club reputation. */
export function buildWorld(def: WorldDef, rng: Rng, year: number, userCountry: string) {
  reserveNames((def.players ?? []).map((p) => p.name));
  const clubs: Record<string, Club> = {};
  const players: Record<string, Player> = {};
  let n = 1;
  const leagueOf = new Map(def.leagues.map((l) => [l.id, l]));
  for (const c of def.clubs) {
    const tier = c.league ? leagueOf.get(c.league)!.tier : 0;
    clubs[c.id] = {
      id: c.id, name: c.name, short: (c.short ?? c.name.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase(), reputation: c.reputation,
      stadium: c.stadium ?? `${c.name} Stadium`, capacity: c.capacity ?? Math.round(5000 + c.reputation * c.reputation * 8), nickname: c.nickname ?? '', founded: c.founded ?? 1900,
      balance: c.balance ?? Math.round(c.reputation * c.reputation * 9000 / 1e5) * 1e5,
      transferBudget: Math.round(c.reputation * c.reputation * 6000 / 1e5) * 1e5, wageBudget: 0,
      division: tier, league: c.league, country: c.country, colours: c.colours, ...(c.reserve ? { reserve: true } : {}),
    };
  }
  // imported players
  const used = new Map<string, Set<number>>();
  const numberFor = (clubId: string, wanted?: number) => {
    const set = used.get(clubId) ?? new Set<number>(); used.set(clubId, set);
    let num = wanted && !set.has(wanted) ? wanted : 1;
    while (set.has(num)) num++;
    set.add(num); return num;
  };
  for (const pd of def.players ?? []) {
    const club = clubs[pd.club];
    const pos = normalisePos(pd.pos)!;
    let ability = pd.ability ?? (pd.overall !== undefined ? clamp(Math.round(pd.overall * 2 - 10), 1, 200) : undefined);
    let attributes: Record<string, number>;
    if (pd.attributes) {
      attributes = { ...makeAttributes(rng, pos, ability ?? 100), ...Object.fromEntries(Object.entries(pd.attributes).map(([k, v]) => [k, clamp(Math.round(v), 1, 20)])) };
      ability = abilityFromAttributes(attributes, pos);
    } else attributes = makeAttributes(rng, pos, ability!);
    const ca = abilityFromAttributes(attributes, pos);
    const growth = pd.age < 22 ? 30 : pd.age < 26 ? 12 : pd.age < 29 ? 3 : 0;
    // potential is on the same scale as the rating given (overall 1–100, otherwise ability 1–200)
    const pot = pd.potential === undefined ? undefined : pd.overall !== undefined && pd.ability === undefined ? clamp(Math.round(pd.potential * 2 - 10), 1, 200) : pd.potential;
    const squad: Squad = pd.squad ?? (club.league && pd.age <= 18 && ca < 90 ? 'U18' : 'First team');
    const p = makePlayer(rng, { id: `p${n++}`, clubId: club.id, pos, ca, pa: pot ?? clamp(ca + growth, ca, 200), age: pd.age, squad, number: 0, year, reputation: club.reputation, country: club.country });
    p.name = pd.name; p.attributes = attributes; p.ability = ca; p.potential = Math.max(ca, pot ?? p.potential);
    if (pd.nationality) p.nationality = nationCode(pd.nationality) ?? pd.nationality;
    p.number = numberFor(club.id, pd.number);
    p.wage = pd.wage ?? (squad === 'First team' ? wageFor(ca, club.reputation) : p.wage);
    p.contractEnd = pd.contractEnd ? clamp(pd.contractEnd - 1, year, year + 6) : p.contractEnd;
    p.value = valueFor(ca, p.potential, p.age);
    players[p.id] = p;
  }
  // fill squads: first team to 22 by position; youth squads only in the user's country
  const byClub = new Map<string, Player[]>();
  for (const p of Object.values(players)) { const l = byClub.get(p.clubId); if (l) l.push(p); else byClub.set(p.clubId, [p]); }
  const add = (p: Player) => { players[p.id] = p; const l = byClub.get(p.clubId); if (l) l.push(p); else byClub.set(p.clubId, [p]); };
  for (const c of def.clubs) {
    const club = clubs[c.id];
    const own = () => byClub.get(c.id) ?? [];
    let squad = own();
    const mine = squad.filter((p) => p.squad === 'First team');
    const need: Record<string, number> = {};
    for (const pos of SQUAD_TEMPLATE) need[pos] = (need[pos] ?? 0) + 1;
    for (const p of mine) if (need[p.pos]) need[p.pos]--;
    // next to named players, generated ones are the supporting cast: a full named XI gets backups below
    // its weakest regular; a partly named squad gets players around its middle, never above it
    const named = mine.map((p) => p.ability).sort((x, y) => y - x);
    const cap = named.length >= 11 ? named[10] - 4 : named.length >= 5 ? named[Math.floor(named.length / 2)] : 200;
    const level = Math.min(60 + c.reputation * 1.15, cap - (named.length >= 11 ? 6 : 0));
    let i = 0;
    for (const [pos, count] of Object.entries(need)) for (let k = 0; k < count; k++, i++) {
      const starter = i % 2 === 0 && named.length < 11;
      const age = clamp(Math.round(rng.normal(26, 4)), 18, 35);
      const ca = clamp(Math.min(cap, Math.round(rng.normal(level - (starter ? 0 : 12), 9))), 45, 190);
      const growth = age < 22 ? rng.int(15, 55) : age < 26 ? rng.int(3, 25) : rng.int(0, 6);
      const p = makePlayer(rng, { id: `p${n++}`, clubId: c.id, pos: pos as Position, ca, pa: clamp(ca + growth, ca, 200), age, squad: 'First team', number: 0, year, reputation: c.reputation, country: c.country });
      p.number = numberFor(c.id);
      if (def.players?.length) p.filler = true; // squad filler next to named players
      add(p);
    }
    if (youthCountry(def, c, userCountry) && !(squad = own()).some((p) => p.squad !== 'First team')) {
      for (const squad of ['U21', 'U18'] as Squad[]) for (const pos of ['GK', 'CB', 'CB', 'LB', 'CM', 'CM', 'AM', 'RW', 'ST'] as Position[]) {
        const age = squad === 'U21' ? rng.int(18, 20) : rng.int(15, 17);
        const ca = clamp(Math.round(rng.normal(squad === 'U21' ? 50 + c.reputation * 0.5 : 30 + c.reputation * 0.5, 10)), 30, 120);
        const pa = clamp(Math.round(rng.normal(110 + c.reputation * 0.45, 18)), ca + 10, 195);
        const p = makePlayer(rng, { id: `p${n++}`, clubId: c.id, pos, ca, pa, age, squad, number: 0, year, reputation: c.reputation, country: c.country });
        p.number = numberFor(c.id) + 30;
        add(p);
      }
    }
    squad = own();
    const bill = squad.reduce((a, p) => a + p.wage, 0);
    club.wageBudget = Math.round(bill * 1.1 / 1000) * 1000;
    const best = squad.filter((p) => p.squad === 'First team').sort((a, b) => b.ability - a.ability)[0];
    if (best) best.captain = true;
  }
  assignReleaseClauses(clubs, players, rng);
  return { clubs, players, nextId: n };
}
