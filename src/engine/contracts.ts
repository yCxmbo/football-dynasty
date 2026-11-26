/* Contract drama: release clauses (Spanish clubs have one for every player), players who won't renew,
   and pre-contracts with other clubs in the final six months. */
import { noteJoined } from './index';
import type { Rng } from './rng';
import type { GameState, InboxMessage, Player } from './types';

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const round = (n: number) => Math.round(n / 1_000_000) * 1_000_000;

/** World build: clauses for Spanish clubs' players (by law), and for some good young players elsewhere. */
export function assignReleaseClauses(clubs: Record<string, { country: string }>, players: Record<string, Player>, rng: Rng) {
  for (const p of Object.values(players)) {
    if (p.squad !== 'First team' || p.releaseClause) continue;
    const spain = clubs[p.clubId]?.country === 'esp';
    if (spain) p.releaseClause = Math.max(10_000_000, round(p.value * (3 + rng.next() * 3)));
    else if (p.age <= 27 && p.value >= 5_000_000 && rng.chance(0.12)) p.releaseClause = round(p.value * 2.5);
  }
}

/** The level a club's regulars play at (ability), from its reputation. */
const clubLevel = (rep: number) => 60 + rep * 1.15;

/** In his final year: does he want to leave rather than renew? (Unhappy, or far too good for the club.) Fixed for the season. */
export function wantsOut(s: GameState, p: Player) {
  if (p.contractEnd > s.year || p.age > 31) return false;
  const tooGood = p.ability >= clubLevel(s.clubs[p.clubId]?.reputation ?? 50) + 18;
  if (!tooGood && p.morale !== 'low') return false;
  return hash(`${p.id}|${s.year}`) % 100 < (tooGood ? 65 : 45);
}

function message(s: GameState, m: Pick<InboxMessage, 'subject' | 'body'> & { playerId?: string; from?: string }) {
  s.inbox.unshift({ id: `m${s.nextId++}`, category: 'transfers', from: m.from ?? 'Director of football', date: s.calendar[Math.min(s.matchday, s.calendar.length) - 1]?.date ?? '', unread: true, subject: m.subject, body: m.body, playerId: m.playerId });
  if (s.inbox.length > 80) s.inbox.length = 80;
}

/** During a window: a bigger club may pay one of your players' release clauses. Returns the player moved, if any. */
export function triggerClauses(s: GameState, rng: Rng) {
  const us = s.clubs[s.userClubId];
  for (const p of Object.values(s.players)) {
    if (p.clubId !== us.id || !p.releaseClause || p.loan || p.squad !== 'First team') continue;
    if (p.value < p.releaseClause * 0.55 || !rng.chance(0.12)) continue; // only when the clause is a bargain
    const buyers = Object.values(s.clubs).filter((c) => c.id !== us.id && c.league && c.reputation >= us.reputation - 5 && c.transferBudget >= p.releaseClause!);
    if (!buyers.length) continue;
    const buyer = rng.pick(buyers);
    const fee = p.releaseClause;
    buyer.transferBudget -= fee; buyer.balance -= fee;
    us.balance += fee; us.transferBudget += Math.round(fee * 0.6);
    if (s.ledger) s.ledger.income.sales += fee;
    p.clubId = buyer.id; p.releaseClause = undefined; p.captain = false; p.joined = s.year; p.contractEnd = s.year + 4;
    noteJoined(s, p);
    s.lineup = s.lineup.filter((id) => id !== p.id);
    s.transferListed = s.transferListed.filter((id) => id !== p.id);
    message(s, { from: buyer.name, subject: `${buyer.name} trigger ${p.name}'s release clause`, playerId: p.id,
      body: [`${buyer.name} have paid the ${Math.round(fee / 1e5) / 10}M release clause in ${p.name}'s contract. There was nothing we could do to stop it.`, 'Sixty per cent of the fee goes into the transfer budget.'] });
    return p;
  }
  return undefined;
}

/** From the mid-season window: other clubs sign your expiring players on pre-contracts. */
export function preContracts(s: GameState, rng: Rng) {
  const us = s.clubs[s.userClubId];
  for (const p of Object.values(s.players)) {
    if (p.clubId !== us.id || p.preContract || p.contractEnd > s.year || p.squad !== 'First team' || p.loan || p.age > 33) continue;
    if (!rng.chance(wantsOut(s, p) ? 0.25 : 0.06)) continue;
    const suitors = Object.values(s.clubs).filter((c) => c.id !== us.id && c.league && clubLevel(c.reputation) >= p.ability - 10 && c.reputation >= us.reputation - 10);
    if (!suitors.length) continue;
    const c = rng.pick(suitors);
    p.preContract = c.id;
    message(s, { from: p.name, subject: `${p.name} agrees to join ${c.name} in the summer`, playerId: p.id,
      body: [`With his contract running out, ${p.name} has signed a pre-contract with ${c.name}. He will leave on a free transfer when the season ends.`, 'He stays our player until then.'] });
  }
}

/** Season end: a player with a pre-contract joins his new club instead of becoming a free agent. Returns true if he moved. */
export function honourPreContract(s: GameState, p: Player) {
  const to = p.preContract && s.clubs[p.preContract];
  if (!to) return false;
  p.clubId = to.id; p.preContract = undefined; p.contractEnd = s.year + 3; p.wage = Math.round(p.wage * 1.15); p.joined = s.year + 1; p.captain = false;
  noteJoined(s, p);
  return true;
}
