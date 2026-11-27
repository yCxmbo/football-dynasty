/* AI managers: every other club has a named manager with a rating (1–20), a reputation (1–100), a record and
   trophies. Poor results get them sacked (mid-season or at the end), clubs appoint from the pool of managers out
   of work, and old managers retire. You compete with them for jobs: a vacancy goes to the best candidate. */
import { leagueTableOf } from './competitions';
import { generatedNationality } from './nations';
import { nameFor } from './namepools';
import { clamp } from './ratings';
import { createRng, type Rng } from './rng';
import { seasonLabel, type GameState } from './types';
import type { Formation } from './match';

export interface ManagerSpell { clubId: string; club: string; from: number; to?: number; left?: 'sacked' | 'moved' | 'retired' }
export interface AIManager {
  id: string; name: string; nation: string; age: number;
  /** Tactical and motivational quality, 1–20: a small edge in matches. */
  rating: number;
  /** 1–100: decides which jobs he gets. */
  rep: number;
  clubId?: string;
  w: number; d: number; l: number;
  trophies: string[];
  spells: ManagerSpell[];
}
export interface ManagersState { all: Record<string, AIManager>; byClub: Record<string, string>; next: number }

const RETIRE_AGE = 68;

export function managers(s: GameState): ManagersState {
  if (!s.managers) initManagers(s, createRng((s.rngState ^ 0x6d616e61) >>> 0));
  return s.managers!;
}

function newManager(rng: Rng, m: ManagersState, rep: number, country?: string, age?: number): AIManager {
  const nation = generatedNationality(rng, country);
  const r = clamp(Math.round(rep), 15, 95);
  const mgr: AIManager = { id: `m${m.next++}`, name: nameFor(rng, nation), nation, age: age ?? rng.int(36, 62), rating: clamp(Math.round(r / 5.5 + rng.normal(1.5, 2)), 4, 20), rep: r, w: 0, d: 0, l: 0, trophies: [], spells: [] };
  m.all[mgr.id] = mgr;
  return mgr;
}

function appoint(s: GameState, mgr: AIManager, clubId: string) {
  const m = s.managers!;
  mgr.clubId = clubId;
  m.byClub[clubId] = mgr.id;
  mgr.spells.unshift({ clubId, club: s.clubs[clubId]?.name ?? '?', from: s.year });
  if (mgr.spells.length > 10) mgr.spells.length = 10;
}

function release(s: GameState, clubId: string, left: ManagerSpell['left']): AIManager | undefined {
  const m = managers(s);
  const id = m.byClub[clubId];
  if (!id) return undefined;
  delete m.byClub[clubId];
  const mgr = m.all[id];
  if (!mgr) return undefined;
  mgr.clubId = undefined;
  const sp = mgr.spells[0];
  if (sp && sp.to === undefined) { sp.to = s.year; sp.left = left; }
  return mgr;
}

/** A manager for every club but yours, and a pool of managers out of work. */
export function initManagers(s: GameState, rng: Rng) {
  const m: ManagersState = { all: {}, byClub: {}, next: 1 };
  s.managers = m;
  for (const c of Object.values(s.clubs)) {
    if (c.id === s.userClubId) continue;
    const mgr = newManager(rng, m, c.reputation + rng.normal(0, 7), c.country);
    appoint(s, mgr, c.id);
    mgr.spells[0].from = s.year - rng.int(0, 4);
  }
  topUpPool(s, rng);
}

/** Keeps about one manager out of work for every eight clubs, across all levels. */
function topUpPool(s: GameState, rng: Rng) {
  const m = s.managers!;
  const clubs = Object.values(s.clubs);
  const want = Math.round(clubs.length / 8);
  let free = Object.values(m.all).filter((x) => !x.clubId).length;
  while (free < want) {
    const like = clubs[rng.int(0, clubs.length - 1)];
    newManager(rng, m, like.reputation + rng.normal(-4, 8), like.country, rng.int(34, 55));
    free++;
  }
}

export const managerOf = (s: GameState, clubId: string): AIManager | undefined => {
  const id = s.managers?.byClub[clubId];
  return id ? s.managers!.all[id] : undefined;
};

/** The manager's edge in matches: about ±3%. */
export const managerBoost = (s: GameState, clubId: string) => {
  const mgr = managerOf(s, clubId);
  return mgr ? 1 + (mgr.rating - 11) * 0.0035 : 0.985; // a caretaker is a little worse
};

/** The best manager out of work who would take this job (not one far above it). */
/** The man a club wants: the best manager out of work, or one doing well at a clearly smaller club (poached). */
export function favouriteFor(s: GameState, clubId: string): AIManager | undefined {
  const rep = s.clubs[clubId]?.reputation ?? 50;
  return Object.values(managers(s).all).filter((x) => x.age < RETIRE_AGE && x.rep <= rep + 12 && x.clubId !== clubId
    && (!x.clubId || ((s.clubs[x.clubId]?.reputation ?? 99) <= rep - 8 && x.rep >= rep - 6 && x.clubId !== s.userClubId)))
    .sort((a, b) => b.rep - a.rep)[0];
}

/** A club sacks its manager; the job is open to you and the pool. Returns the manager. */
export function sack(s: GameState, clubId: string) {
  const mgr = release(s, clubId, 'sacked');
  if (mgr) mgr.rep = clamp(mgr.rep - 4, 10, 99);
  return mgr;
}

/** You take a club: its manager (if any) moves to the pool; your old club's job opens. */
export function userTakesOver(s: GameState, fromClubId: string, toClubId: string) {
  if (!s.managers) return;
  release(s, toClubId, 'sacked');
  void fromClubId; // the old club appoints from the pool over the coming weeks (see weeklyAppointments)
}

/** Each league week: vacant clubs appoint the favourite (about one in three each week). Returns news lines. */
export function weeklyAppointments(s: GameState, rng: Rng): Array<{ clubId: string; mgr: AIManager; from?: string }> {
  const m = managers(s);
  const out: Array<{ clubId: string; mgr: AIManager; from?: string }> = [];
  const vacant = Object.keys(s.clubs).filter((id) => id !== s.userClubId && !m.byClub[id]);
  for (const id of vacant.sort((a, b) => s.clubs[b].reputation - s.clubs[a].reputation)) {
    if (!rng.chance(0.35)) continue;
    const mgr = favouriteFor(s, id) ?? newManager(rng, m, s.clubs[id].reputation - 6, s.clubs[id].country);
    const from = mgr.clubId;
    if (from) { release(s, from, 'moved'); if (s.career && !s.career.vacancies.includes(from)) s.career.vacancies.push(from); }
    appoint(s, mgr, id);
    out.push({ clubId: id, mgr, from });
    if (s.career) s.career.vacancies = s.career.vacancies.filter((x) => x !== id);
  }
  if (out.length) topUpPool(s, rng);
  return out;
}

/** Mid-season: clubs far below target may sack their manager (from a third of the way in). */
export function midSeasonSackings(s: GameState, rng: Rng, week: number, target: (id: string) => { pos: number }): string[] {
  if (week < Math.round(s.leagueWeeks / 3)) return [];
  const out: string[] = [];
  for (const l of s.world.leagues) {
    const t = leagueTableOf(s, l.id);
    t.forEach((r, i) => {
      if (r.clubId === s.userClubId || !managerOf(s, r.clubId)) return;
      const miss = i + 1 - target(r.clubId).pos;
      if (miss >= 6 && rng.chance(0.07 + Math.min(0.2, (miss - 6) * 0.03))) { sack(s, r.clubId); out.push(r.clubId); }
    });
  }
  if (s.career) for (const id of out) if (!s.career.vacancies.includes(id)) s.career.vacancies.push(id);
  return out;
}

/** End of season: records and reputations from the final tables and trophies, sackings at the given clubs,
    ageing and retirement. `honours` lists each club's trophies this season. */
export function managersAfterSeason(s: GameState, rng: Rng, sackings: string[], honours: Record<string, string>, target: (id: string) => { pos: number }) {
  const m = managers(s);
  for (const l of s.world.leagues) {
    leagueTableOf(s, l.id).forEach((r, i) => {
      const mgr = managerOf(s, r.clubId);
      if (!mgr) return;
      mgr.w += r.w; mgr.d += r.d; mgr.l += r.l;
      const won = honours[r.clubId] ? honours[r.clubId].split(', ') : [];
      mgr.trophies.unshift(...won.map((t) => `${t} ${seasonLabel(s.year)}`));
      if (mgr.trophies.length > 30) mgr.trophies.length = 30;
      const delta = clamp((target(r.clubId).pos - (i + 1)) * 0.8, -4, 4) + won.length * 1.5;
      // reputation drifts toward the size of the club he manages, plus results; harder to gain near the top
      const gain = delta > 0 ? delta * Math.max(0.15, (100 - mgr.rep) / 40) : delta;
      mgr.rep = clamp(Math.round(mgr.rep + gain + ((s.clubs[r.clubId].reputation - mgr.rep) * 0.2)), 10, 98);
      mgr.rating = clamp(mgr.rating + (delta >= 4 && rng.chance(0.3) ? 1 : delta <= -4 && rng.chance(0.2) ? -1 : 0), 3, 20);
    });
  }
  for (const id of sackings) if (id !== s.userClubId) sack(s, id);
  for (const mgr of Object.values(m.all)) {
    mgr.age++;
    if (mgr.age >= RETIRE_AGE || (mgr.age >= 60 && rng.chance(0.08)) || (!mgr.clubId && mgr.age >= 55 && rng.chance(0.25))) {
      if (mgr.clubId) release(s, mgr.clubId, 'retired');
      delete m.all[mgr.id];
    }
  }
  // out of work for long, a manager slips down the ladder
  for (const mgr of Object.values(m.all)) if (!mgr.clubId) mgr.rep = clamp(mgr.rep - 2, 10, 99);
  topUpPool(s, rng);
}

/** The best managers in the world now, by reputation. */
export const topManagers = (s: GameState, n = 25) => Object.values(managers(s).all).sort((a, b) => b.rep - a.rep).slice(0, n);

/** The shapes computer-run managers favour (the most common more often). */
const AI_FORMATIONS: Formation[] = ['4-3-3', '4-3-3', '4-3-3', '4-2-3-1', '4-2-3-1', '4-2-3-1', '4-4-2', '4-4-2', '4-3-3 DM', '4-1-4-1', '3-4-2-1', '3-5-2', '5-3-2', '4-4-2 diamond', '3-4-3', '4-4-1-1', '5-4-1'];
/** A club's formation under its manager: each manager has his favourite. */
export function aiFormation(s: GameState, clubId: string): Formation {
  const id = s.managers?.byClub[clubId] ?? clubId;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AI_FORMATIONS[h % AI_FORMATIONS.length];
}
