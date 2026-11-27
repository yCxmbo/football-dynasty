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
import { favouriteFor, userTakesOver } from './managers';

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
  /** Your contract: weekly wage (EUR) and the last season it covers (by start year). */
  contract?: { wage: number; until: number };
  /** Everything you have earned as a manager: wages and compensation. */
  earnings?: number;
  /** The season you last asked the board for a new contract. */
  asked?: number;
  /** What you promised at your interview: the board holds you to it for your first season. */
  promise?: { clubId: string; season: number; pos: number; text: string };
}

/** A manager's weekly wage at a club: steeply up with the club's size, a little up with your reputation. */
export function managerWage(s: GameState, clubId: string) {
  const rep = s.clubs[clubId]?.reputation ?? 50;
  const w = Math.pow(rep, 3) * 0.4 * (0.85 + managerReputation(s) / 300);
  return Math.max(2000, Math.round(w / 1000) * 1000);
}

/** Wage and length for a new job: offers (they came to you) give three seasons, appointments after an interview two. */
export const jobContract = (s: GameState, clubId: string, years: number) => ({ wage: managerWage(s, clubId), until: s.year + years - 1 });

/** Seasons left on your contract, counting this one. */
export const yearsLeft = (s: GameState) => Math.max(0, (career(s).contract?.until ?? s.year) - s.year + 1);

/** Paid off when sacked: half the wages still owed (at least half a season). */
export function compensation(s: GameState) {
  const c = career(s);
  if (!c.contract) return 0;
  const owed = c.contract.wage * 52 * Math.max(0.5, yearsLeft(s) - 0.5);
  return Math.round(owed * 0.5 / 1000) * 1000;
}

/** Ask the board for a new contract: with their trust high and two seasons or fewer left, they extend it by three
    seasons and raise your wage. Once a season. Returns the board's answer. */
export function requestNewContract(s: GameState, confidence: number): { ok: boolean; text: string } {
  const c = career(s);
  if (c.sacked || !c.contract) return { ok: false, text: 'You have no contract to renew.' };
  if (c.asked === s.year) return { ok: false, text: 'You have already asked this season.' };
  c.asked = s.year;
  if (yearsLeft(s) > 2) return { ok: false, text: 'The board points out that your contract still has years to run.' };
  if (confidence < 70) return { ok: false, text: 'The board wants to see more before committing to you. Ask again once results improve.' };
  const old = c.contract.wage;
  c.contract = { wage: Math.max(Math.round(old * 1.15 / 1000) * 1000, managerWage(s, s.userClubId)), until: s.year + 3 };
  return { ok: true, text: `The board agrees: a new deal until ${s.year + 3}/${String((s.year + 4) % 100).padStart(2, '0')}, with your wage up from ${Math.round(old / 1000)}k to ${Math.round(c.contract.wage / 1000)}k a week.` };
}

/* ---------- job interviews ---------- */
export interface InterviewQuestion { q: string; options: Array<{ label: string; score: number; promise?: number }> }
type Size = 'giant' | 'established' | 'small';
const sizeOf = (s: GameState, clubId: string): Size => { const r = s.clubs[clubId]?.reputation ?? 50; return r >= 80 ? 'giant' : r >= 60 ? 'established' : 'small'; };

/** Three questions; what the board wants to hear depends on the club's size. `target` is the board's usual target position. */
export function interviewQuestions(s: GameState, clubId: string, target: number): InterviewQuestion[] {
  const size = sizeOf(s, clubId);
  const n = s.clubs[clubId]?.league ? clubsInLeague(s, s.clubs[clubId].league!).length : 20;
  const higher = Math.max(1, target - 3), lower = Math.min(n, target + 3);
  return [
    { q: 'What can the club achieve in your first season?', options: [
      { label: higher <= 1 ? 'Win the league' : `Finish ${ordinalWord(higher)} or higher`, score: size === 'small' ? 0.5 : 1, promise: higher },
      { label: `Finish ${ordinalWord(target)} or higher, as the board expects`, score: 0.5, promise: target },
      { label: `A season of rebuilding: ${ordinalWord(lower)} would be fine`, score: size === 'giant' ? -2 : size === 'established' ? -1 : -0.5 },
    ] },
    { q: 'How will your team play?', options: [
      { label: 'Attacking, front-foot football', score: size === 'giant' ? 1 : size === 'established' ? 0.5 : -0.5 },
      { label: 'Balanced and pragmatic', score: size === 'established' ? 1 : 0.5 },
      { label: 'Hard to beat, organised first', score: size === 'small' ? 1 : size === 'giant' ? -1 : 0 },
      { label: 'Built around young players', score: size === 'small' ? 0.5 : size === 'established' ? 0.5 : -0.5 },
    ] },
    { q: 'What do you need in the transfer market?', options: [
      { label: 'Big signings to compete at once', score: size === 'giant' ? 0.5 : size === 'established' ? -0.5 : -1 },
      { label: 'I can work within the budget', score: size === 'small' ? 1 : 0.5 },
      { label: 'Give the academy a chance', score: size === 'giant' ? -0.5 : 0.5 },
    ] },
  ];
}
const ordinalWord = (n: number) => { const x = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (x[(v - 20) % 10] || x[v] || x[0]); };

/** Your chance after the interview: the usual chance moved by how well your answers fit (about ±8% per point). */
export function interviewChance(s: GameState, clubId: string, target: number, answers: number[]) {
  const qs = interviewQuestions(s, clubId, target);
  const score = answers.reduce((a, pick, i) => a + (qs[i]?.options[pick]?.score ?? 0), 0);
  return clamp(applyChance(s, clubId) + score * 0.08, 0.03, 0.97);
}

export function career(s: GameState): CareerState {
  if (!s.career) {
    const club = s.clubs[s.userClubId];
    s.career = { trust: 65, offers: [], vacancies: [], spells: [{ clubId: club.id, club: club.name, from: s.manager.since, w: 0, d: 0, l: 0, trophies: 0, start: { w: 0, d: 0, l: 0, trophies: 0 } }] };
  }
  if (!s.career.contract && s.clubs[s.userClubId]) { s.career.contract = jobContract(s, s.userClubId, 3); s.career.earnings ??= 0; }
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

/** The chance a club appoints you when you apply: your reputation against the club's and the best rival candidate's. */
export const applyChance = (s: GameState, clubId: string) => {
  const rival = favouriteFor(s, clubId);
  const bar = Math.max(s.clubs[clubId].reputation, (rival?.rep ?? 0) - 4);
  return clamp((managerReputation(s) - bar + 14) / 28, 0.05, 0.95);
};

/** Applies for a vacancy; the club answers at once. Returns true if appointed. */
export function applyFor(s: GameState, rng: Rng, clubId: string, chance = applyChance(s, clubId)) {
  const c = career(s);
  if (!c.vacancies.includes(clubId)) return false;
  c.vacancies = c.vacancies.filter((x) => x !== clubId);
  return rng.next() < chance;
}

/** Leaves your club (sacked, resigned or moved) and takes over another. */
export function moveTo(s: GameState, rng: Rng, clubId: string, left: ClubSpell['left'], years = 3) {
  const c = career(s);
  c.contract = jobContract(s, clubId, years);
  c.promise = undefined;
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
  userTakesOver(s, s.userClubId, clubId);
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
  moveTo(s, rng, clubId, wasSacked ? 'sacked' : 'moved', 2);
  return true;
}

/** An interview for a vacancy: the club decides at once. Appointed, you move on a two-season contract and
    the board holds you to any promise about the league position. `target` is the board's usual target. */
export function interviewForJob(s: GameState, clubId: string, target: number, answers: number[]) {
  const c = career(s);
  const wasSacked = !!c.sacked;
  const rng = actionRng(s);
  s.nextId++;
  const chance = interviewChance(s, clubId, target, answers);
  if (!applyFor(s, rng, clubId, chance)) return false;
  moveTo(s, rng, clubId, wasSacked ? 'sacked' : 'moved', 2);
  const promised = interviewQuestions(s, clubId, target)[0].options[answers[0]]?.promise;
  if (promised !== undefined && promised < target) c.promise = { clubId, season: s.year, pos: promised, text: promised <= 1 ? 'win the league, as you promised' : `finish ${ordinalWord(promised)} or higher, as you promised` };
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
