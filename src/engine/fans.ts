/* Your supporters: their mood (0–100) rises and falls with results against what was expected (derbies count
   double), with signings and sales of stars, and with ticket prices. Happy fans fill the ground and give a small
   lift at home; unhappy ones stay away, write to the club and, at worst, protest, and the board notices. */
import { matchOdds } from './preview';
import { squadOf } from './index';
import type { Fixture, GameState, Player } from './types';

export type TicketPrice = 'low' | 'normal' | 'high';
export interface Fans { mood: number; ticket: TicketPrice; /** Mood after each of your matches, oldest first (last 20). */ trend: number[]; /** Recent reasons, newest first. */ notes: string[]; flags?: Record<string, boolean> }

export const TICKETS: Array<{ id: TicketPrice; label: string; price: number; fill: number; mood: number; desc: string }> = [
  { id: 'low', label: 'Cheap', price: 0.8, fill: 0.08, mood: 0.4, desc: 'Fuller ground and grateful fans; less money per ticket.' },
  { id: 'normal', label: 'Normal', price: 1, fill: 0, mood: 0, desc: 'The usual prices.' },
  { id: 'high', label: 'Expensive', price: 1.25, fill: -0.08, mood: -0.5, desc: 'More money per ticket, fewer fans, and they grumble.' },
];

export function fansOf(s: GameState): Fans {
  return (s.fans ??= { mood: 60, ticket: 'normal', trend: [], notes: [] });
}
export const fanWord = (m: number) => (m >= 80 ? 'Delighted' : m >= 62 ? 'Happy' : m >= 45 ? 'Patient' : m >= 30 ? 'Restless' : m >= 15 ? 'Angry' : 'In revolt');
/** Gate: price per ticket and a change to how full the ground is (your club only). */
export function gateFactors(s: GameState) {
  const f = fansOf(s), t = TICKETS.find((x) => x.id === f.ticket)!;
  return { price: t.price, fill: t.fill + (f.mood - 50) / 500 };
}
/** A full, happy ground lifts the side a little at home. */
export const homeLift = (s: GameState) => (fansOf(s).mood >= 75 ? 1.005 : 1);

const note = (f: Fans, t: string) => { f.notes = [t, ...f.notes].slice(0, 6); };
const clamp = (v: number) => Math.max(0, Math.min(100, v));

/** After one of your competitive matches. Returns inbox messages (subject, body) for thresholds crossed. */
export function fansAfterMatch(s: GameState, f: Fixture, derby?: string): Array<{ subject: string; body: string[] }> {
  const fans = fansOf(s), us = s.userClubId;
  const home = f.homeId === us, opp = s.clubs[home ? f.awayId : f.homeId];
  const [h, a] = f.result!.score, gf = home ? h : a, ga = home ? a : h;
  const won = f.result!.winnerId ? f.result!.winnerId === us : gf > ga, lost = f.result!.winnerId ? f.result!.winnerId !== us : gf < ga;
  const o = matchOdds(s, f.homeId, f.awayId, f.neutral);
  const pWin = home ? o.home : o.away, pDraw = o.draw;
  const expected = (3 * pWin + pDraw) / 100, got = won ? 3 : lost ? 0 : 1;
  let d = (got - expected) * 2.4 * (derby ? 2 : 1);
  d += won ? 1.2 : lost ? -1 : 0; // fans like winning, whatever the odds said
  if (won && gf - ga >= 3) d += 2;
  if (lost && ga - gf >= 3) d -= 3;
  if (home) d += TICKETS.find((x) => x.id === fans.ticket)!.mood;
  d += (58 - fans.mood) * 0.08; // moods settle over time
  const before = fans.mood;
  fans.mood = clamp(Math.round((fans.mood + d) * 10) / 10);
  fans.trend = [...fans.trend, Math.round(fans.mood)].slice(-20);
  if (derby && won) note(fans, `Beat ${opp.name} in the derby`);
  else if (derby && lost) note(fans, `Lost the derby to ${opp.name}`);
  else if (d >= 4) note(fans, `${won ? 'Beat' : 'Held'} ${opp.name} against the odds`);
  else if (d <= -4) note(fans, `${lost ? 'Lost to' : 'Dropped points against'} ${opp.name}`);
  // the board listens to the stands
  const c = s.career;
  if (c && !c.sacked) c.trust = Math.max(0, Math.min(100, c.trust + (fans.mood - 50) * 0.01));
  return thresholds(s, before);
}

function thresholds(s: GameState, before: number) {
  const fans = fansOf(s), m = fans.mood, out: Array<{ subject: string; body: string[] }> = [];
  const flags = (fans.flags ??= {});
  const once = (k: string) => { const key = `${s.year}:${k}`; if (flags[key]) return false; flags[key] = true; return true; };
  if (before >= 30 && m < 30 && once('letter')) out.push({ subject: 'A letter from the supporters\' trust', body: ['The supporters\' trust has written to the club: results and performances are not good enough, and they want to know what the plan is.', 'Crowds will fall if things don\'t improve. Cheaper tickets would help a little.'] });
  if (before >= 15 && m < 15 && once('protest')) {
    out.push({ subject: 'Fans protest outside the ground', body: ['Several hundred supporters protested outside the ground before the game. Banners called for change.', 'The board is worried: its confidence in you has dropped.'] });
    if (s.career) s.career.trust = Math.max(0, s.career.trust - 5);
  }
  if (before < 80 && m >= 80 && once('love')) out.push({ subject: 'The fans are loving it', body: ['Your name is being sung from the stands. Season tickets for next year are selling fast.', 'A full, happy ground gives the team a small lift at home.'] });
  return out;
}

/** A signing or a sale: fans like stars arriving and hate stars leaving. */
export function fansOnTransfer(s: GameState, p: Player, incoming: boolean) {
  const fans = fansOf(s);
  const ft = squadOf(s, s.userClubId).filter((x) => x.squad === 'First team' && x.id !== p.id).map((x) => x.ability).sort((a, b) => b - a);
  const rank = 1 + ft.filter((v) => v > p.ability).length;
  if (rank > 5) return;
  const d = (incoming ? 1 : -1) * (rank <= 2 ? 6 : 3);
  fans.mood = clamp(fans.mood + d);
  note(fans, incoming ? `Signed ${p.name}` : `Sold ${p.name}`);
}

export function setTicketPrice(s: GameState, t: TicketPrice) { fansOf(s).ticket = t; }
/** New season: hope springs eternal (moods move halfway back towards 60). */
export function fansNewSeason(s: GameState) {
  const f = fansOf(s);
  f.mood = Math.round(f.mood + (60 - f.mood) * 0.5);
  f.trend = [];
  f.notes = [];
}
