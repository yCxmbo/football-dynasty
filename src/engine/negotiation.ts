/* Contract talks with your own players, beyond wage and length: the squad role you promise him (his playing-time
   expectation), yearly wage rises, relegation and promotion wage clauses, a minimum-fee release clause, and
   promises (the captaincy, a quality signing this window). Each term moves the wage he'll accept. Terms then
   play out: rises and clauses apply each summer, the role sets what he expects in the dressing room, and a
   broken promise is remembered the next time you sit down with him. */
import { squadOf } from './index';
import { expectedRole, SQUAD_ROLES, wageBill, wageDemand, type SquadRole } from './transfers';
import { wantsOut } from './contracts';
import { nextWindow, openWindow, dateOf } from './windows';
import type { GameState, Player } from './types';

export interface ContractTerms {
  role?: SquadRole;
  /** % added to his wage each summer. */ rise?: number;
  /** % his wage drops if the club is relegated / rises if promoted. */ relegationCut?: number; promotionRise?: number;
  /** Release clause: any club paying this, in full, can take him. 0 for none. */ minFee?: number;
}
export type PromiseKind = 'captain' | 'signing';
export interface ContractPromise { kind: PromiseKind; made: string; due: string; minAbility?: number; /** Your squad when the promise was made: a new face must arrive. */ squadAt?: string[] }
export interface Offer { wage: number; years: number; terms: ContractTerms; promises: PromiseKind[] }

/** Share of games each role expects to play. */
export const ROLE_SHARE: Record<SquadRole, number> = { 'Star player': 0.75, 'Important player': 0.62, 'Regular starter': 0.5, 'Squad player': 0.3, 'Fringe player': 0.1, 'Hot prospect': 0.2, Youngster: 0.1 };

/** The wage he'd accept for this package (his demand moved by each term). */
export function askingWage(s: GameState, p: Player, o: Omit<Offer, 'wage'>) {
  let k = 1;
  const exp = SQUAD_ROLES.indexOf(expectedRole(s, p)), got = SQUAD_ROLES.indexOf(o.terms.role ?? expectedRole(s, p));
  if (got < exp) k -= Math.min(2, exp - got) * 0.05; // a bigger role than he expected
  k -= ((o.terms.rise ?? 0) / 5) * 0.04;
  k += ((o.terms.relegationCut ?? 0) / 25) * 0.03;
  k -= ((o.terms.promotionRise ?? 0) / 25) * 0.02;
  if (o.terms.minFee) k -= o.terms.minFee <= p.value * 1.6 ? 0.06 : 0.03;
  if (o.promises.includes('captain')) k -= (p.attributes.Leadership ?? 10) >= 13 ? 0.05 : 0.02;
  if (o.promises.includes('signing')) k -= 0.04;
  k += (p.brokenPromises ?? 0) * 0.08; // he remembers
  return Math.round((wageDemand(s, p, true) * Math.max(0.75, k)) / 500) * 500;
}

/** Why a package won't work before wages are even discussed, or null. */
export function blocked(s: GameState, p: Player, o: Omit<Offer, 'wage'>): string | null {
  const exp = SQUAD_ROLES.indexOf(expectedRole(s, p)), got = SQUAD_ROLES.indexOf(o.terms.role ?? expectedRole(s, p));
  if (got - exp >= 2 && got < SQUAD_ROLES.indexOf('Hot prospect')) return `${p.name} expects to be a ${expectedRole(s, p).toLowerCase()} and won't accept a smaller role.`;
  if (o.promises.includes('signing') && !openWindow(s, s.clubs[s.userClubId]?.country) && !nextWindow(s, s.clubs[s.userClubId]?.country)) return 'There is no transfer window left this season to keep that promise in.';
  return null;
}

/** Offer a new contract. Returns null when he signs, else why not. */
export function negotiate(s: GameState, playerId: string, o: Offer): string | null {
  const p = s.players[playerId];
  if (!p || p.clubId !== s.userClubId) return 'Not your player.';
  if (p.age >= 32 && o.years > 2) return `${p.name} only wants up to 2 years at this age.`;
  if (p.preContract) return `${p.name} has signed a pre-contract elsewhere and is leaving in the summer.`;
  if (wantsOut(s, p)) return `${p.name} won't sign. He wants to see out his contract and move on.`;
  const why = blocked(s, p, o);
  if (why) return why;
  const club = s.clubs[s.userClubId];
  if (o.wage - p.wage > club.wageBudget - wageBill(s)) return 'The board refuses: the raise would take you over the wage budget.';
  const want = askingWage(s, p, o);
  if (o.wage < want * 0.97) return `${p.name} turns it down. For this package he wants about ${Math.round(want / 1000)}k a week.`;
  const over = s.matchday > s.calendar.length;
  p.wage = o.wage; p.contractEnd = s.year + o.years - (over ? 0 : 1);
  if (p.contractType === 'youth' && p.squad === 'First team') p.contractType = 'full-time';
  if (p.morale === 'low') p.morale = 'ok';
  p.terms = { ...(o.terms.role ? { role: o.terms.role } : {}), ...(o.terms.rise ? { rise: o.terms.rise } : {}), ...(o.terms.relegationCut ? { relegationCut: o.terms.relegationCut } : {}), ...(o.terms.promotionRise ? { promotionRise: o.terms.promotionRise } : {}) };
  if (o.terms.minFee) p.releaseClause = o.terms.minFee; else delete p.releaseClause;
  const today = dateOf(s);
  for (const k of o.promises) {
    if (k === 'captain') { for (const q of squadOf(s, s.userClubId)) q.captain = q.id === p.id; continue; }
    const w = openWindow(s, club.country) ?? nextWindow(s, club.country);
    const mine = squadOf(s, s.userClubId).filter((x) => x.squad === 'First team').map((x) => x.ability).sort((a, b) => b - a);
    (p.promises ??= []).push({ kind: 'signing', made: today, due: w?.to ?? today, minAbility: mine[4] ?? p.ability, squadAt: squadOf(s, s.userClubId).map((x) => x.id) });
  }
  return null;
}

/** Daily: a signing promise whose window has closed is judged: kept if a player at least as good as your fifth-best
    joined since it was made. Returns messages for kept and broken promises. */
export function checkContractPromises(s: GameState): Array<{ p: Player; kept: boolean }> {
  const today = dateOf(s), out: Array<{ p: Player; kept: boolean }> = [];
  for (const p of squadOf(s, s.userClubId)) {
    if (!p.promises?.length) continue;
    p.promises = p.promises.filter((pr) => {
      if (today <= pr.due) return true;
      const before = new Set(pr.squadAt ?? []);
      const kept = squadOf(s, s.userClubId).some((x) => x.id !== p.id && !before.has(x.id) && x.ability >= (pr.minAbility ?? 0));
      if (!kept) { p.brokenPromises = (p.brokenPromises ?? 0) + 1; p.morale = 'low'; } else if (p.morale !== 'high') p.morale = 'high';
      out.push({ p, kept });
      return false;
    });
    if (!p.promises.length) delete p.promises;
  }
  return out;
}

/** Summer: yearly rises, and relegation or promotion clauses. */
export function summerWages(s: GameState, move?: 'promoted' | 'relegated') {
  for (const p of squadOf(s, s.userClubId)) {
    const t = p.terms;
    if (!t) continue;
    let w = p.wage;
    if (t.rise) w *= 1 + t.rise / 100;
    if (move === 'relegated' && t.relegationCut) w *= 1 - t.relegationCut / 100;
    if (move === 'promoted' && t.promotionRise) w *= 1 + t.promotionRise / 100;
    p.wage = Math.round(w / 500) * 500;
  }
}
