import { isParent } from './affiliates';
/* Loans: send young or fringe players out to play (the borrowing club pays the wages), or borrow other
   clubs' fringe players. Loans run to the end of the season; a window must be open to start or recall one. */
import { leagueDef } from './competitions';
import { noteJoined, squadOf } from './index';
import { ROLE } from './match';
import { windowOpen } from './transfers';
import type { GameState, InboxMessage, Player, Squad } from './types';

export interface Loan { from: string; until: number; squad: Squad }

/** First-team rank a player would have at a club (1 = its best player). */
function rankAt(s: GameState, p: Player, clubId: string) {
  return 1 + squadOf(s, clubId).filter((x) => x.squad === 'First team' && x.id !== p.id && x.ability > p.ability).length;
}

/** Rank among a club's first-teamers in the same role (goalkeeper, defence, midfield, attack), and how many of that role start in a 4-3-3. */
const STARTERS: Record<string, number> = { gk: 1, def: 4, mid: 3, att: 3 };
function roleRank(s: GameState, p: Player, clubId: string) {
  const r = ROLE[p.pos];
  const rank = 1 + squadOf(s, clubId).filter((x) => x.squad === 'First team' && x.id !== p.id && ROLE[x.pos] === r && x.ability > p.ability).length;
  return { rank, starters: STARTERS[r] };
}

function message(s: GameState, m: Pick<InboxMessage, 'subject' | 'body'> & { playerId?: string }) {
  s.inbox.unshift({ id: `m${s.nextId++}`, category: 'transfers', from: 'Director of football', date: s.calendar[Math.min(s.matchday, s.calendar.length) - 1]?.date ?? '', unread: true, ...m });
  if (s.inbox.length > 80) s.inbox.length = 80;
}

/** Clubs that would take one of your players on loan and play him, best first (league level, then playing time). */
export function loanDestinations(s: GameState, p: Player) {
  const home = s.clubs[s.userClubId];
  // your feeder clubs always take him, to develop
  const feeders = (s.affiliates ?? []).filter((a) => a.kind === 'feeder' && s.clubs[a.clubId]).map((a) => ({ clubId: a.clubId, role: 'Development loan (feeder club)', country: s.clubs[a.clubId].country }));
  const tierOf = (id: string) => leagueDef(s, s.clubs[id].league)?.tier ?? 9;
  const others = Object.values(s.clubs)
    .filter((c) => c.league && c.id !== home.id && c.reputation <= home.reputation)
    .map((c) => ({ clubId: c.id, ...roleRank(s, p, c.id), tier: tierOf(c.id), rep: c.reputation }))
    // only clubs where he'd start in his position, the strongest first
    .filter((o) => o.rank <= o.starters)
    .sort((a, b) => b.rep - a.rep || a.rank - b.rank)
    .filter((o) => !feeders.some((f) => f.clubId === o.clubId))
    .slice(0, 6)
    .map((o) => ({ clubId: o.clubId, role: o.rank === 1 ? 'Key player' : 'Regular starter', country: s.clubs[o.clubId].country }));
  return [...feeders, ...others];
}

export function canLoanOut(s: GameState, p: Player): string | null {
  if (p.clubId !== s.userClubId || p.loan) return 'Only your own players can be loaned out.';
  if (!windowOpen(s)) return 'Loans can only be agreed while a transfer window is open.';
  if (p.age > 30) return 'Clubs only borrow players aged 30 or under.';
  return null;
}

export function loanOut(s: GameState, playerId: string, clubId: string): string | null {
  const p = s.players[playerId];
  const err = p ? canLoanOut(s, p) : 'Player not found.';
  if (err) return err;
  if (!loanDestinations(s, p).some((d) => d.clubId === clubId)) return `${s.clubs[clubId]?.name ?? 'That club'} doesn't want him.`;
  p.loan = { from: s.userClubId, until: s.year, squad: p.squad };
  p.clubId = clubId; p.squad = 'First team'; p.captain = false;
  noteJoined(s, p);
  s.lineup = s.lineup.filter((id) => id !== p.id);
  s.transferListed = s.transferListed.filter((id) => id !== p.id);
  message(s, { subject: `${p.name} joins ${s.clubs[clubId].name} on loan`, body: [`${p.name} will spend the rest of the season at ${s.clubs[clubId].name}, who pay his wages. He returns in the summer.`], playerId: p.id });
  return null;
}

/** Brings a player back early (window open). */
export function recall(s: GameState, playerId: string): string | null {
  const p = s.players[playerId];
  if (!p?.loan || p.loan.from !== s.userClubId) return 'He is not on loan from your club.';
  if (!windowOpen(s)) return 'Loans can only be ended while a transfer window is open.';
  endLoan(s, p);
  message(s, { subject: `${p.name} recalled`, body: [`${p.name} is back from his loan.`], playerId: p.id });
  return null;
}

/** Would the owning club lend this player to you? */
export function loanInVerdict(s: GameState, p: Player): { ok: boolean; reason: string } {
  if (p.clubId === s.userClubId) return { ok: false, reason: 'He is already your player.' };
  if (p.loan) return { ok: false, reason: `He is already on loan at ${s.clubs[p.clubId]?.name}.` };
  if (!s.clubs[p.clubId]?.league) return { ok: false, reason: 'Free agents sign contracts, not loans.' };
  if (!windowOpen(s)) return { ok: false, reason: 'Loans can only be agreed while a transfer window is open.' };
  if (isParent(s, p.clubId) && p.age <= 23) return { ok: true, reason: `${s.clubs[p.clubId].name}, your parent club, are happy for their prospect to play with you.` };
  const there = rankAt(s, p, p.clubId), here = rankAt(s, p, s.userClubId);
  if (there <= 11 && !(p.age <= 21 && there > 6)) return { ok: false, reason: `${s.clubs[p.clubId].name} need him in their team.` };
  if (here > 14) return { ok: false, reason: `He wouldn't get games at ${s.clubs[s.userClubId].name}, so his club says no.` };
  if (s.clubs[p.clubId].reputation < s.clubs[s.userClubId].reputation - 25) return { ok: false, reason: `${s.clubs[p.clubId].name} would rather sell him than lend him.` };
  return { ok: true, reason: `${s.clubs[p.clubId].name} are happy for him to play regularly with you.` };
}

export function loanIn(s: GameState, playerId: string): string | null {
  const p = s.players[playerId];
  if (!p) return 'Player not found.';
  const v = loanInVerdict(s, p);
  if (!v.ok) return v.reason;
  const from = p.clubId;
  p.loan = { from, until: s.year, squad: p.squad };
  p.clubId = s.userClubId; p.squad = 'First team'; p.captain = false; p.morale = 'high';
  noteJoined(s, p);
  s.shortlist = s.shortlist.filter((id) => id !== p.id);
  message(s, { subject: `${p.name} joins on loan`, body: [`${p.name} (${p.pos}, ${p.age}) joins on loan from ${s.clubs[from].name} until the end of the season. We pay his wages.`], playerId: p.id });
  return null;
}

function endLoan(s: GameState, p: Player) {
  const l = p.loan!;
  if (p.clubId === s.userClubId) s.lineup = s.lineup.filter((id) => id !== p.id);
  p.clubId = l.from; p.squad = l.squad; p.loan = undefined;
  noteJoined(s, p);
}

/** Season end: loans run out and players go back to their clubs. */
export function returnLoans(s: GameState) {
  for (const p of Object.values(s.players)) if (p.loan && p.loan.until <= s.year && s.clubs[p.loan.from]) endLoan(s, p);
}

/** Your players out on loan. */
export const loanedOut = (s: GameState) => Object.values(s.players).filter((p) => p.loan?.from === s.userClubId);
