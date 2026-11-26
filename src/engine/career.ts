/* A manager's career across clubs: board confidence carried between seasons, the sack, offers from other
   clubs, applying for vacancies, and moving to a new club (in any country). */
import { clubsInLeague, leagueDef, leagueTableOf, roundsOf } from './competitions';
import { noteJoined } from './index';
import { pickLineup } from './match';
import { managerReputation } from './nationaljob';
import { createRng, type Rng } from './rng';
import { clamp, type Position } from './ratings';
import type { GameState, Squad } from './types';
import { makePlayer } from './world';
import { initStaff } from './staff';

export interface ClubSpell { clubId: string; club: string; from: number; to?: number; w: number; d: number; l: number; trophies: number; left?: 'sacked' | 'resigned' | 'moved'; start: { w: number; d: number; l: number; trophies: number } }
export interface CareerState {
  /** Board confidence banked from previous seasons, 0–100. */
  trust: number;
  spells: ClubSpell[];
  /** Clubs that want you (until the end of next season). */
  offers: Array<{ clubId: string; note: string }>;
  /** Clubs looking for a manager, which you can apply to (once each). */
  vacancies: string[];
  /** Out of work: pick a new club before playing on. */
  sacked?: boolean;
}

export function career(s: GameState): CareerState {
  if (!s.career) {
    const club = s.clubs[s.userClubId];
    s.career = { trust: 65, offers: [], vacancies: [], spells: [{ clubId: club.id, club: club.name, from: s.manager.since, w: 0, d: 0, l: 0, trophies: 0, start: { w: 0, d: 0, l: 0, trophies: 0 } }] };
  }
  return s.career;
}

/** The board's target for a club this season: the league position it should reach. */
type Target = { pos: number; text: string };

/** Confidence now: banked trust, moving toward how the season is going as it goes on. */
export function boardConfidence(s: GameState, target: Target) {
  const c = career(s);
  const club = s.clubs[s.userClubId];
  if (!club.league) return c.trust;
  const t = leagueTableOf(s, club.league);
  const row = t.findIndex((r) => r.clubId === club.id);
  const played = t[row]?.p ?? 0;
  if (!played) return c.trust;
  const pos = row + 1;
  const now = clamp(100 - (pos - target.pos) * 12 - (pos > target.pos ? 10 : 0), 5, 98);
  const weight = Math.min(0.85, (played / roundsOf(s, club.league)) * 1.3);
  return Math.round(c.trust * (1 - weight) + now * weight);
}

export const confidenceWord = (c: number) => (c >= 80 ? 'Very pleased' : c >= 60 ? 'Satisfied' : c >= 40 ? 'Concerned' : c >= 20 ? 'Losing patience' : 'Your job is at risk');

/** Mid-season: a board whose confidence has collapsed sacks you (not before the first third of the season). */
export function midSeasonVerdict(s: GameState, target: Target, week: number) {
  return week >= Math.round(s.leagueWeeks / 3) && boardConfidence(s, target) < 12;
}

/** End of season: new trust from the final position and trophies. Returns whether you are sacked. */
export function seasonVerdict(s: GameState, target: Target, outcome: { pos: number; champion: boolean; promoted: boolean; relegated: boolean; trophies: number }) {
  const c = career(s);
  const perf = clamp(100 - (outcome.pos - target.pos) * 12 - (outcome.pos > target.pos ? 10 : 0), 5, 98);
  let trust = Math.round(c.trust * 0.35 + perf * 0.65) + outcome.trophies * 6 + (outcome.champion ? 10 : 0) + (outcome.promoted ? 12 : 0) - (outcome.relegated ? 40 : 0);
  trust = clamp(trust, 0, 100);
  c.trust = trust;
  return trust < 25;
}

/** Clubs whose own season went badly enough to change manager (by league target), any country. */
export function vacanciesAfterSeason(s: GameState, rng: Rng, boardTarget: (id: string) => Target) {
  const out: string[] = [];
  for (const l of s.world.leagues) {
    const t = leagueTableOf(s, l.id);
    t.forEach((r, i) => {
      if (r.clubId === s.userClubId) return;
      const target = boardTarget(r.clubId);
      const miss = i + 1 - target.pos;
      if (miss >= 4 || (l.relegate && i >= t.length - l.relegate)) { if (rng.chance(0.55)) out.push(r.clubId); }
    });
  }
  return out;
}

/** Offers: clubs a little bigger than yours after a good season, or a step down after the sack. */
export function makeOffers(s: GameState, rng: Rng, vacancies: string[], mode: 'good' | 'sacked') {
  const rep = managerReputation(s);
  const mine = s.clubs[s.userClubId].reputation;
  const lo = mode === 'sacked' ? mine - 30 : mine + 2, hi = mode === 'sacked' ? Math.min(mine - 3, rep) : rep + 6;
  const pool = vacancies.map((id) => s.clubs[id]).filter((c) => c && c.league && c.id !== s.userClubId && c.reputation >= lo && c.reputation <= hi);
  // a few more clubs in a sacked manager's market, so there is always a way back
  if (mode === 'sacked' && pool.length < 3) {
    const extra = Object.values(s.clubs).filter((c) => c.league && c.id !== s.userClubId && c.reputation >= lo && c.reputation <= hi && !pool.includes(c));
    while (pool.length < 4 && extra.length) pool.push(extra.splice(rng.int(0, extra.length - 1), 1)[0]);
  }
  const n = mode === 'sacked' ? 4 : rng.int(0, 3);
  const picked = pool.sort(() => rng.next() - 0.5).slice(0, n);
  return picked.map((c) => ({ clubId: c.id, note: mode === 'sacked' ? `${c.name} would give you a fresh start.` : `${c.name} want you as their new manager.` }));
}

/** The chance a club appoints you when you apply: your reputation against theirs. */
export const applyChance = (s: GameState, clubId: string) => clamp((managerReputation(s) - s.clubs[clubId].reputation + 14) / 28, 0.05, 0.95);

/** Applies for a vacancy; the club answers at once. Returns true if appointed. */
export function applyFor(s: GameState, rng: Rng, clubId: string) {
  const c = career(s);
  if (!c.vacancies.includes(clubId)) return false;
  c.vacancies = c.vacancies.filter((x) => x !== clubId);
  return rng.next() < applyChance(s, clubId);
}

/** Leaves your club (sacked, resigned or moved) and takes over another. */
export function moveTo(s: GameState, rng: Rng, clubId: string, left: ClubSpell['left']) {
  const c = career(s);
  const now = { w: s.manager.w, d: s.manager.d, l: s.manager.l, trophies: s.manager.trophies.length };
  const cur = c.spells[c.spells.length - 1];
  if (cur && cur.to === undefined) {
    cur.to = s.year; cur.left = cur.left ?? left;
    cur.w = now.w - cur.start.w; cur.d = now.d - cur.start.d; cur.l = now.l - cur.start.l; cur.trophies = now.trophies - cur.start.trophies;
  }
  const club = s.clubs[clubId];
  c.spells.push({ clubId, club: club.name, from: s.year, w: 0, d: 0, l: 0, trophies: 0, start: now });
  c.trust = 65; c.sacked = false;
  c.offers = []; // offers lapse once you take a job
  c.vacancies = c.vacancies.filter((id) => id !== clubId);
  s.userClubId = clubId;
  s.world.userCountry = club.country;
  // things that belonged to the old job
  s.transferListed = []; s.negotiations = {}; s.installments = []; s.training.focus = {};
  for (const b of s.bids) if (b.status === 'open') b.status = 'expired';
  ensureYouth(s, rng, clubId);
  initStaff(s, rng); // staff belong to the club: you inherit theirs
  const squad = Object.values(s.players).filter((p) => p.clubId === clubId);
  s.lineup = pickLineup(squad, s.formation);
}

/** Running numbers for the current club (its spell is still open). */
export function currentSpell(s: GameState): ClubSpell {
  const c = career(s);
  const cur = c.spells[c.spells.length - 1];
  return { ...cur, w: s.manager.w - cur.start.w, d: s.manager.d - cur.start.d, l: s.manager.l - cur.start.l, trophies: s.manager.trophies.length - cur.start.trophies };
}

/** Youth squads for a club taken over in a country where academies weren't simulated yet. */
function ensureYouth(s: GameState, rng: Rng, clubId: string) {
  const c = s.clubs[clubId];
  if (Object.values(s.players).some((p) => p.clubId === clubId && p.squad !== 'First team')) return;
  for (const squad of ['U21', 'U18'] as Squad[]) for (const pos of ['GK', 'CB', 'CB', 'LB', 'CM', 'CM', 'AM', 'RW', 'ST'] as Position[]) {
    const age = squad === 'U21' ? rng.int(18, 20) : rng.int(15, 17);
    const ca = clamp(Math.round(rng.normal(squad === 'U21' ? 50 + c.reputation * 0.5 : 30 + c.reputation * 0.5, 10)), 30, 120);
    const pa = clamp(Math.round(rng.normal(110 + c.reputation * 0.45, 18)), ca + 10, 195);
    const p = makePlayer(rng, { id: `p${s.nextId++}`, clubId, pos, ca, pa, age, squad, number: 0, year: s.year, reputation: c.reputation, country: c.country });
    p.number = 40 + rng.int(0, 59);
    s.players[p.id] = p; noteJoined(s, p);
  }
}

/** Where a club stands for the career screen: league and rough size. */
export function clubLine(s: GameState, clubId: string) {
  const c = s.clubs[clubId];
  const l = leagueDef(s, c.league);
  const rank = l ? clubsInLeague(s, l.id).map((id) => s.clubs[id]).sort((a, b) => b.reputation - a.reputation).findIndex((x) => x.id === clubId) + 1 : 0;
  return { league: l?.name ?? 'No league', country: s.world.countries.find((k) => k.id === c.country)?.name ?? c.country, rank, reputation: c.reputation };
}

/* ---------- actions from the career screen ---------- */
const actionRng = (s: GameState) => createRng((s.rngState ^ (s.nextId * 2654435761)) >>> 0);

export function acceptOffer(s: GameState, clubId: string) {
  const c = career(s);
  if (!c.offers.some((o) => o.clubId === clubId)) return;
  moveTo(s, actionRng(s), clubId, c.sacked ? 'sacked' : 'moved');
}

/** Returns true if the club appoints you (you move at once). */
export function applyForJob(s: GameState, clubId: string) {
  const c = career(s);
  const wasSacked = !!c.sacked;
  const rng = actionRng(s);
  s.nextId++;
  if (!applyFor(s, rng, clubId)) return false;
  moveTo(s, rng, clubId, wasSacked ? 'sacked' : 'moved');
  return true;
}

/** Walks out: you pick your next club from whoever will have you. */
export function resign(s: GameState) {
  const c = career(s);
  if (c.sacked) return;
  const cur = c.spells[c.spells.length - 1];
  cur.left = 'resigned';
  c.sacked = true;
  c.offers = makeOffers(s, actionRng(s), c.vacancies, 'sacked');
}
