/* Squad dynamics for your club: who has influence in the dressing room, who is happy and why, the groups that
   form, and mentoring. The atmosphere this adds up to nudges performances; unhappy leaders and groups spread
   their mood. */
import { squadOf } from './index';
import { createRng, type Rng } from './rng';
import { developStep } from './training';
import { ROLE_SHARE } from './negotiation';
import { nationName } from './nations';
import type { GameState, Player } from './types';

export type Tier = 'Team leader' | 'Highly influential' | 'Influential' | 'Other';
export const TIER_WEIGHT: Record<Tier, number> = { 'Team leader': 3, 'Highly influential': 2, Influential: 1.5, Other: 1 };
export interface Mood { id: string; tier: Tier; influence: number; score: number; label: string; reasons: string[] }
export interface Mentoring { mentor: string; pupil: string; since: number }

const firstTeam = (s: GameState) => squadOf(s, s.userClubId).filter((p) => p.squad === 'First team');

/** Influence in the dressing room: leadership, age, years at the club, quality and the armband. */
export function influence(s: GameState, p: Player) {
  const years = Math.max(0, s.year - (p.joined ?? s.year));
  return (p.attributes.Leadership ?? 10) * 2 + Math.min(12, Math.max(0, p.age - 18)) + Math.min(10, years * 2) + p.ability / 20 + (p.captain ? 10 : 0);
}

/** The user's results in the last five competitive matches (W/D/L). */
function recentForm(s: GameState) {
  const us = s.userClubId;
  return s.fixtures.filter((f) => f.result && f.comp !== 'friendly' && (f.homeId === us || f.awayId === us)).sort((a, b) => a.matchday - b.matchday).slice(-5).map((f) => {
    const [h, a] = f.result!.score, home = f.homeId === us;
    const g = home ? h : a, c = home ? a : h;
    return g > c || f.result!.winnerId === us ? 'W' : g < c || (f.result!.winnerId && f.result!.winnerId !== us) ? 'L' : 'D';
  });
}

/** Everyone's standing and mood, most influential first. */
export function squadMoods(s: GameState): Mood[] {
  const ft = firstTeam(s);
  const byInf = ft.map((p) => ({ p, inf: influence(s, p) })).sort((a, b) => b.inf - a.inf);
  const byAbility = ft.slice().sort((a, b) => b.ability - a.ability);
  const games = Math.max(1, ...ft.map((p) => p.current.apps));
  const form = recentForm(s);
  const wins = form.filter((x) => x === 'W').length, losses = form.filter((x) => x === 'L').length;
  return byInf.map(({ p, inf }, i) => {
    const tier: Tier = i < 3 ? 'Team leader' : i < 7 ? 'Highly influential' : i < 13 ? 'Influential' : 'Other';
    const reasons: string[] = [];
    let score = 0;
    const rank = byAbility.indexOf(p) + 1;
    // a role agreed in his contract sets what he expects; otherwise his standing in the squad does
    const expect = p.terms?.role ? ROLE_SHARE[p.terms.role] : rank <= 11 ? 0.6 : rank <= 16 ? 0.3 : 0;
    const share = p.current.apps / games;
    if (games >= 4 && expect && share < expect - 0.25) { score -= 2; reasons.push('Not playing enough'); }
    else if (games >= 4 && !expect && share >= 0.3) { score += 1; reasons.push('Enjoying his chances'); }
    if (p.brokenPromises) { score -= 1; reasons.push('Remembers a broken promise'); }
    if (p.morale === 'high') { score += 1; reasons.push('In good spirits'); } else if (p.morale === 'low') { score -= 2; reasons.push('Low morale'); }
    if (p.contractEnd <= s.year && !p.preContract) { score -= 1; reasons.push('Contract running down'); }
    if (s.transferListed.includes(p.id)) { score -= 2; reasons.push('Transfer-listed'); }
    if (p.captain) { score += 1; reasons.push('Proud to captain the side'); }
    if (form.length >= 4 && wins >= 4) { score += 1; reasons.push('Winning team'); } else if (form.length >= 4 && losses >= 3) { score -= 1; reasons.push('Poor results'); }
    if ((s.mentoring ?? []).some((m) => m.mentor === p.id || m.pupil === p.id)) { score += 1; reasons.push(s.mentoring!.some((m) => m.mentor === p.id) ? 'Values his mentoring role' : 'Learning from a mentor'); }
    const label = score >= 2 ? 'Very happy' : score === 1 ? 'Happy' : score === 0 ? 'Content' : score >= -2 ? 'Unsettled' : 'Unhappy';
    return { id: p.id, tier, influence: Math.round(inf), score, label, reasons };
  });
}

/** Dressing-room atmosphere, 0–100: happiness weighted by influence. */
export function atmosphere(s: GameState, moods = squadMoods(s)) {
  let w = 0, sum = 0;
  for (const m of moods) { const k = TIER_WEIGHT[m.tier]; w += k; sum += k * m.score; }
  return Math.max(0, Math.min(100, Math.round(50 + (w ? sum / w : 0) * 14)));
}
export const atmosphereWord = (a: number) => (a >= 75 ? 'Excellent' : a >= 60 ? 'Good' : a >= 40 ? 'Mixed' : a >= 25 ? 'Tense' : 'Toxic');
/** On the pitch: a happy dressing room plays a little better, a toxic one worse. */
export const atmosphereFactor = (a: number) => (a >= 75 ? 1.01 : a >= 60 ? 1.004 : a < 25 ? 0.98 : a < 40 ? 0.99 : 1);

export interface Group { name: string; members: string[]; mood: number }
/** Groups that form: players from the same country (three or more), the young ones and the old hands. */
export function groups(s: GameState, moods = squadMoods(s)): Group[] {
  const ft = firstTeam(s);
  const score = new Map(moods.map((m) => [m.id, m.score]));
  const out: Group[] = [];
  const add = (name: string, list: Player[]) => { if (list.length >= 3) out.push({ name, members: list.map((p) => p.id), mood: list.reduce((a, p) => a + (score.get(p.id) ?? 0), 0) / list.length }); };
  const byNation = new Map<string, Player[]>();
  for (const p of ft) { const l = byNation.get(p.nationality); if (l) l.push(p); else byNation.set(p.nationality, [p]); }
  for (const [code, list] of byNation) add(code, list);
  add('Young players', ft.filter((p) => p.age <= 21));
  add('Senior players', ft.filter((p) => p.age >= 30));
  return out.sort((a, b) => a.mood - b.mood);
}

/* ---------- mentoring ---------- */
export const MAX_MENTORING = 3;
export function canMentor(s: GameState, mentorId: string, pupilId: string): string | null {
  const m = s.players[mentorId], p = s.players[pupilId];
  const list = s.mentoring ?? [];
  if (!m || !p || m.clubId !== s.userClubId || p.clubId !== s.userClubId) return 'Both players must be at the club.';
  if (m.age < 26 || m.squad !== 'First team') return 'A mentor needs to be an experienced first-team player (26 or older).';
  if (p.age > 21) return 'Only players aged 21 or under can be mentored.';
  if (list.length >= MAX_MENTORING) return `You can run up to ${MAX_MENTORING} mentoring pairs.`;
  if (list.some((x) => x.mentor === mentorId)) return `${m.name} already mentors someone.`;
  if (list.some((x) => x.pupil === pupilId)) return `${p.name} already has a mentor.`;
  return null;
}
export function startMentoring(s: GameState, mentorId: string, pupilId: string) {
  const err = canMentor(s, mentorId, pupilId);
  if (err) return err;
  (s.mentoring ??= []).push({ mentor: mentorId, pupil: pupilId, since: s.year });
  return null;
}
export function stopMentoring(s: GameState, pupilId: string) { s.mentoring = (s.mentoring ?? []).filter((x) => x.pupil !== pupilId); }

/** Each league week: mentoring pays off, and unhappy leaders and groups spread their mood. Returns news. */
export function weeklyDynamics(s: GameState, week: number): string[] {
  const rng: Rng = createRng((s.rngState ^ (week * 0x2f6b) ^ 0x51ed27) >>> 0);
  const news: string[] = [];
  // mentoring: extra development, and character rubs off
  s.mentoring = (s.mentoring ?? []).filter((x) => s.players[x.mentor]?.clubId === s.userClubId && s.players[x.pupil]?.clubId === s.userClubId);
  for (const x of s.mentoring) {
    const m = s.players[x.mentor], p = s.players[x.pupil];
    if (rng.chance(0.25)) developStep(rng, p, 0.08, 1);
    if (m.hidden.professionalism > p.hidden.professionalism && rng.chance(0.05)) { p.hidden.professionalism++; news.push(`${p.name} is picking up ${m.name}'s professional habits.`); }
    if ((m.attributes.Determination ?? 10) > (p.attributes.Determination ?? 10) && rng.chance(0.05)) p.attributes.Determination = (p.attributes.Determination ?? 10) + 1;
    if ((m.attributes.Leadership ?? 10) >= 15 && (p.attributes.Leadership ?? 10) < (m.attributes.Leadership ?? 10) && rng.chance(0.03)) p.attributes.Leadership = (p.attributes.Leadership ?? 10) + 1;
  }
  const moods = squadMoods(s);
  const byId = new Map(moods.map((m) => [m.id, m]));
  const ft = firstTeam(s);
  const nudgeDown = (p: Player) => { if (p.morale === 'high') p.morale = 'ok'; else if (p.morale === 'ok') p.morale = 'low'; };
  // an unhappy team leader drags others down
  for (const m of moods.filter((x) => x.tier === 'Team leader' && x.score <= -2)) {
    if (!rng.chance(0.15)) continue;
    const others = ft.filter((p) => p.id !== m.id && p.morale !== 'low');
    const hit: Player[] = [];
    for (let i = 0; i < 2 && others.length; i++) hit.push(others.splice(rng.int(0, others.length - 1), 1)[0]);
    hit.forEach(nudgeDown);
    if (hit.length) news.push(`${s.players[m.id].name}'s unhappiness is spreading in the dressing room: ${hit.map((p) => p.name).join(' and ')} are affected.`);
  }
  // an unhappy group pulls its own members down
  for (const g of groups(s, moods).filter((x) => x.mood <= -1)) {
    if (!rng.chance(0.2)) continue;
    const target = g.members.map((id) => s.players[id]).find((p) => p && p.morale !== 'low' && (byId.get(p.id)?.score ?? 0) >= 0);
    if (target) { nudgeDown(target); news.push(`The ${groupLabel(g.name)} are unsettled, and ${target.name} has been drawn in.`); }
  }
  return news;
}

export const groupLabel = (name: string) => (name.length === 3 ? `${nationName(name)} players` : name.toLowerCase());
