/* The assistant's opposition report: the opponent's likely eleven, form, danger men and absentees, where the
   game will be won or lost unit by unit, and a suggested formation (lining up in it gives a small edge). */
import { squadOf } from './index';
import { pickLineup, ROLE, slotsOf, type Formation } from './match';
import { matchOdds } from './preview';
import type { Fixture, GameState, Player } from './types';

export type Unit = 'def' | 'mid' | 'att';
export interface OppReport {
  oppId: string;
  form: Array<'W' | 'D' | 'L'>;
  xi: Array<{ slot: string; id: string; name: string }>;
  danger: Array<{ id: string; name: string; why: string }>;
  missing: string[];
  /** Our unit minus the unit it faces (positive: our edge). */
  edges: { attack: number; midfield: number; defence: number };
  advice: string[];
  suggested: Formation;
  odds: { win: number; draw: number; loss: number };
  meetings: string[];
}

const UNITS: Record<string, Unit> = { def: 'def', gk: 'def', mid: 'mid', att: 'att' };

function unitAverages(players: Array<{ slot: string; p: Player }>) {
  const acc: Record<Unit, number[]> = { def: [], mid: [], att: [] };
  for (const { slot, p } of players) acc[UNITS[ROLE[slot] ?? 'mid']].push(p.ability);
  const avg = (l: number[]) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 80);
  return { def: avg(acc.def), mid: avg(acc.mid), att: avg(acc.att) };
}

const avgRating = (p: Player) => (p.current.apps ? p.current.ratingSum / p.current.apps : 0);

export function oppositionReport(s: GameState, f: Fixture): OppReport | undefined {
  const us = s.userClubId;
  if (f.homeId !== us && f.awayId !== us) return undefined;
  const oppId = f.homeId === us ? f.awayId : f.homeId;
  const squad = squadOf(s, oppId);
  const slots = slotsOf('4-3-3');
  const xiIds = pickLineup(squad);
  const xi = xiIds.map((id, i) => ({ slot: slots[i], p: s.players[id] })).filter((x) => x.p);
  const ourSlots = slotsOf(s.formation);
  const ours = s.lineup.map((id, i) => ({ slot: ourSlots[i], p: s.players[id] })).filter((x) => x.p && x.slot);
  const them = unitAverages(xi), we = unitAverages(ours);
  const edges = { attack: Math.round(we.att - them.def), midfield: Math.round(we.mid - them.mid), defence: Math.round(we.def - them.att) };

  const played = s.fixtures.filter((x) => x.result && x.comp !== 'friendly' && (x.homeId === oppId || x.awayId === oppId)).sort((a, b) => a.matchday - b.matchday);
  const form = played.slice(-5).map((x) => {
    const home = x.homeId === oppId, [h, a] = x.result!.score;
    const g = home ? h : a, c = home ? a : h;
    return (g > c || x.result!.winnerId === oppId ? 'W' : g < c || (x.result!.winnerId && x.result!.winnerId !== oppId) ? 'L' : 'D') as 'W' | 'D' | 'L';
  });

  const first = squad.filter((p) => p.squad === 'First team');
  const danger: OppReport['danger'] = [];
  const scorer = first.filter((p) => p.current.goals >= 2).sort((a, b) => b.current.goals - a.current.goals)[0];
  if (scorer) danger.push({ id: scorer.id, name: scorer.name, why: `${scorer.current.goals} goals this season` });
  const inForm = first.filter((p) => p.current.apps >= 3 && p.id !== scorer?.id).sort((a, b) => avgRating(b) - avgRating(a))[0];
  if (inForm && avgRating(inForm) >= 6.9) danger.push({ id: inForm.id, name: inForm.name, why: `averaging ${avgRating(inForm).toFixed(2)}` });
  const star = first.slice().sort((a, b) => b.value - a.value).find((p) => !danger.some((d) => d.id === p.id));
  if (star && danger.length < 3) danger.push({ id: star.id, name: star.name, why: 'their most valuable player' });
  const key = first.slice().sort((a, b) => b.value - a.value).slice(0, 14);
  const missing = key.filter((p) => p.injuredFor > 0 || p.suspendedFor > 0).map((p) => `${p.name} (${p.injuredFor > 0 ? 'injured' : 'suspended'})`);

  // the plan: press the biggest edge, or protect against the biggest danger
  const advice: string[] = [];
  let suggested: Formation = s.formation;
  const worst = Math.min(edges.attack, edges.midfield, edges.defence);
  if (edges.defence <= -8 && edges.defence === worst) {
    suggested = '4-2-3-1';
    advice.push('Their forwards are better than our back line. Two holding midfielders in a 4-2-3-1 would give the defence cover.');
  } else if (edges.attack >= edges.midfield && edges.attack >= 4) {
    suggested = edges.attack >= 12 ? '4-4-2' : '4-3-3';
    advice.push(`Their defence is the weak link. Get the ball forward early; ${suggested === '4-4-2' ? 'two strikers in a 4-4-2' : 'a front three in a 4-3-3'} will test them.`);
  } else if (edges.midfield >= 4) {
    suggested = '3-5-2';
    advice.push('We should win the midfield. A five-man midfield in a 3-5-2 presses that advantage.');
  } else if (worst <= -6) {
    suggested = '4-2-3-1';
    advice.push('They are stronger than us across the pitch. Stay compact in a 4-2-3-1 and make the most of our chances.');
  } else advice.push('Evenly matched. Stick with what works; the details will decide it.');
  if (danger[0]) advice.push(`Keep a close eye on ${danger[0].name} (${danger[0].why}).`);
  if (missing.length) advice.push(`They will miss ${missing.slice(0, 3).join(', ')}.`);
  if (form.length >= 3 && form.slice(-3).every((r) => r === 'L')) advice.push('They have lost their last three: get at them early.');
  if (form.length >= 3 && form.slice(-3).every((r) => r === 'W')) advice.push('They have won their last three and will be confident.');

  const home = f.homeId === us;
  const o = matchOdds(s, f.homeId, f.awayId, f.neutral);
  const meetings = s.fixtures.filter((x) => x.result && x.comp !== 'friendly' && ((x.homeId === us && x.awayId === oppId) || (x.homeId === oppId && x.awayId === us)))
    .map((x) => `${s.clubs[x.homeId].short} ${x.result!.score[0]}–${x.result!.score[1]} ${s.clubs[x.awayId].short} (${s.comps[x.comp]?.short ?? ''})`);
  return {
    oppId, form, xi: xi.map(({ slot, p }) => ({ slot, id: p.id, name: p.name })), danger, missing, edges, advice, suggested,
    odds: { win: home ? o.home : o.away, draw: o.draw, loss: home ? o.away : o.home }, meetings,
  };
}

/** Lining up in the suggested formation: a small edge from following the plan. */
export function planBoost(s: GameState, f: Fixture) {
  const r = oppositionReport(s, f);
  return r && r.suggested === s.formation ? 1.015 : 1;
}
