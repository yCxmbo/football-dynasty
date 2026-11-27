import { noteJoined, squadOf } from './index';
import { marketFee } from './market';
import { scoutPerMatchday } from './staff';
import { afterTransfer } from './achievements';
import { fansOnTransfer } from './fans';
import { feederPrice } from './affiliates';
import { dealExperience, priceFactor, wageFactor } from './manager';
import { addClause, agentDemand, bidTerms, buyBackFor, settleSale } from './deals';
import { recordTransfer } from './records';
import { honourPreContract, preContracts, triggerClauses, wantsOut } from './contracts';
/* Transfers, scouting and contracts. Pure functions over GameState (mutating the draft). */
import { clamp } from './ratings';
import { dateOf, nextWindow, openWindow, windowsFor } from './windows';
import { createRng } from './rng';
import { FREE_AGENT, type Bid, type GameState, type OfferResponse, type Player } from './types';
import { seasonLabel } from './types';
import { wageFor } from './world';

export const MAX_SCOUTING = 5;
export const SCOUT_PER_MATCHDAY = 25;
export const BASE_KNOWLEDGE = 25;
export const SQUAD_ROLES = ['Star player', 'Important player', 'Regular starter', 'Squad player', 'Fringe player', 'Hot prospect', 'Youngster'] as const;
export type SquadRole = (typeof SQUAD_ROLES)[number];

/* ---------- windows ---------- */
/** Your transfer window follows your club's country, on real dates (see windows.ts). */
export function windowOpen(s: GameState) {
  return !!openWindow(s, s.clubs[s.userClubId]?.country);
}
const day = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
export function windowLabel(s: GameState) {
  const c = s.clubs[s.userClubId]?.country;
  const w = openWindow(s, c);
  if (w) return w.to === dateOf(s) ? `Deadline day: the ${w.label} closes tonight` : `The ${w.label} is open until ${day(w.to)}`;
  const n = nextWindow(s, c);
  return n ? `Window closed. The ${n.label} opens on ${day(n.from)}.` : 'Window closed. The summer window opens after the season.';
}

/* ---------- helpers ---------- */
export const clubName = (s: GameState, id: string) => (id === FREE_AGENT ? 'Free agent' : s.clubs[id]?.name ?? 'Unknown club');
export const isFree = (p: Player) => p.clubId === FREE_AGENT;
export const userSquad = (s: GameState) => Object.values(s.players).filter((p) => p.clubId === s.userClubId);
export const wageBill = (s: GameState, clubId = s.userClubId) => Object.values(s.players).filter((p) => p.clubId === clubId).reduce((a, p) => a + p.wage, 0);

export function knowledgeOf(s: GameState, p: Player) {
  if (p.clubId === s.userClubId) return 100;
  return s.knowledge[p.id] ?? BASE_KNOWLEDGE;
}

/** Ability/potential as the user sees them: ranges that narrow as knowledge grows. */
export function seenRange(value: number, knowledge: number, floor = 1) {
  const spread = Math.round((100 - knowledge) * 0.35);
  return [clamp(value - spread, floor, 200), clamp(value + spread, floor, 200)] as [number, number];
}

/** Rank by ability among the club's first team (1 = best). */
function rankAt(s: GameState, p: Player, clubId: string) {
  return 1 + squadOf(s, clubId).filter((x) => x.squad === 'First team' && x.id !== p.id && x.ability > p.ability).length;
}

/** The role the player expects at the user's club. */
export function expectedRole(s: GameState, p: Player): SquadRole {
  const r = rankAt(s, p, s.userClubId);
  if (p.age <= 19 && r > 11) return p.potential - p.ability > 30 ? 'Hot prospect' : 'Youngster';
  return r <= 3 ? 'Star player' : r <= 7 ? 'Important player' : r <= 11 ? 'Regular starter' : r <= 16 ? 'Squad player' : 'Fringe player';
}

/** Weekly wage the player wants to join or stay. */
export function wageDemand(s: GameState, p: Player, renewing = false) {
  const club = s.clubs[s.userClubId];
  const fromRep = isFree(p) ? club.reputation : s.clubs[p.clubId]?.reputation ?? club.reputation;
  let w = wageFor(p.ability, Math.max(club.reputation, fromRep));
  if (!renewing && fromRep > club.reputation) w *= 1 + (fromRep - club.reputation) / 40; // a step down costs more
  if (!renewing) w *= 1.1;
  if (renewing && p.morale === 'low') w *= 1.15;
  if (p.age >= 32) w *= 0.85;
  w *= wageFactor(s);
  return Math.max(p.wage * (renewing ? 1.05 : 1.15), Math.round(w / 500) * 500);
}

/** Fee the selling club asks. 0 for free agents. */
export function askingPrice(s: GameState, p: Player) {
  if (isFree(p)) return 0;
  const r = rankAt(s, p, p.clubId);
  let m = r <= 5 ? 1.6 : r <= 11 ? 1.35 : 1.1;
  if (p.squad !== 'First team') m = 1.2;
  if (p.contractEnd <= s.year) m *= 0.6; // contract ends this summer
  if (s.transferListedAI?.includes(p.id)) m *= 0.8;
  return Math.max(100000, Math.round((p.value * m * priceFactor(s) * feederPrice(s, p)) / 100000) * 100000);
}

/* ---------- scouting ---------- */
export function startScouting(s: GameState, playerId: string): string | null {
  if (s.scouting.includes(playerId)) return null;
  if (s.scouting.length >= MAX_SCOUTING) return `Your scouts are busy. Stop scouting someone first (max ${MAX_SCOUTING}).`;
  s.scouting.push(playerId);
  if (!s.shortlist.includes(playerId)) s.shortlist.push(playerId);
  return null;
}
export function stopScouting(s: GameState, playerId: string) { s.scouting = s.scouting.filter((id) => id !== playerId); }
export function toggleShortlist(s: GameState, playerId: string) {
  s.shortlist = s.shortlist.includes(playerId) ? s.shortlist.filter((id) => id !== playerId) : [...s.shortlist, playerId];
}

/* ---------- offers ---------- */
export interface OfferTerms {
  fee: number; upfront: number; months: number; appearanceFee: number; goalBonus: number; sellOn: number;
  wage: number; years: number; signingBonus: number; releaseClause: number; agentFee: number; role: SquadRole; contractType: 'full-time' | 'part-time' | 'youth';
  /** One of your players, going the other way as part of the fee. */
  swapPlayerId?: string;
}

/** Club's view of the deal: what the fee is worth to them now. */
export function effectiveFee(o: OfferTerms, value: number) {
  return o.fee * (0.85 + 0.15 * (o.upfront / 100)) + (o.appearanceFee + o.goalBonus) * 0.35 + (o.sellOn / 100) * value * 0.5;
}

export type OfferOutcome = OfferResponse & { done?: boolean };

/** Evaluates and, if both club and player agree, completes the transfer. */
export function makeOffer(s: GameState, playerId: string, o: OfferTerms): OfferOutcome {
  const p = s.players[playerId];
  if (!p || p.clubId === s.userClubId) return { status: 'rejected', message: 'This player is already at your club.' };
  if (!windowOpen(s)) return { status: 'rejected', message: windowLabel(s) };
  if (p.loan) return { status: 'rejected', message: `${p.name} is on loan at ${clubName(s, p.clubId)} from ${clubName(s, p.loan.from)}. Try again when he returns.` };
  const neg = (s.negotiations[playerId] ??= { attempts: 0 });
  if (neg.blockedUntilWindow) return { status: 'rejected', message: `${clubName(s, p.clubId)} have ended talks until the next window.` };
  const club = s.clubs[s.userClubId];
  const dueNow = Math.round((o.fee * o.upfront) / 100) + o.signingBonus + o.agentFee;
  const wageRoom = club.wageBudget - wageBill(s);
  if (dueNow > club.transferBudget) return save(neg, { status: 'rejected', message: 'The board refuses: the money due now is more than your transfer budget.' });
  if (o.wage > wageRoom) return save(neg, { status: 'rejected', message: 'The board refuses: this wage would take you over the wage budget.' });

  // 1. selling club (a release clause paid in full, up front, can't be refused)
  const clauseMet = !!p.releaseClause && o.fee >= p.releaseClause && o.upfront >= 100;
  if (p.preContract) return save(neg, { status: 'rejected', message: `${p.name} has already agreed to join ${clubName(s, p.preContract)} in the summer.` });
  if (!isFree(p) && !clauseMet) {
    neg.attempts++;
    const ask = askingPrice(s, p);
    const eff = effectiveFee(o, p.value) + swapValue(s, o.swapPlayerId, p.clubId);
    if (eff < ask * 0.97) {
      if (neg.attempts >= 4) { neg.blockedUntilWindow = true; return save(neg, { status: 'rejected', message: `${clubName(s, p.clubId)} are tired of the low offers and end talks until the next window.` }); }
      if (eff < ask * 0.7) return save(neg, { status: 'rejected', message: `${clubName(s, p.clubId)} say the offer is nowhere near their valuation.` });
      const counter = Math.round(Math.max(o.fee, ask * 1.02) / 100000) * 100000;
      return save(neg, { status: 'counter', counter, message: o.upfront < 60 ? `${clubName(s, p.clubId)} want more of the fee up front.` : `${clubName(s, p.clubId)} want a higher fee.` });
    }
  }
  // 2. the player
  const want = wageDemand(s, p);
  // an agent paid what he asks talks his client into a little less
  const effWage = (o.wage + o.signingBonus / (52 * o.years)) * (o.agentFee >= agentDemand(p, o.fee) ? 1.1 : 1);
  const expected = expectedRole(s, p);
  const roleGap = SQUAD_ROLES.indexOf(o.role) - SQUAD_ROLES.indexOf(expected);
  if (o.contractType === 'youth' && p.age > 19) return save(neg, { status: 'rejected', message: `${p.name} is ${p.age}: youth contracts are only for players aged 19 or under.` });
  if (p.age >= 32 && o.years > 2) return save(neg, { status: 'rejected', message: `${p.name} only wants a contract of up to 2 years at this age.` });
  if (roleGap >= 2 && o.role !== 'Hot prospect' && o.role !== 'Youngster') return save(neg, { status: 'rejected', message: `${p.name} expects to be a ${expected.toLowerCase()} and won't accept a smaller role.` });
  if (effWage < want * 0.95) return save(neg, { status: 'rejected', message: `${p.name} turns down the contract. His agent wants about ${Math.round(want / 1000)}k a week.` });

  completeTransfer(s, p, o);
  return save(neg, { status: 'accepted', message: `${p.name} has signed until June ${s.year + o.years}.`, done: true });
}

function save(neg: { lastResponse?: OfferResponse }, r: OfferOutcome): OfferOutcome {
  neg.lastResponse = { status: r.status, message: r.message, counter: r.counter };
  return r;
}

function freeNumber(s: GameState, clubId: string) {
  const used = new Set(Object.values(s.players).filter((p) => p.clubId === clubId).map((p) => p.number));
  for (let n = 2; n < 99; n++) if (!used.has(n)) return n;
  return 99;
}

export function completeTransfer(s: GameState, p: Player, o: OfferTerms) {
  const club = s.clubs[s.userClubId];
  const from = p.clubId;
  const upfront = Math.round((o.fee * o.upfront) / 100);
  afterTransfer(s, o.fee, false);
  fansOnTransfer(s, p, true);
  dealExperience(s);
  if (from !== FREE_AGENT) settleSale(s, p.id, from, o.fee);
  recordTransfer(s, p.name, s.clubs[p.clubId]?.name ?? 'Free agent', s.clubs[s.userClubId].name, o.fee, seasonLabel(s.year), { playerId: p.id, fromId: p.clubId, toId: s.userClubId });
  club.transferBudget -= upfront + o.signingBonus + o.agentFee;
  club.balance -= upfront + o.signingBonus + o.agentFee;
  if (s.ledger) s.ledger.expenses.transfers += upfront + o.signingBonus + o.agentFee;
  const rest = o.fee - upfront;
  if (rest > 0) s.installments.push({ clubId: s.userClubId, perMatchday: Math.ceil(rest / Math.max(1, Math.round(o.months * 4.3))), remaining: rest });
  if (from !== FREE_AGENT && s.clubs[from]) { s.clubs[from].balance += o.fee; s.clubs[from].transferBudget += Math.round(o.fee * 0.5); }
  if (from !== FREE_AGENT && s.clubs[from]) {
    if (o.sellOn > 0) addClause(s, { kind: 'sellOn', playerId: p.id, holderId: from, pct: o.sellOn });
    if (o.appearanceFee > 0 || o.goalBonus > 0) addClause(s, { kind: 'addOn', playerId: p.id, payerId: s.userClubId, payeeId: from, appFee: o.appearanceFee, goalBonus: o.goalBonus, until: s.year + 3 });
    const sw = o.swapPlayerId ? s.players[o.swapPlayerId] : undefined;
    if (sw && sw.clubId === s.userClubId) {
      Object.assign(sw, { clubId: from, captain: false, joined: s.year, squad: 'First team', morale: 'ok', number: freeNumber(s, from) });
      delete sw.injury;
      noteJoined(s, sw);
      s.lineup = s.lineup.filter((id) => id !== sw.id);
      s.transferListed = s.transferListed.filter((id) => id !== sw.id);
      recordTransfer(s, sw.name, club.name, s.clubs[from].name, 0, seasonLabel(s.year), { playerId: sw.id, fromId: club.id, toId: from });
    }
  }
  const youth = o.contractType === 'youth';
  Object.assign(p, {
    clubId: s.userClubId, wage: o.wage, contractEnd: s.year + o.years - (s.matchday > s.calendar.length ? 0 : 1),
    contractType: youth ? 'youth' : 'full-time', squad: youth ? (p.age >= 18 ? 'U21' : 'U18') : 'First team',
    number: freeNumber(s, s.userClubId), captain: false, releaseClause: o.releaseClause || undefined, joined: s.year,
    morale: 'high', injuredFor: p.injuredFor, suspendedFor: 0,
  } satisfies Partial<Player>);
  s.scouting = s.scouting.filter((id) => id !== p.id);
  s.shortlist = s.shortlist.filter((id) => id !== p.id);
  delete s.knowledge[p.id];
  const fee = o.fee ? `${Math.round(o.fee / 1e5) / 10}M` : 'a free transfer';
  inbox(s, { category: 'transfers', from: 'Director of football', subject: `${p.name} signs for ${club.name}`, body: [`${p.name} (${p.pos}, ${p.age}) joins from ${clubName(s, from)} for ${fee}.`, `Contract until June ${p.contractEnd + 1}, ${Math.round(o.wage / 1000)}k a week, as a ${o.role.toLowerCase()}.`], playerId: p.id });
}

/* ---------- selling ---------- */
export function toggleTransferList(s: GameState, playerId: string) {
  s.transferListed = s.transferListed.includes(playerId) ? s.transferListed.filter((id) => id !== playerId) : [...s.transferListed, playerId];
}

/** Called once per matchday while a window is open: AI clubs may bid for the user's players. */
export function aiBids(s: GameState, seed: number) {
  if (!windowOpen(s)) {
    for (const b of s.bids) if (b.status === 'open') b.status = 'expired';
    // rumours about your players go quiet once their window has been and gone
    const ws = windowsFor(s.clubs[s.userClubId]?.country, s.year), d = dateOf(s);
    const closed = (name: 'Summer' | 'January') => { const w = ws.find((x) => x.name === (name === 'January' ? 'Winter' : 'Summer')); return !!w && d > w.to; };
    if (s.rumours) s.rumours = s.rumours.filter((r) => r.fromId !== s.userClubId || !(r.window === 'January' ? closed('January') : closed('Summer') && d < (ws.find((x) => x.name === 'Winter')?.from ?? '')));
    return;
  }
  const rng = createRng(seed);
  // a rumoured interest in one of your players becomes a bid
  for (const r of (s.rumours ?? []).filter((x) => x.fromId === s.userClubId)) {
    const p = s.players[r.playerId], c = s.clubs[r.toId];
    if (!p || !c || p.clubId !== s.userClubId) { s.rumours = s.rumours!.filter((x) => x !== r); continue; }
    if (!rng.chance(0.3 + r.heat * 0.15) || s.bids.some((b) => b.playerId === p.id && b.status === 'open')) continue;
    const fee = Math.round((marketFee(s, p) * (0.95 + rng.next() * 0.3)) / 100000) * 100000;
    const bid = newBid(s, p, c.id, fee);
    s.rumours = s.rumours!.filter((x) => x !== r);
    inbox(s, { category: 'transfers', from: c.name, role: 'Sporting director', subject: `Bid for ${p.name}: ${Math.round(fee / 1e5) / 10}M`, body: [`The rumours were true: ${c.name} offer ${Math.round(fee / 1e5) / 10}M for ${p.name}. His value is about ${Math.round(p.value / 1e5) / 10}M.`, ...bidLines(bid), 'The offer stands until the transfer window closes.'], bidId: bid.id, playerId: p.id });
  }
  triggerClauses(s, rng);
  if (openWindow(s, s.clubs[s.userClubId]?.country)?.name === 'Winter') preContracts(s, rng);
  const mine = userSquad(s).filter((p) => p.squad === 'First team' && !p.loan && !s.bids.some((b) => b.playerId === p.id && b.status === 'open'));
  for (const p of mine) {
    const listed = s.transferListed.includes(p.id);
    if (!rng.chance(listed ? 0.45 : 0.03)) continue;
    const buyers = Object.values(s.clubs).filter((c) => c.id !== s.userClubId && c.transferBudget >= p.value * 0.8 && Math.abs(c.reputation - s.clubs[s.userClubId].reputation) <= 18);
    if (!buyers.length) continue;
    const c = rng.pick(buyers);
    const fee = Math.round((p.value * (listed ? rng.next() * 0.3 + 0.75 : rng.next() * 0.35 + 1.0)) / 100000) * 100000;
    const bid = newBid(s, p, c.id, fee);
    inbox(s, { category: 'transfers', from: c.name, role: 'Sporting director', subject: `Bid for ${p.name}: ${Math.round(fee / 1e5) / 10}M`, body: [`${c.name} offer ${Math.round(fee / 1e5) / 10}M for ${p.name}. His value is about ${Math.round(p.value / 1e5) / 10}M.`, ...bidLines(bid), 'The offer stands until the transfer window closes.'], bidId: bid.id, playerId: p.id });
  }
}

function newBid(s: GameState, p: Player, clubId: string, fee: number): Bid {
  const id = `b${s.nextId++}`;
  const terms = bidTerms(s, id, p, fee);
  const bid: Bid = { id, playerId: p.id, fromClubId: clubId, fee, status: 'open', ...(terms.upfront < 100 ? { upfront: terms.upfront } : {}), ...(terms.sellOn ? { sellOn: terms.sellOn } : {}), ...(terms.buyBack ? { buyBack: terms.buyBack } : {}) };
  s.bids.push(bid);
  return bid;
}
const m1 = (v: number) => `${Math.round(v / 1e5) / 10}M`;
/** The terms of a bid in words (empty when it's all cash now with no clauses). */
export function bidLines(b: Bid): string[] {
  const out: string[] = [];
  if (b.upfront && b.upfront < 100) out.push(`Paid ${b.upfront}% now (${m1((b.fee * b.upfront) / 100)}), the rest over the next year.`);
  if (b.sellOn) out.push(`Includes a ${b.sellOn}% sell-on clause for us: we get ${b.sellOn}% of any future sale.`);
  if (b.buyBack) out.push(`Includes a buy-back clause: we can re-sign him for ${m1(b.buyBack)} during the next two seasons.`);
  return out;
}

/** What one of your players is worth to a selling club as part of a swap (0 if he can't go). */
export function swapValue(s: GameState, playerId: string | undefined, toClubId: string) {
  const sp = playerId ? s.players[playerId] : undefined;
  if (!sp || sp.clubId !== s.userClubId || sp.loan || sp.injuredFor > 0) return 0;
  const them = s.clubs[toClubId];
  // a player well below their level is worth little to them
  const fits = them ? Math.min(1, Math.max(0.3, 1 - (them.reputation * 1.6 - sp.ability) / 60)) : 1;
  return Math.round(sp.value * 0.8 * fits);
}

/** Use a buy-back clause: he returns at the agreed fee (paid now), on his current wage plus 10%. */
export function activateBuyBack(s: GameState, playerId: string): string | null {
  const c = buyBackFor(s, playerId);
  const p = s.players[playerId];
  if (!c || !p) return 'There is no buy-back clause you can use for him.';
  if (!windowOpen(s)) return windowLabel(s);
  const club = s.clubs[s.userClubId];
  if (c.fee > club.transferBudget) return 'The buy-back fee is more than your transfer budget.';
  completeTransfer(s, p, { fee: c.fee, upfront: 100, months: 0, appearanceFee: 0, goalBonus: 0, sellOn: 0, wage: Math.round(p.wage * 1.1), years: 3, signingBonus: 0, releaseClause: 0, agentFee: 0, role: expectedRole(s, p), contractType: 'full-time' });
  return null;
}

export function respondToBid(s: GameState, bidId: string, accept: boolean) {
  const b = s.bids.find((x) => x.id === bidId);
  if (!b || b.status !== 'open') return;
  const p = s.players[b.playerId];
  if (!accept || !p || p.clubId !== s.userClubId) { b.status = 'rejected'; return; }
  const buyer = s.clubs[b.fromClubId], club = s.clubs[s.userClubId];
  b.status = 'accepted';
  fansOnTransfer(s, p, false);
  afterTransfer(s, b.fee, true);
  recordTransfer(s, p.name, club.name, buyer.name, b.fee, seasonLabel(s.year), { playerId: p.id, fromId: club.id, toId: buyer.id });
  settleSale(s, p.id, club.id, b.fee);
  const now = Math.round((b.fee * (b.upfront ?? 100)) / 100), later = b.fee - now;
  buyer.transferBudget -= b.fee; buyer.balance -= now;
  club.balance += now; club.transferBudget += Math.round(now * 0.6);
  if (s.ledger) s.ledger.income.sales += now;
  if (later > 0) s.installments.push({ clubId: buyer.id, toClubId: club.id, perMatchday: Math.ceil(later / 52), remaining: later });
  if (b.sellOn) addClause(s, { kind: 'sellOn', playerId: p.id, holderId: club.id, pct: b.sellOn });
  if (b.buyBack) addClause(s, { kind: 'buyBack', playerId: p.id, holderId: club.id, fee: b.buyBack, until: s.year + 2 });
  p.clubId = buyer.id; noteJoined(s, p); p.number = freeNumber(s, buyer.id); p.captain = false; p.joined = s.year;
  s.lineup = s.lineup.filter((id) => id !== p.id);
  s.transferListed = s.transferListed.filter((id) => id !== p.id);
  for (const o of s.bids) if (o.playerId === p.id && o.status === 'open') o.status = 'expired';
  inbox(s, { category: 'transfers', from: 'Director of football', subject: `${p.name} sold to ${buyer.name}`, body: [`${p.name} has joined ${buyer.name} for ${Math.round(b.fee / 1e5) / 10}M. 60% of the fee goes into your transfer budget.`] });
}

/* ---------- contracts ---------- */
/** Renewal for one of the user's players. Returns null on success or the reason for refusal. */
export function renewContract(s: GameState, playerId: string, wage: number, years: number): string | null {
  const p = s.players[playerId];
  if (!p || p.clubId !== s.userClubId) return 'Not your player.';
  if (p.age >= 32 && years > 2) return `${p.name} only wants up to 2 years at this age.`;
  if (p.preContract) return `${p.name} has signed a pre-contract with ${clubName(s, p.preContract)} and is leaving in the summer.`;
  if (wantsOut(s, p)) return `${p.name} won't sign. He wants to see out his contract and move on${p.morale === 'low' ? ': he is unhappy here' : ' to a bigger club'}.`;
  const want = wageDemand(s, p, true);
  const club = s.clubs[s.userClubId];
  if (wage - p.wage > club.wageBudget - wageBill(s)) return 'The board refuses: the raise would take you over the wage budget.';
  if (wage < want * 0.95) return `${p.name} turns it down. He wants about ${Math.round(want / 1000)}k a week.`;
  const over = s.matchday > s.calendar.length;
  p.wage = wage; p.contractEnd = s.year + years - (over ? 0 : 1);
  if (p.contractType === 'youth' && p.squad === 'First team') p.contractType = 'full-time';
  if (p.morale === 'low') p.morale = 'ok';
  inbox(s, { category: 'transfers', from: 'Director of football', subject: `${p.name} signs a new contract`, body: [`${p.name} has agreed a new deal until June ${p.contractEnd + 1} at ${Math.round(wage / 1000)}k a week.`] });
  return null;
}

/**
 * Season end, before the year rolls over: contracts ending this summer run out.
 * AI clubs keep useful players; everyone else (and the user's unrenewed players) become free agents.
 * Youth contracts are extended automatically (youth players leave at 22 instead).
 */
export function expireContracts(s: GameState) {
  for (const p of Object.values(s.players)) {
    if (p.clubId === FREE_AGENT || p.contractEnd > s.year) continue;
    if (p.contractType === 'youth' && p.squad !== 'First team') { p.contractEnd = s.year + 1; continue; }
    if (p.clubId !== s.userClubId) {
      const r = rankAt(s, p, p.clubId);
      if (r <= 16 && p.age <= 32) { p.contractEnd = s.year + (p.age >= 30 ? 1 : 3); continue; }
    } else if (honourPreContract(s, p)) {
      inbox(s, { category: 'transfers', from: 'Director of football', subject: `${p.name} joins ${clubName(s, p.clubId)}`, body: [`${p.name}'s contract has run out and he has joined ${clubName(s, p.clubId)} on the pre-contract he signed.`] });
      s.lineup = s.lineup.filter((id) => id !== p.id);
      continue;
    } else {
      inbox(s, { category: 'transfers', from: 'Director of football', subject: `${p.name} leaves on a free transfer`, body: [`${p.name}'s contract has run out and he has left the club.`] });
      s.lineup = s.lineup.filter((id) => id !== p.id);
    }
    p.clubId = FREE_AGENT; noteJoined(s, p); p.captain = false; p.squad = 'First team'; p.contractType = 'full-time';
  }
}

/** Installments for earlier signings, paid every matchday. */
export function payInstallments(s: GameState) {
  for (const i of s.installments) {
    const pay = Math.min(i.perMatchday, i.remaining);
    i.remaining -= pay;
    if (s.clubs[i.clubId]) s.clubs[i.clubId].balance -= pay;
    if (i.clubId === s.userClubId && s.ledger) s.ledger.expenses.transfers += pay;
    if (i.toClubId && s.clubs[i.toClubId]) { s.clubs[i.toClubId].balance += pay; if (i.toClubId === s.userClubId && s.ledger) s.ledger.income.sales += pay; }
  }
  s.installments = s.installments.filter((i) => i.remaining > 0);
}

export function scoutingTick(s: GameState) {
  for (const id of [...s.scouting]) {
    const p = s.players[id];
    if (!p) { stopScouting(s, id); continue; }
    const k = Math.min(100, (s.knowledge[id] ?? BASE_KNOWLEDGE) + scoutPerMatchday(s));
    s.knowledge[id] = k;
    if (k >= 100) {
      stopScouting(s, id);
      inbox(s, { category: 'scouting', from: 'Chief scout', subject: `Full report: ${p.name} (${p.age}, ${p.pos}, ${clubName(s, p.clubId)})`, body: [`We now know everything about ${p.name}. His attributes and potential are fully scouted.`, `Asking price: about ${Math.round(askingPrice(s, p) / 1e5) / 10}M.`], playerId: p.id });
    }
  }
}

export function inbox(s: GameState, m: { category: GameStateMsg['category']; from: string; role?: string; subject: string; body: string[]; bidId?: string; playerId?: string }) {
  const slot = s.calendar[Math.min(s.matchday, s.calendar.length) - 1];
  const date = new Date(slot.date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  s.inbox.unshift({ ...m, id: `m${s.nextId++}`, date, unread: true });
  if (s.inbox.length > 80) s.inbox.length = 80;
}
type GameStateMsg = GameState['inbox'][number];

export const seasonOf = (s: GameState) => seasonLabel(s.year);
