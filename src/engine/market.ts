/* The transfer market between computer-run clubs: big clubs sign the best players from smaller ones, in the
   summer (at the season's turn) and in January. Rumours build before each window; many come true, and a
   rumour about one of your players brings a bid when the window opens. */
import { noteJoined, squadOf } from './index';
import { recordTransfer } from './records';
import type { Rng } from './rng';
import { FREE_AGENT, type GameState, type Player } from './types';
import { wageFor } from './world';

export interface Rumour { playerId: string; name: string; fromId: string; toId: string; window: 'Summer' | 'January'; /** 1 = talk, 3 = close to a deal. */ heat: number }

const firstTeam = (s: GameState, clubId: string) => squadOf(s, clubId).filter((p) => p.squad === 'First team');

/** A club's level: the average of its best eleven, and the bar a signing must clear (its ninth-best player). */
function level(s: GameState, clubId: string) {
  const ft = firstTeam(s, clubId).map((p) => p.ability).sort((a, b) => b - a).slice(0, 11);
  const avg = ft.length ? ft.reduce((a, b) => a + b, 0) / ft.length : 60;
  return { avg, bar: (ft[8] ?? ft[ft.length - 1] ?? 60) + 2 };
}

/** What it takes to prise a player away: his value, more with a long contract, capped by a release clause. */
export function marketFee(s: GameState, p: Player) {
  const years = p.contractEnd - s.year;
  let fee = p.value * (years <= 0 ? 0.6 : years === 1 ? 1.0 : 1.2);
  if (p.releaseClause && p.releaseClause < fee) fee = p.releaseClause;
  return Math.round(fee / 100_000) * 100_000;
}

/** Players worth chasing: first-teamers at computer-run clubs (or yours, for rumours), best first. */
export function marketPool(s: GameState, includeUser = false) {
  return Object.values(s.players).filter((p) => p.squad === 'First team' && !p.loan && !p.preContract && p.age >= 18 && p.age <= 30 && p.ability >= 90
    && s.clubs[p.clubId]?.league && (includeUser || p.clubId !== s.userClubId)).sort((a, b) => b.ability - a.ability);
}

/** A player who would improve the buyer, from a clearly smaller club, at a fee it can pay. */
export function findTarget(s: GameState, rng: Rng, buyerId: string, pool: Player[], budget: number) {
  const buyer = s.clubs[buyerId];
  const lv = level(s, buyerId);
  const options: Player[] = [];
  for (const p of pool) {
    if (p.ability > lv.avg + 25) continue;
    if (p.ability < lv.bar) break; // pool is sorted: nobody further down improves the side
    const seller = s.clubs[p.clubId];
    if (!seller || p.clubId === buyerId || seller.reputation > buyer.reputation - 3) continue;
    if (marketFee(s, p) > budget) continue;
    options.push(p);
    if (options.length >= 6) break;
  }
  return options.length ? options[rng.int(0, options.length - 1)] : undefined;
}

function freeNumber(s: GameState, clubId: string) {
  const used = new Set(squadOf(s, clubId).map((p) => p.number));
  for (let n = 2; n < 99; n++) if (!used.has(n)) return n;
  return 99;
}

/** Completes a deal between two computer-run clubs. The buyer lets its weakest first-teamer go if the squad is full. */
export function completeDeal(s: GameState, p: Player, buyerId: string, fee: number, season: string, rumoured = false) {
  const buyer = s.clubs[buyerId], seller = s.clubs[p.clubId];
  seller.balance += fee; seller.transferBudget += Math.round(fee * 0.5);
  buyer.balance -= fee; buyer.transferBudget = Math.max(0, buyer.transferBudget - fee);
  recordTransfer(s, p.name, seller.name, buyer.name, fee, season, { playerId: p.id, fromId: seller.id, toId: buyer.id, rumoured });
  Object.assign(p, { clubId: buyerId, number: freeNumber(s, buyerId), captain: false, joined: s.year, morale: 'high', contractEnd: Math.max(p.contractEnd, s.year + 4),
    wage: Math.max(p.wage, wageFor(p.ability, buyer.reputation)) });
  delete p.releaseClause;
  noteJoined(s, p);
  const ft = firstTeam(s, buyerId);
  if (ft.length > 25) {
    const out = ft.filter((x) => x.id !== p.id && x.pos === p.pos).sort((a, b) => a.ability - b.ability)[0] ?? ft.filter((x) => x.id !== p.id).sort((a, b) => a.ability - b.ability)[0];
    if (out) Object.assign(out, { clubId: FREE_AGENT, captain: false });
  }
  s.rumours = (s.rumours ?? []).filter((r) => r.playerId !== p.id);
}

/** How much a computer-run club can spend: half of what it holds above a reserve that grows with its size. */
export const spendable = (s: GameState, clubId: string) => {
  const c = s.clubs[clubId];
  return Math.max(0, (c.balance - c.reputation * c.reputation * 5000) * 0.5, Math.min(c.transferBudget, c.balance + c.reputation * 1_000_000));
};

/** A window's business: biggest clubs first, rumoured deals tried first. Returns the deals done. */
export function runMarket(s: GameState, rng: Rng, window: 'Summer' | 'January', season: string) {
  const pool = marketPool(s);
  const done: Player[] = [];
  const buyers = Object.values(s.clubs).filter((c) => c.id !== s.userClubId && c.league && c.reputation >= 45).sort((a, b) => b.reputation - a.reputation);
  const perClub = window === 'Summer' ? 2 : 1;
  for (const c of buyers) {
    if (window === 'January' && !rng.chance(0.25)) continue;
    let budget = spendable(s, c.id);
    for (let i = 0; i < perClub && budget > 0; i++) {
      // a rumoured target first, if he's still there and affordable
      const r = (s.rumours ?? []).find((x) => x.toId === c.id && x.window === window && s.players[x.playerId]?.clubId === x.fromId && x.fromId !== s.userClubId);
      let p = r && rng.chance(0.45 + r.heat * 0.15) ? s.players[r.playerId] : undefined;
      if (p && marketFee(s, p) > budget * 1.5) p = undefined;
      p ??= rng.chance(window === 'Summer' ? 0.7 : 0.5) ? findTarget(s, rng, c.id, pool, budget) : undefined;
      if (!p) break;
      const fee = marketFee(s, p);
      completeDeal(s, p, c.id, fee, season, !!r && r.playerId === p.id);
      pool.splice(pool.indexOf(p), 1);
      done.push(p);
      budget -= fee;
    }
  }
  // rumours about your players stay: they turn into bids once the window is open (see aiBids)
  s.rumours = (s.rumours ?? []).filter((x) => x.window !== window || x.fromId === s.userClubId);
  return done;
}

/** Talk before a window: about a dozen links between big clubs and players who'd suit them. Some involve your players. */
export function makeRumours(s: GameState, rng: Rng, window: 'Summer' | 'January') {
  const pool = marketPool(s, true);
  const big = Object.values(s.clubs).filter((c) => c.id !== s.userClubId && c.league && c.reputation >= 62);
  const out: Rumour[] = [];
  for (let tries = 0; tries < 60 && out.length < 14; tries++) {
    const c = big[rng.int(0, big.length - 1)];
    const p = findTarget(s, rng, c.id, pool, spendable(s, c.id) * 1.3 + 5_000_000);
    if (!p || out.some((r) => r.playerId === p.id)) continue;
    out.push({ playerId: p.id, name: p.name, fromId: p.clubId, toId: c.id, window, heat: rng.int(1, 3) });
  }
  s.rumours = [...(s.rumours ?? []).filter((r) => r.window !== window), ...out];
  return out;
}
