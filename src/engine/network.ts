/* The scouting network: send scouts on assignments (a country, a league, or a brief such as "left-back under 23,
   under 10M") for a few weeks. Each week an assignment recommends the players who stood out, graded against your
   squad, and the scout's watching makes them partly known. Better chief scouts run more assignments and judge
   more accurately. */
import { squadOf } from './index';
import { staffRating } from './staff';
import { askingPrice, BASE_KNOWLEDGE } from './transfers';
import { dateOf } from './windows';
import { POS_GROUP } from './ratings';
import type { GameState, Player } from './types';

export interface Brief { pos?: string; maxAge?: number; maxPrice?: number }
export interface Assignment { id: string; kind: 'country' | 'league' | 'brief'; target?: string; brief?: Brief; from: string; until: string; last: string; found: number }
export type Grade = 'A' | 'B' | 'C';
export interface Recommendation { playerId: string; date: string; assignmentId: string; grade: Grade; why: string }

const DAY = 86_400_000;
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * DAY).toISOString().slice(0, 10);
function hash(t: string) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export const maxAssignments = (s: GameState) => 2 + Math.floor(staffRating(s, 'scout') / 8); // 2–4
export const assignments = (s: GameState) => (s.network ??= { assignments: [], recs: [], seq: 0 });

export function assignmentLabel(s: GameState, a: Assignment, nationName: (c: string) => string) {
  if (a.kind === 'country') return `Players in ${nationName(a.target ?? '')}`;
  if (a.kind === 'league') return `The ${s.world.leagues.find((l) => l.id === a.target)?.name ?? 'league'}`;
  const b = a.brief ?? {};
  return [b.pos ?? 'Any position', b.maxAge ? `under ${b.maxAge + 1}` : '', b.maxPrice ? `up to ${Math.round(b.maxPrice / 1e5) / 10}M` : ''].filter(Boolean).join(', ');
}

/** Sends scouts on an assignment for `weeks` weeks. */
export function addAssignment(s: GameState, a: Pick<Assignment, 'kind' | 'target' | 'brief'>, weeks: number): string | null {
  const n = assignments(s);
  if (n.assignments.length >= maxAssignments(s)) return `Your scouts are all out. A better chief scout can run more assignments (you can run ${maxAssignments(s)}).`;
  const from = dateOf(s);
  n.assignments.push({ ...a, id: `as${++n.seq}`, from, until: addDays(from, weeks * 7), last: from, found: 0 });
  return null;
}
export function endAssignment(s: GameState, id: string) { const n = assignments(s); n.assignments = n.assignments.filter((a) => a.id !== id); }
export function dismiss(s: GameState, playerId: string) { const n = assignments(s); n.recs = n.recs.filter((r) => r.playerId !== playerId); }

function matches(s: GameState, a: Assignment, p: Player) {
  if (p.clubId === s.userClubId || p.squad !== 'First team' || p.id.startsWith('nt-') || p.loan) return false;
  const club = s.clubs[p.clubId];
  if (a.kind === 'country') return (club ? club.country : '') === a.target || (!club && p.nationality === a.target);
  if (a.kind === 'league') return club?.league === a.target;
  const b = a.brief ?? {};
  if (b.pos && p.pos !== b.pos) return false;
  if (b.maxAge && p.age > b.maxAge) return false;
  if (b.maxPrice && askingPrice(s, p) > b.maxPrice) return false;
  return true;
}

/** How your scout sees a player: true ability blurred by up to ±12 for a poor scout, ±3 for the best. */
function seen(s: GameState, p: Player, field: 'ability' | 'potential') {
  const err = 15 - staffRating(s, 'scout') * 0.6;
  const h = (hash(p.id + field + 'scout') % 1000) / 1000 - 0.5;
  return p[field] + h * 2 * err;
}

/** Grades a player against your squad at his position. */
export function judge(s: GameState, p: Player): { grade: Grade; why: string } {
  const mine = squadOf(s, s.userClubId).filter((x) => x.squad === 'First team' && POS_GROUP[x.pos] === POS_GROUP[p.pos]).map((x) => x.ability).sort((a, b) => b - a);
  const bar = mine.length ? mine.slice(0, 2).reduce((a, b) => a + b, 0) / Math.min(2, mine.length) : 60;
  const ab = seen(s, p, 'ability'), pot = seen(s, p, 'potential');
  if (ab >= bar + 4) return { grade: 'A', why: 'Would walk into our team.' };
  if (p.age <= 21 && pot >= bar + 8) return { grade: ab >= bar - 12 ? 'A' : 'B', why: 'A real prospect: could become a star here.' };
  if (ab >= bar - 4) return { grade: 'B', why: 'Would compete for a place.' };
  if (p.age <= 23 && pot >= bar) return { grade: 'B', why: 'One for the future.' };
  return { grade: 'C', why: 'Squad depth at best.' };
}

/** Daily: each assignment reports once a week with its best finds; finished assignments report and end.
    Returns a line per assignment that reported (for the inbox). */
export function scoutingNetworkDay(s: GameState): string[] {
  const n = s.network;
  if (!n?.assignments.length) return [];
  const today = dateOf(s), out: string[] = [];
  const known = new Set([...n.recs.map((r) => r.playerId), ...s.shortlist, ...s.scouting]);
  for (const a of [...n.assignments]) {
    if (Date.parse(today) - Date.parse(a.last) < 7 * DAY) continue;
    a.last = today;
    const pool = Object.values(s.players).filter((p) => !known.has(p.id) && matches(s, a, p));
    // the best of what the scout watched this week: a sample, then the highest-graded
    const sample = pool.filter((p) => hash(p.id + today + a.id) % 4 === 0).map((p) => ({ p, j: judge(s, p) }));
    const order: Record<Grade, number> = { A: 0, B: 1, C: 2 };
    const picks = sample.sort((x, y) => order[x.j.grade] - order[y.j.grade] || seen(s, y.p, 'ability') - seen(s, x.p, 'ability')).slice(0, 2).filter((x) => x.j.grade !== 'C' || a.found === 0);
    for (const { p, j } of picks) {
      n.recs.unshift({ playerId: p.id, date: today, assignmentId: a.id, grade: j.grade, why: j.why });
      s.knowledge[p.id] = Math.max(s.knowledge[p.id] ?? BASE_KNOWLEDGE, 55);
      known.add(p.id);
      a.found++;
    }
    if (picks.length) out.push(`${picks.map(({ p, j }) => `${p.name} (${p.pos}, ${p.age}, ${s.clubs[p.clubId]?.name ?? 'free agent'}): grade ${j.grade}`).join('; ')}.`);
    if (today >= a.until) endAssignment(s, a.id);
  }
  n.recs = n.recs.slice(0, 40);
  return out;
}
