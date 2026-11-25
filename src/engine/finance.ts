/* Club finances: weekly income and costs for every club; budgets and prize money at season end. */
import { clamp } from './ratings';
import { cupResult, type TableRow } from './competitions';
import type { Club, Fixture, GameState, Ledger } from './types';

export function emptyLedger(): Ledger {
  return { income: { gate: 0, tv: 0, sponsorship: 0, merchandise: 0, prize: 0, sales: 0 }, expenses: { wages: 0, staff: 0, transfers: 0 }, balanceHistory: [] };
}

/** A 22-matchday season covers a whole year of wages and contracts: each matchday carries 52/22 weeks. */
export const WEEKS_PER_MATCHDAY = 52 / 22;
export const TV_PER_MATCHDAY = 1_000_000;
/** League TV money per matchday by division. */
export const TV_BY_DIVISION: Record<number, number> = { 1: 1_000_000, 2: 450_000, 3: 220_000 };
export const sponsorshipPerWeek = (c: Club) => c.reputation * 5000;
export const merchandisePerWeek = (c: Club) => c.reputation * 2000;
export const staffPerWeek = (c: Club) => Math.round(c.reputation * c.reputation * 55);
export const ticketPrice = (c: Club) => Math.round(20 + c.reputation * 0.5);

/** Fill rate from reputation and league position (1 = top). */
export function attendance(c: Club, leaguePos: number, clubs: number) {
  const fill = clamp(0.55 + c.reputation / 250 + (clubs - leaguePos) / clubs / 8, 0.45, 1);
  return Math.round(c.capacity * fill);
}

export const wageBillOf = (s: GameState, clubId: string) => Object.values(s.players).filter((p) => p.clubId === clubId).reduce((a, p) => a + p.wage, 0);

/** One matchday (= one week) of money for every club. `homeIds` played at home this week. */
export function financeWeek(s: GameState, homeIds: Set<string>, positions: Record<string, number>) {
  const n = 12;
  for (const c of Object.values(s.clubs)) {
    if (c.division === 0) continue;
    const gate = homeIds.has(c.id) ? attendance(c, positions[c.id] ?? n, n) * ticketPrice(c) : 0;
    const w = WEEKS_PER_MATCHDAY;
    const income = { gate, tv: TV_BY_DIVISION[c.division], sponsorship: Math.round(sponsorshipPerWeek(c) * w), merchandise: Math.round(merchandisePerWeek(c) * w) };
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

export const LEAGUE_PRIZE_SCALE: Record<number, number> = { 1: 1, 2: 0.3, 3: 0.1 };
export const prizeMoney = (pos: number, clubs: number, division = 1) => Math.round(((clubs + 1 - pos) * 1_500_000 + (pos === 1 ? 10_000_000 : 0)) * LEAGUE_PRIZE_SCALE[division]);

/** Prize money by stage reached. */
export const CUP_PRIZES: Record<string, Record<string, number>> = {
  NC: { Winners: 4_000_000, Final: 2_000_000, 'Semi-final': 1_000_000, 'Quarter-final': 500_000, 'Round of 16': 250_000, 'Round of 32': 120_000, 'Preliminary round': 50_000 },
  LC: { Winners: 2_000_000, Final: 1_000_000, 'Semi-final': 500_000, 'Quarter-final': 250_000, 'Round of 16': 120_000, 'First round': 50_000 },
  CC: { Winners: 15_000_000, Final: 11_000_000, 'Semi-final': 8_000_000, 'Quarter-final': 6_000_000, 'Group stage': 4_000_000 },
  SC: { Winners: 1_000_000, Final: 500_000 },
};

/** Gate receipts for a cup tie (neutral venues split a 60,000 crowd) and Continental TV money. */
export function cupGate(s: GameState, f: Fixture) {
  const H = s.clubs[f.homeId], A = s.clubs[f.awayId];
  const book = (c: Club, amount: number, kind: 'gate' | 'tv') => {
    if (c.division === 0) return;
    c.balance += amount;
    if (c.id === s.userClubId) s.ledger.income[kind] += amount;
  };
  if (f.neutral) { const half = Math.round((60000 * 45) / 2); book(H, half, 'gate'); book(A, half, 'gate'); }
  else book(H, Math.round(H.capacity * 0.85) * ticketPrice(H), 'gate');
  if (f.comp === 'CC') { book(H, 1_000_000, 'tv'); book(A, 1_000_000, 'tv'); }
}

/**
 * Season end: league and cup prize money, reputation change, and the board's new budgets.
 * Returns a summary for the user's club.
 */
export function seasonFinances(s: GameState, tables: Record<1 | 2 | 3, TableRow[]>) {
  let summary = { prize: 0, transferBudget: 0, wageBudget: 0, reputation: 0, repChange: 0, balance: 0 };
  for (const d of [1, 2, 3] as const) {
    const table = tables[d];
    const n = table.length;
    const byRep = table.map((r) => s.clubs[r.clubId]).sort((a, b) => b.reputation - a.reputation);
    table.forEach((row, i) => {
      const c = s.clubs[row.clubId];
      const pos = i + 1;
      let prize = prizeMoney(pos, n, d);
      for (const comp of ['NC', 'LC', 'CC', 'SC'] as const) { const r = cupResult(s, comp, c.id); if (r) prize += CUP_PRIZES[comp][r] ?? 0; }
      c.balance += prize;
      const expected = byRep.findIndex((x) => x.id === c.id) + 1;
      const repChange = clamp(Math.round((expected - pos) / 2) + (pos === 1 ? 2 : 0), -3, 4);
      c.reputation = clamp(c.reputation + repChange, 20, 95);
      const tv = TV_BY_DIVISION[d];
      const weeklyIncome = ((n - 1) * 2 * tv + (n - 1) * attendance(c, pos, n) * ticketPrice(c)) / 52 + sponsorshipPerWeek(c) + merchandisePerWeek(c);
      const bill = wageBillOf(s, c.id);
      const affordable = (weeklyIncome - staffPerWeek(c)) * 0.85 + Math.max(0, c.balance) / 520;
      c.wageBudget = Math.round(Math.max(bill * (c.balance > 0 ? 1.02 : 0.95), affordable) / 1000) * 1000;
      const base = c.reputation * c.reputation * 2500 * (c.balance > 0 ? 1 : 0.3);
      c.transferBudget = Math.round(clamp(Math.max(0, c.balance) * 0.35 + base, 250_000, 250_000_000) / 50_000) * 50_000;
      if (c.id === s.userClubId) {
        s.ledger.income.prize += prize;
        summary = { prize, transferBudget: c.transferBudget, wageBudget: c.wageBudget, reputation: c.reputation, repChange, balance: c.balance };
      }
    });
  }
  return summary;
}
