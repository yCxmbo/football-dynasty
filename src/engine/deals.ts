/* The small print of transfers, made real: add-ons (appearance fees and goal bonuses paid to the selling club),
   sell-on clauses (a share of the next sale), buy-back clauses (re-sign a player you sold for a set fee), fees paid
   in instalments both ways, agents' fees, and swap deals (a player of yours as part of the fee). */
import type { GameState, Player } from './types';
import { dateOf } from './windows';
import { formatDate } from './fixtures';

export type Clause =
  | { kind: 'sellOn'; playerId: string; holderId: string; pct: number }
  | { kind: 'buyBack'; playerId: string; holderId: string; fee: number; until: number }
  /** Lump sums: `appFee` once he has played 25 games for the buyer, `goalBonus` once he has scored 15. */
  | { kind: 'addOn'; playerId: string; payerId: string; payeeId: string; appFee: number; goalBonus: number; until: number; apps?: number; goals?: number };

const clauses = (s: GameState) => (s.clauses ??= []);
function hash(t: string) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export function addClause(s: GameState, c: Clause) { clauses(s).push(c); }
export const clausesFor = (s: GameState, playerId: string) => (s.clauses ?? []).filter((c) => c.playerId === playerId);

function pay(s: GameState, fromId: string, toId: string, amount: number) {
  if (amount <= 0) return;
  const from = s.clubs[fromId], to = s.clubs[toId];
  if (from) from.balance -= amount;
  if (to) to.balance += amount;
  if (s.ledger) {
    if (fromId === s.userClubId) s.ledger.expenses.transfers += amount;
    if (toId === s.userClubId) s.ledger.income.sales += amount;
  }
}

/** A sale has gone through (any clubs): pay any sell-on share to the clause holder, and end the player's
    clauses (they belonged to the deal that brought him to the seller). Returns the share paid to you, if any. */
export function settleSale(s: GameState, playerId: string, sellerId: string, fee: number): number {
  let toUser = 0;
  for (const c of clausesFor(s, playerId)) {
    if (c.kind === 'sellOn' && c.holderId !== sellerId) {
      const share = Math.round((fee * c.pct) / 100);
      pay(s, sellerId, c.holderId, share);
      if (c.holderId === s.userClubId && share > 0) {
        toUser += share;
        const p = s.players[playerId];
        s.inbox.unshift({ id: `m${s.nextId++}`, date: formatDate(dateOf(s)), unread: true, category: 'finance', from: 'Director of football', playerId,
          subject: `Sell-on: ${Math.round(share / 1e5) / 10}M from the sale of ${p?.name ?? 'a former player'}`,
          body: [`${s.clubs[sellerId]?.name} have sold ${p?.name ?? 'him'} for ${Math.round(fee / 1e5) / 10}M. Our ${c.pct}% sell-on clause brings in ${Math.round(share / 1e5) / 10}M.`] });
      }
    }
  }
  s.clauses = (s.clauses ?? []).filter((c) => c.playerId !== playerId);
  return toUser;
}

export const ADDON_APPS = 25, ADDON_GOALS = 15;
/** After one of your matches: counts towards add-ons owed to the clubs you bought from, paid when reached. */
export function payAddOns(s: GameState, ratings: Array<{ playerId: string; goals: number; minutes: number }>) {
  for (const c of s.clauses ?? []) {
    if (c.kind !== 'addOn' || c.payerId !== s.userClubId || c.until < s.year) continue;
    const r = ratings.find((x) => x.playerId === c.playerId && x.minutes > 0);
    if (!r || s.players[c.playerId]?.clubId !== s.userClubId) continue;
    const apps = (c.apps ?? 0) + 1, goals = (c.goals ?? 0) + r.goals;
    if (c.appFee && (c.apps ?? 0) < ADDON_APPS && apps >= ADDON_APPS) { pay(s, c.payerId, c.payeeId, c.appFee); c.appFee = 0; }
    if (c.goalBonus && (c.goals ?? 0) < ADDON_GOALS && goals >= ADDON_GOALS) { pay(s, c.payerId, c.payeeId, c.goalBonus); c.goalBonus = 0; }
    c.apps = apps; c.goals = goals;
  }
  // add-ons that are paid off, or past their last season, lapse
  s.clauses = (s.clauses ?? []).filter((c) => c.kind !== 'addOn' || (c.until >= s.year && (c.appFee > 0 || c.goalBonus > 0)));
}

/** What his agent wants for the deal: a share of the fee (or a year's wages for a free agent). Some agents are
    greedier than others. */
export function agentDemand(p: Player, fee: number) {
  const greedy = hash(p.id + 'agent') % 4 === 0;
  const base = fee > 0 ? fee * 0.05 : p.wage * 26;
  return Math.round((base * (greedy ? 1.6 : 1)) / 50_000) * 50_000;
}
export const greedyAgent = (p: Player) => hash(p.id + 'agent') % 4 === 0;

/** A buy-back you hold that can be used now (the player is at the club you sold him to). */
export function buyBackFor(s: GameState, playerId: string) {
  const c = clausesFor(s, playerId).find((x) => x.kind === 'buyBack' && x.holderId === s.userClubId) as Extract<Clause, { kind: 'buyBack' }> | undefined;
  if (!c || c.until < s.year) return undefined;
  const p = s.players[playerId];
  return p && p.clubId !== s.userClubId ? c : undefined;
}

/** Terms a computer club offers in a bid: sometimes part now and the rest over a year, a sell-on share, or (for
    young players) a buy-back clause for you. Seeded by the bid so it is stable. */
export function bidTerms(s: GameState, bidId: string, p: Player, fee: number): { upfront: number; sellOn: number; buyBack: number } {
  const h = hash(bidId + p.id + dateOf(s));
  const upfront = fee >= 10_000_000 && h % 10 < 4 ? 60 + (h >> 4) % 3 * 10 : 100;
  const sellOn = p.age <= 24 && (h >> 8) % 10 < 3 ? 10 + ((h >> 12) % 3) * 5 : 0;
  const buyBack = p.age <= 22 && (h >> 16) % 10 < 3 ? Math.round((fee * 1.8) / 100_000) * 100_000 : 0;
  return { upfront, sellOn, buyBack };
}

/** The clauses on a player that concern you, in words. */
export function clauseLines(s: GameState, playerId: string): string[] {
  const m = (v: number) => `${Math.round(v / 1e5) / 10}M`;
  const us = s.userClubId, out: string[] = [];
  for (const c of clausesFor(s, playerId)) {
    const name = (id: string) => s.clubs[id]?.name ?? 'his old club';
    if (c.kind === 'sellOn') out.push(c.holderId === us ? `We get ${c.pct}% of his next sale.` : `${name(c.holderId)} get ${c.pct}% of his next sale.`);
    if (c.kind === 'buyBack' && c.holderId === us && c.until >= s.year) out.push(`We can buy him back for ${m(c.fee)} until the end of ${c.until}/${String((c.until + 1) % 100).padStart(2, '0')}.`);
    if (c.kind === 'addOn' && c.payerId === us && c.until >= s.year) out.push(`We owe ${name(c.payeeId)} ${[c.appFee ? `${m(c.appFee)} after ${ADDON_APPS} games (${c.apps ?? 0} so far)` : '', c.goalBonus ? `${m(c.goalBonus)} after ${ADDON_GOALS} goals (${c.goals ?? 0} so far)` : ''].filter(Boolean).join(' and ')}, until the end of ${c.until}/${String((c.until + 1) % 100).padStart(2, '0')}.`);
  }
  return out;
}
