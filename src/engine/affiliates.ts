/* Affiliate clubs. Feeder clubs (smaller, up to two) always take your players on loan to develop, and players
   loaned there develop faster; you get first call on their young players (a lower asking price), and pay them a
   yearly fee. A parent club (bigger, one at most) lends you its prospects and pays you a yearly fee. A feeder
   abroad also grows your club's name there. */
import type { GameState, Player } from './types';

export type AffKind = 'feeder' | 'parent';
export interface Affiliate { clubId: string; kind: AffKind; since: number }
export const MAX_FEEDERS = 2;

export const affiliatesOf = (s: GameState) => s.affiliates ?? [];
export const isFeeder = (s: GameState, clubId: string) => affiliatesOf(s).some((a) => a.clubId === clubId && a.kind === 'feeder');
export const isParent = (s: GameState, clubId: string) => affiliatesOf(s).some((a) => a.clubId === clubId && a.kind === 'parent');

/** Yearly fee: paid to a feeder (more for a bigger one), received from a parent (more from a bigger one). */
export const affiliateFee = (s: GameState, clubId: string, kind: AffKind) => Math.max(100_000, Math.round(((kind === 'feeder' ? 80 : 120) * (s.clubs[clubId]?.reputation ?? 40) ** 2) / 100_000) * 100_000); // about 0.2–1.0M

/** Clubs that would sign up: feeders well below you, parents well above. */
export function candidates(s: GameState, kind: AffKind) {
  const me = s.clubs[s.userClubId], taken = new Set(affiliatesOf(s).map((a) => a.clubId));
  const list = Object.values(s.clubs).filter((c) => c.league && c.id !== me.id && !taken.has(c.id) &&
    (kind === 'feeder' ? c.reputation <= me.reputation - 12 && c.reputation >= Math.max(20, me.reputation - 45) : c.reputation >= me.reputation + 8 && c.reputation <= me.reputation + 35));
  if (kind === 'parent') return list.sort((a, b) => a.reputation - b.reputation).slice(0, 10); // the likeliest first
  // feeders: a spread from the biggest willing club down to small ones, at home and abroad
  const sorted = list.sort((a, b) => b.reputation - a.reputation);
  if (sorted.length <= 10) return sorted;
  return Array.from({ length: 10 }, (_, i) => sorted[Math.round((i * (sorted.length - 1)) / 9)]);
}

export function propose(s: GameState, clubId: string, kind: AffKind): string | null {
  const c = s.clubs[clubId];
  if (!c || !candidates(s, kind).some((x) => x.id === clubId)) return `${c?.name ?? 'That club'} isn't interested.`;
  if (kind === 'feeder' && affiliatesOf(s).filter((a) => a.kind === 'feeder').length >= MAX_FEEDERS) return `You can have ${MAX_FEEDERS} feeder clubs at most.`;
  if (kind === 'parent' && affiliatesOf(s).some((a) => a.kind === 'parent')) return 'You already have a parent club.';
  const fee = affiliateFee(s, clubId, kind);
  if (kind === 'feeder' && s.clubs[s.userClubId].balance < fee) return 'You can\'t afford the first year\'s fee.';
  (s.affiliates ??= []).push({ clubId, kind, since: s.year });
  pay(s, kind, clubId, fee);
  return null;
}
export function endAffiliation(s: GameState, clubId: string) { s.affiliates = affiliatesOf(s).filter((a) => a.clubId !== clubId); }

function pay(s: GameState, kind: AffKind, clubId: string, fee: number) {
  const me = s.clubs[s.userClubId], them = s.clubs[clubId];
  const sign = kind === 'feeder' ? -1 : 1;
  me.balance += sign * fee; if (them) them.balance -= sign * fee;
  if (s.ledger) { if (sign < 0) s.ledger.expenses.staff += fee; else s.ledger.income.sponsorship += fee; }
}

/** Summer: the yearly fees, and a little reputation for each feeder abroad (up to +2 a season). */
export function affiliateSummer(s: GameState): string[] {
  const out: string[] = [];
  const me = s.clubs[s.userClubId];
  let abroad = 0;
  for (const a of affiliatesOf(s)) {
    const c = s.clubs[a.clubId];
    if (!c) { endAffiliation(s, a.clubId); continue; }
    const fee = affiliateFee(s, a.clubId, a.kind);
    pay(s, a.kind, a.clubId, fee);
    out.push(`${a.kind === 'feeder' ? 'Paid' : 'Received'} ${Math.round(fee / 1e5) / 10}M ${a.kind === 'feeder' ? 'to our feeder club' : 'from our parent club'}, ${c.name}.`);
    if (a.kind === 'feeder' && c.country !== me.country) abroad++;
  }
  if (abroad) me.reputation = Math.min(99, me.reputation + Math.min(2, abroad) * 0.5);
  return out;
}

/* ---------- effects used elsewhere ---------- */
/** A loanee at one of your feeders develops faster. */
export const feederDevelopment = (s: GameState, p: Player) => (p.loan?.from === s.userClubId && isFeeder(s, p.clubId) ? 1.25 : 1);
/** First call on a feeder's young players: 20% off. */
export const feederPrice = (s: GameState, p: Player) => (p.age <= 21 && isFeeder(s, p.clubId) ? 0.8 : 1);
