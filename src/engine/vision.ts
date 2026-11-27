/* The board's club vision: a long-term league objective and two style objectives, judged at the end of each
   season into the board's trust; requests to the board (once a season); and the occasional takeover that
   changes the money and the ambitions. */
import { clubsInLeague, leagueDef, leagueTableOf } from './competitions';
import { facilitiesOf, MAX_LEVEL } from './facilities';
import { squadOf } from './index';
import type { Rng } from './rng';
import type { GameState } from './types';

export type GoalKind = 'league' | 'attacking' | 'youth' | 'wages';
export interface VisionGoal { kind: GoalKind; text: string; /** League goal: the position to reach (1 = win it), by the season starting in `by`. */ pos?: number; by?: number; status?: 'met' | 'on track' | 'behind' | 'failed'; last?: string }
export interface ClubVision { clubId: string; set: number; goals: VisionGoal[]; owners?: string; asked?: number }

const size = (s: GameState, clubId: string) => { const r = s.clubs[clubId].reputation; return r >= 80 ? 'giant' : r >= 62 ? 'established' : 'small'; };

/** A new vision for a club: by its size and division. */
export function makeVision(s: GameState, clubId: string, owners?: string, ambition = 0, start = s.year): ClubVision {
  const c = s.clubs[clubId], l = leagueDef(s, c.league);
  const n = l ? clubsInLeague(s, l.id).length : 20;
  const sz = size(s, clubId);
  let league: VisionGoal;
  if (l && l.tier > 1) league = { kind: 'league', text: `Win promotion within ${3 - Math.min(1, ambition)} seasons`, pos: Math.max(1, l.promote), by: start + 2 - Math.min(1, ambition) };
  else if (sz === 'giant') league = { kind: 'league', text: `Win the league within ${3 - Math.min(1, ambition)} seasons`, pos: 1, by: start + 2 - Math.min(1, ambition) };
  else if (sz === 'established') { const top = Math.max(2, 4 - ambition); league = { kind: 'league', text: `Finish in the top ${top} within 3 seasons`, pos: top, by: start + 2 }; }
  else { const half = Math.max(4, Math.ceil(n / 2) - ambition * 2); league = { kind: 'league', text: `Reach the top ${half} within 3 seasons`, pos: half, by: start + 2 }; }
  const style: VisionGoal[] = sz === 'giant'
    ? [{ kind: 'attacking', text: 'Play attacking football: be among the league\'s top scorers' }, { kind: 'wages', text: 'Keep the wage bill within the budget' }]
    : sz === 'established'
      ? [{ kind: 'attacking', text: 'Play attacking football: be among the league\'s top scorers' }, { kind: 'youth', text: 'Give young players a chance: two aged 21 or under with ten games or more' }]
      : [{ kind: 'youth', text: 'Give young players a chance: two aged 21 or under with ten games or more' }, { kind: 'wages', text: 'Keep the wage bill within the budget' }];
  return { clubId, set: start, goals: [league, ...style], ...(owners ? { owners } : {}) };
}

/** Your club's vision (set the first time it is asked for, and again after a move or a takeover). */
export function visionOf(s: GameState): ClubVision {
  if (!s.vision || s.vision.clubId !== s.userClubId) s.vision = makeVision(s, s.userClubId);
  return s.vision;
}

const wageBill = (s: GameState) => squadOf(s, s.userClubId).reduce((a, p) => a + p.wage, 0);

/** Judges the season (before the new one is set up): each goal's status and the change in trust. */
export function judgeVision(s: GameState): { trust: number; lines: string[] } {
  const v = visionOf(s);
  const us = s.clubs[s.userClubId];
  const table = us.league ? leagueTableOf(s, us.league) : [];
  const pos = table.findIndex((r) => r.clubId === us.id) + 1;
  let trust = 0;
  const lines: string[] = [];
  for (const g of v.goals) {
    if (g.status === 'met' && g.kind === 'league') continue;
    if (g.kind === 'league') {
      const done = pos > 0 && pos <= (g.pos ?? 1);
      g.status = done ? 'met' : s.year >= (g.by ?? s.year) ? 'failed' : pos > 0 && pos <= (g.pos ?? 1) + 3 ? 'on track' : 'behind';
      g.last = pos ? `finished ${ord(pos)}` : 'no league';
    } else if (g.kind === 'attacking') {
      const goals = table.map((r) => r.gf).sort((a, b) => b - a);
      const mine = table.find((r) => r.clubId === us.id)?.gf ?? 0;
      const rank = goals.indexOf(mine) + 1;
      g.status = rank > 0 && rank <= Math.max(3, Math.ceil(table.length / 4)) ? 'met' : 'behind';
      g.last = `${mine} league goals, ${rank ? ord(rank) : '–'} in the league`;
    } else if (g.kind === 'youth') {
      const kids = squadOf(s, us.id).filter((p) => p.age <= 21 && p.current.apps >= 10).length;
      g.status = kids >= 2 ? 'met' : 'behind';
      g.last = `${kids} young player${kids === 1 ? '' : 's'} with ten games or more`;
    } else if (g.kind === 'wages') {
      const bill = wageBill(s);
      g.status = bill <= us.wageBudget * 1.02 ? 'met' : 'behind';
      g.last = `wage bill ${Math.round(bill / 1000)}k a week against a budget of ${Math.round(us.wageBudget / 1000)}k`;
    }
    const d = g.status === 'met' ? 4 : g.status === 'on track' ? 1 : g.status === 'behind' ? -3 : -8;
    trust += d;
    lines.push(`${g.text}: ${g.status}${g.last ? ` (${g.last})` : ''}.`);
  }
  return { trust, lines };
}

/** After judging: a fresh vision when the league objective is settled (met or failed). */
export function renewVisionIfDone(s: GameState) {
  const v = visionOf(s);
  const league = v.goals.find((g) => g.kind === 'league');
  if (league && (league.status === 'met' || league.status === 'failed')) { s.vision = makeVision(s, s.userClubId, v.owners, league.status === 'met' ? 1 : 0, s.year + 1); return true; }
  return false;
}

/* ---------- requests to the board ---------- */
export type BoardRequest = 'transfer' | 'wages' | 'youth';
export const REQUESTS: Array<{ id: BoardRequest; label: string; desc: string }> = [
  { id: 'transfer', label: 'More transfer funds', desc: 'A quarter more to spend this season.' },
  { id: 'wages', label: 'A bigger wage budget', desc: 'A tenth more for wages.' },
  { id: 'youth', label: 'Invest in the academy', desc: 'The board pays for better youth facilities.' },
];

/** Once a season. The board says yes when it trusts you and the club can afford it. */
export function askBoard(s: GameState, req: BoardRequest, trust: number): { ok: boolean; text: string } {
  const v = visionOf(s);
  const c = s.clubs[s.userClubId];
  if (v.asked === s.year) return { ok: false, text: 'You have already been to the board this season.' };
  v.asked = s.year;
  if (trust < 60) return { ok: false, text: 'The board wants to see results before it gives you more.' };
  if (req === 'transfer') {
    if (c.balance < c.transferBudget * 0.5) return { ok: false, text: 'The board says the club can\'t afford it: the bank balance is too low.' };
    const add = Math.round(c.transferBudget * 0.25 / 100_000) * 100_000;
    c.transferBudget += add;
    return { ok: true, text: `The board agrees: ${Math.round(add / 1e5) / 10}M more to spend this season.` };
  }
  if (req === 'wages') {
    if (c.balance < 0) return { ok: false, text: 'With the club in debt, the board won\'t raise the wage budget.' };
    const add = Math.round(c.wageBudget * 0.1 / 1000) * 1000;
    c.wageBudget += add;
    return { ok: true, text: `The board agrees: the wage budget goes up by ${Math.round(add / 1000)}k a week.` };
  }
  const f = facilitiesOf(s, c.id);
  if (f.youth >= MAX_LEVEL) return { ok: false, text: 'The academy facilities are already the best there are.' };
  if (trust < 70) return { ok: false, text: 'The board is not ready to invest in the academy yet.' };
  c.facilities = { ...f, youth: f.youth + 1 };
  return { ok: true, text: `The board agrees to invest: the youth facilities go up to level ${f.youth + 1}.` };
}

/* ---------- takeovers ---------- */
/** At the end of a season, now and then: new owners. Ambitious ones bring money and higher targets;
    cost-cutters bring less money and a focus on wages. Returns the news, if any. */
export function maybeTakeover(s: GameState, rng: Rng): string[] | null {
  const c = s.clubs[s.userClubId];
  const chance = c.reputation >= 85 ? 0.02 : 0.05;
  if (!rng.chance(chance)) return null;
  if (rng.chance(0.6)) {
    const owners = rng.pick(['an investment group', 'a consortium of local businessmen', 'an overseas billionaire', 'a sports investment fund']);
    c.balance += Math.round(c.reputation * 600_000);
    c.transferBudget = Math.round(c.transferBudget * 1.5);
    c.wageBudget = Math.round(c.wageBudget * 1.15);
    c.reputation = Math.min(99, c.reputation + 3);
    s.vision = makeVision(s, c.id, `New owners: ${owners} (ambitious)`, 1, s.year + 1);
    return [`The club has been taken over by ${owners}. They want success, and fast.`, `Transfer budget up by half, more for wages, and new targets: ${s.vision.goals[0].text.toLowerCase()}.`];
  }
  const owners = rng.pick(['a private equity firm', 'new owners focused on the balance sheet']);
  c.transferBudget = Math.round(c.transferBudget * 0.7);
  c.wageBudget = Math.round(c.wageBudget * 0.95);
  s.vision = makeVision(s, c.id, `New owners: ${owners} (cost-cutting)`, 0, s.year + 1);
  return [`The club has been taken over by ${owners}. They want the books balanced.`, 'The transfer budget is cut by almost a third and the wage bill is under scrutiny.'];
}

const ord = (n: number) => { const x = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (x[(v - 20) % 10] || x[v] || x[0]); };
