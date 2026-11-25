/* Club finances: weekly income and costs for every club; budgets and prize money at season end. */
import { clamp } from './ratings';
import type { Club, GameState, Ledger } from './types';

export function emptyLedger(): Ledger {
  return { income: { gate: 0, tv: 0, sponsorship: 0, merchandise: 0, prize: 0, sales: 0 }, expenses: { wages: 0, staff: 0, transfers: 0 }, balanceHistory: [] };
}

/** A 22-matchday season covers a whole year of wages and contracts: each matchday carries 52/22 weeks. */
export const WEEKS_PER_MATCHDAY = 52 / 22;
export const TV_PER_MATCHDAY = 1_000_000;
export const sponsorshipPerWeek = (c: Club) => c.reputation * 5000;
export const merchandisePerWeek = (c: Club) => c.reputation * 2000;
export const staffPerWeek = (c: Club) => c.reputation * 4000;
export const ticketPrice = (c: Club) => Math.round(20 + c.reputation * 0.5);

/** Fill rate from reputation and league position (1 = top). */
export function attendance(c: Club, leaguePos: number, clubs: number) {
  const fill = clamp(0.55 + c.reputation / 250 + (clubs - leaguePos) / clubs / 8, 0.45, 1);
  return Math.round(c.capacity * fill);
}

export const wageBillOf = (s: GameState, clubId: string) => Object.values(s.players).filter((p) => p.clubId === clubId).reduce((a, p) => a + p.wage, 0);

/** One matchday (= one week) of money for every club. `homeIds` played at home this week. */
export function financeWeek(s: GameState, homeIds: Set<string>, positions: Record<string, number>) {
  const n = Object.keys(s.clubs).length;
  for (const c of Object.values(s.clubs)) {
    const gate = homeIds.has(c.id) ? attendance(c, positions[c.id] ?? n, n) * ticketPrice(c) : 0;
    const w = WEEKS_PER_MATCHDAY;
    const income = { gate, tv: TV_PER_MATCHDAY, sponsorship: Math.round(sponsorshipPerWeek(c) * w), merchandise: Math.round(merchandisePerWeek(c) * w) };
    const wages = Math.round(wageBillOf(s, c.id) * w), staff = Math.round(staffPerWeek(c) * w);
    c.balance += income.gate + income.tv + income.sponsorship + income.merchandise - wages - staff;
    if (c.id === s.userClubId) {
      const L = s.ledger;
      L.income.gate += income.gate; L.income.tv += income.tv; L.income.sponsorship += income.sponsorship; L.income.merchandise += income.merchandise;
      L.expenses.wages += wages; L.expenses.staff += staff;
      L.balanceHistory.push(c.balance);
    }
  }
}

export const prizeMoney = (pos: number, clubs: number) => (clubs + 1 - pos) * 1_500_000 + (pos === 1 ? 10_000_000 : 0);

/**
 * Season end: prize money, reputation change, and the board's new budgets.
 * Returns a summary for the user's club.
 */
export function seasonFinances(s: GameState, table: { clubId: string }[]) {
  const n = table.length;
  let summary = { prize: 0, transferBudget: 0, wageBudget: 0, reputation: 0, repChange: 0, balance: 0 };
  table.forEach((row, i) => {
    const c = s.clubs[row.clubId];
    const pos = i + 1;
    const prize = prizeMoney(pos, n);
    c.balance += prize;
    const expected = Object.values(s.clubs).sort((a, b) => b.reputation - a.reputation).findIndex((x) => x.id === c.id) + 1;
    const repChange = clamp(Math.round((expected - pos) / 2) + (pos === 1 ? 2 : 0), -3, 4);
    c.reputation = clamp(c.reputation + repChange, 30, 95);
    // average weekly income over a year: TV and gates per matchday, sponsorship and merchandise every week
    const weeklyIncome = ((n - 1) * 2 * TV_PER_MATCHDAY + (n - 1) * attendance(c, pos, n) * ticketPrice(c)) / 52 + sponsorshipPerWeek(c) + merchandisePerWeek(c);
    const bill = wageBillOf(s, c.id);
    const affordable = (weeklyIncome - staffPerWeek(c)) * 0.85 + Math.max(0, c.balance) / 520; // spend a tenth of savings over the year
    c.wageBudget = Math.round(Math.max(bill * (c.balance > 0 ? 1.02 : 0.95), affordable) / 1000) * 1000;
    // In debt the board only releases a small fund from reputation (sponsor goodwill); otherwise a share of savings too.
    const base = c.reputation * c.reputation * 2500 * (c.balance > 0 ? 1 : 0.3);
    c.transferBudget = Math.round(clamp(Math.max(0, c.balance) * 0.35 + base, 500_000, 250_000_000) / 100_000) * 100_000;
    if (c.id === s.userClubId) {
      s.ledger.income.prize += prize;
      summary = { prize, transferBudget: c.transferBudget, wageBudget: c.wageBudget, reputation: c.reputation, repChange, balance: c.balance };
    }
  });
  return summary;
}
