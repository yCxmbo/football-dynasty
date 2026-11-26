/* Pre-season friendlies and tours. Arranged before the first game of the season; played on the weekends
   before it. They don't count for stats or records; each one played sharpens your team for the opening weeks. */
import type { Rng } from './rng';
import type { Fixture, GameState } from './types';

export interface FriendlyOffer { clubId: string; kind: 'home' | 'tour'; region?: string; fee: number }
export const MAX_FRIENDLIES = 3;

/** Offers for the coming pre-season: lower-league clubs at home, and tours against big clubs abroad. */
export function makeFriendlyOffers(s: GameState, rng: Rng) {
  const us = s.clubs[s.userClubId];
  const home = Object.values(s.clubs).filter((c) => c.country === us.country && c.league && c.id !== us.id && c.reputation < us.reputation - 5);
  const abroad = (pred: (cid: string) => boolean) => Object.values(s.clubs).filter((c) => c.league && pred(c.country) && c.country !== us.country && c.reputation >= Math.min(75, us.reputation));
  const pick = <T,>(list: T[], n: number) => { const out: T[] = []; const pool = [...list]; while (out.length < n && pool.length) out.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]); return out; };
  const fee = (base: number) => Math.round((base * us.reputation * us.reputation) / 8100 / 100_000) * 100_000;
  const tours: Array<[string, (c: string) => boolean, number]> = [
    ['USA', (c) => c === 'usa' || c === 'mex', 3_000_000], ['Middle East and Asia', (c) => c === 'ksa' || c === 'asi', 4_000_000], ['Europe', (c) => ['eng', 'esp', 'ita', 'ger', 'fra', 'por', 'ned'].includes(c), 2_000_000],
  ];
  s.friendlyOffers = [
    ...pick(home, 2).map((c) => ({ clubId: c.id, kind: 'home' as const, fee: homeGate(s) })),
    ...tours.flatMap(([region, pred, base]) => pick(abroad(pred), 1).map((c) => ({ clubId: c.id, kind: 'tour' as const, region, fee: fee(base) }))),
  ];
}

export const friendliesArranged = (s: GameState) => s.fixtures.filter((f) => f.comp === 'friendly');
export const canArrange = (s: GameState) => s.matchday === 1 && friendliesArranged(s).length < MAX_FRIENDLIES;

/** Puts a friendly on the weekend before the earliest game, shifting the calendar. */
export function arrangeFriendly(s: GameState, clubId: string): string | null {
  const offer = s.friendlyOffers?.find((o) => o.clubId === clubId);
  if (!offer) return 'That offer is no longer open.';
  if (s.matchday !== 1) return 'Friendlies can only be arranged before the first game of the season.';
  if (friendliesArranged(s).length >= MAX_FRIENDLIES) return `Up to ${MAX_FRIENDLIES} friendlies in a pre-season.`;
  const first = new Date(s.calendar[0].date + 'T12:00:00Z');
  first.setUTCDate(first.getUTCDate() - 7);
  for (const f of s.fixtures) f.matchday += 1;
  s.calendar = [{ index: 0, date: first.toISOString().slice(0, 10), week: 0, day: 'Sat', entries: [{ comp: 'friendly', round: offer.kind === 'tour' ? `${offer.region} tour` : 'Friendly' }] }, ...s.calendar];
  s.calendar.forEach((sl, i) => { sl.index = i; });
  const tour = offer.kind === 'tour';
  (s.friendlyFees ??= {});
  const f: Fixture = { id: `x${s.nextId++}`, comp: 'friendly', round: tour ? `${offer.region} tour` : 'Friendly', matchday: 1, date: s.calendar[0].date,
    homeId: tour ? clubId : s.userClubId, awayId: tour ? s.userClubId : clubId, ...(tour ? { neutral: true } : {}) } as Fixture;
  s.fixtures.push(f);
  s.friendlyFees![f.id] = tour ? offer.fee : homeGate(s);
  s.friendlyOffers = s.friendlyOffers!.filter((o) => o.clubId !== clubId);
  return null;
}

/** A home friendly fills about 40% of the ground at friendly prices. */
export const homeGate = (s: GameState) => { const us = s.clubs[s.userClubId]; return Math.round(us.capacity * 0.4) * Math.round(10 + us.reputation * 0.3); };

/** After a friendly: money, and for tours a little reputation. Returns a line for the inbox. */
export function afterFriendly(s: GameState, f: Fixture) {
  const us = s.clubs[s.userClubId];
  const tour = f.round.endsWith('tour');
  const earned = s.friendlyFees?.[f.id] ?? homeGate(s);
  us.balance += earned;
  if (s.ledger) s.ledger.income.gate += earned;
  if (tour) us.reputation = Math.min(95, us.reputation + 1);
  s.preseason = (s.preseason ?? 0) + 1;
  return { earned, tour };
}

/** Sharpness from friendlies: a small boost in the first five league weeks. */
export const sharpness = (s: GameState, week: number) => (week >= 1 && week <= 5 ? 1 + Math.min(MAX_FRIENDLIES, s.preseason ?? 0) * 0.01 : 1);
