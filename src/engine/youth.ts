/* Youth recruitment for your club. About six weeks before the season ends your head of youth presents a dozen
   candidates for next season's intake, with comments; you choose up to eight to sign (if you don't, the best four
   are signed for you at the season's turn). Youth scouting regions, up to two nations, bring better prospects
   from there, for a yearly fee. */
import { createRng } from './rng';
import { makePlayer } from './world';
import type { GameState, Player } from './types';

export const CANDIDATES = 12, MAX_SIGN = 8, AUTO_SIGN = 4, MAX_REGIONS = 2;
export interface YouthIntake { year: number; candidates: Player[]; picked: string[]; comments: string[] }
const POS = ['GK', 'CB', 'CB', 'LB', 'RB', 'DM', 'CM', 'CM', 'AM', 'LW', 'RW', 'ST', 'ST'] as const;

/** A yearly fee per region, more for a bigger club. */
export const regionFee = (s: GameState) => Math.round((60_000 + (s.clubs[s.userClubId]?.reputation ?? 50) * 3000) / 50_000) * 50_000;

/** Builds the candidates. `potentialBonus` is the club's youth bonus (facilities, staff, style). */
export function makeCandidates(s: GameState, potentialBonus: number): YouthIntake {
  const c = s.clubs[s.userClubId];
  const rng = createRng((s.seed ^ (s.year * 2654435761)) >>> 0);
  const regions = s.youthRegions ?? [];
  const candidates: Player[] = [];
  for (let i = 0; i < CANDIDATES; i++) {
    const fromRegion = regions.length > 0 && rng.chance(0.4);
    const pos = POS[rng.int(0, POS.length - 1)];
    const pa = Math.max(70, Math.min(195, Math.round(rng.normal(115 + c.reputation * 0.35 + potentialBonus + (fromRegion ? 6 : 0), 20))));
    const p = makePlayer(rng, { id: `y${s.year}-${i}`, clubId: c.id, pos, ca: rng.int(40, 70), pa, age: rng.int(15, 16), squad: 'U18', number: 0, year: s.year, reputation: c.reputation, country: c.country, ...(fromRegion ? { nationality: regions[rng.int(0, regions.length - 1)] } : {}) });
    candidates.push(p);
  }
  candidates.sort((a, b) => b.potential - a.potential);
  return { year: s.year, candidates, picked: [], comments: comment(candidates) };
}

function comment(cs: Player[]): string[] {
  const stars = cs.filter((p) => p.potential >= 165), good = cs.filter((p) => p.potential >= 145);
  const out: string[] = [];
  if (stars.length >= 2) out.push('This could be a golden generation: more than one of these lads has a real chance of making it at the top.');
  else if (good.length >= 4) out.push('A strong group, with several who could become first-team players.');
  else if (good.length <= 1) out.push('An ordinary year, I\'m afraid. One or two might make it.');
  else out.push('A decent crop, with a couple who stand out.');
  const best = cs[0];
  if (best) out.push(`One to watch: ${best.name}, ${/^[AEFHILMNORSX]/.test(best.pos) ? 'an' : 'a'} ${best.pos} who ${best.potential >= 165 ? 'could be something special' : best.potential >= 145 ? 'has the makings of a fine player' : 'is the pick of the bunch'}.`);
  const keeper = cs.find((p) => p.pos === 'GK' && p.potential >= 140);
  if (keeper && keeper !== best) out.push(`${keeper.name} is the best young goalkeeper we've seen in a while.`);
  return out;
}

/** The head of youth's verdict on a candidate (no numbers: potential stays hidden). */
export const verdict = (p: Player) => (p.potential >= 165 ? 'Exceptional prospect' : p.potential >= 145 ? 'Very promising' : p.potential >= 125 ? 'Promising' : p.potential >= 105 ? 'Decent' : 'Long shot');

export function togglePick(s: GameState, id: string): string | null {
  const y = s.youth;
  if (!y || y.year !== s.year) return 'No intake to choose from yet.';
  if (y.picked.includes(id)) { y.picked = y.picked.filter((x) => x !== id); return null; }
  if (y.picked.length >= MAX_SIGN) return `You can sign ${MAX_SIGN} at most.`;
  y.picked.push(id);
  return null;
}

/** At the season's turn: the chosen (or the best four) join the U18s. Returns those who joined. */
export function signIntake(s: GameState, place: (p: Player) => void): Player[] {
  const y = s.youth;
  if (!y) return [];
  const chosen = y.picked.length ? y.candidates.filter((p) => y.picked.includes(p.id)) : y.candidates.slice(0, AUTO_SIGN);
  for (const p of chosen) place(p);
  delete s.youth;
  return chosen;
}

export function setRegions(s: GameState, regions: string[]) { s.youthRegions = [...new Set(regions)].slice(0, MAX_REGIONS); }
