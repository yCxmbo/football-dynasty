/* A quick read of a tactic, as an assistant would give it: how the side is balanced between defence, midfield
   and attack, how well the players suit their roles, and what stands out (good or worrying). */
import { slotsOf, type Formation } from './match';
import { fixRoles, ROLE_BY_ID, roleStars, slotShape, type SlotRole } from './roles';
import type { Instructions } from './instructions';
import type { Player } from './types';

export interface TacticReview {
  /** Share of the side's work in defence, midfield and attack, in % (sums to 100, goalkeeper left out). */
  balance: { def: number; mid: number; att: number };
  /** Average role suitability, 0–5 stars. */
  fit: number;
  /** Players badly suited to their role (under 2.5 stars). */
  misfits: Array<{ slot: string; name: string; role: string; stars: number }>;
  good: string[];
  warn: string[];
}

export function reviewTactic(f: Formation, roles: SlotRole[] | undefined, xi: Array<Pick<Player, 'name' | 'attributes'> | undefined>, instr?: Partial<Instructions>): TacticReview {
  const slots = slotsOf(f);
  const rs = fixRoles(f, roles);
  let d = 0, m = 0, a = 0, stars = 0, n = 0;
  const misfits: TacticReview['misfits'] = [];
  rs.forEach((r, i) => {
    if (slots[i] === 'GK') return;
    const [x, y, z] = slotShape(r).w;
    d += x; m += y; a += z;
    const p = xi[i];
    if (p) {
      const st = roleStars(p, r.role);
      stars += st; n++;
      if (st < 2.5) misfits.push({ slot: slots[i], name: p.name, role: ROLE_BY_ID[r.role]?.name ?? r.role, stars: st });
    }
  });
  const tot = d + m + a || 1;
  const balance = { def: Math.round((d / tot) * 100), mid: Math.round((m / tot) * 100), att: 0 };
  balance.att = 100 - balance.def - balance.mid;
  const ids = rs.map((r) => r.role);
  const count = (...xs: string[]) => ids.filter((x) => xs.includes(x)).length;
  const attackDuty = rs.filter((r, i) => slots[i] !== 'GK' && r.duty === 'A').length;
  const good: string[] = [], warn: string[] = [];
  const creators = count('dlp', 'reg', 'ap', 'rpm', 'eng', 'treq', 'wp', 'f9', 'lib');
  const screens = count('dm', 'anc', 'hb', 'bwm', 'dlp', 'car');
  const freeRoles = count('reg', 'eng', 'treq', 'lib');
  if (creators >= 1 && creators <= 2) good.push(`${creators === 1 ? 'A clear playmaker' : 'Two playmakers'} to make things happen.`);
  if (creators === 0) warn.push('No one in a creative role: chances may dry up against a deep block.');
  if (creators >= 3) warn.push('Three or more playmakers: they may get in each other\'s way.');
  if (count('dm', 'anc', 'hb', 'bwm') >= 1) good.push('A defensive midfielder screens the back line.');
  else if (screens === 0 && balance.def < 40) warn.push('Nobody sits in front of the defence: counters may go straight through.');
  if (freeRoles >= 2) warn.push('Several players with little defensive work: the side may be soft without the ball.');
  if (attackDuty >= 5) warn.push(`${attackDuty} players on an attack duty: dangerous, but exposed on the break.`);
  else if (attackDuty <= 1) warn.push('Only one player on an attack duty: few bodies in the box.');
  else good.push(`${attackDuty} players on an attack duty: a sensible mix of runners and support.`);
  const fbsUp = rs.filter((r, i) => ['LB', 'RB', 'LWB', 'RWB'].includes(slots[i]) && (r.duty === 'A' || r.role === 'cwb')).length;
  if (fbsUp >= 2 && (instr?.line === 'high' || instr?.mentality?.includes('attacking'))) warn.push('Both full-backs bomb on with an attacking approach: the centre-backs will be isolated.');
  else if (fbsUp >= 1) good.push('Width from overlapping full-backs.');
  if (count('stp') && count('cov')) good.push('A stopper and a cover defender complement each other.');
  if (count('stp') >= 2) warn.push('Two stoppers stepping out: space behind them.');
  const targets = count('tf', 'wtf');
  if (targets && instr?.passing === 'short') warn.push('A target man with short passing: he will rarely get the ball he wants.');
  if (targets && (instr?.passing === 'direct')) good.push('A target man to aim the direct balls at.');
  if (count('p') >= 2) warn.push('Two poachers: nobody links play up front.');
  if (balance.att >= 45) warn.push('A very attacking balance: expect to concede.');
  if (balance.def >= 50) warn.push('A very defensive balance: few chances will be made.');
  const fit = n ? Math.round((stars / n) * 2) / 2 : 0;
  if (fit >= 4) good.push('Players are well suited to their roles.');
  if (misfits.length) warn.push(`${misfits.length} ${misfits.length === 1 ? 'player is' : 'players are'} poorly suited to ${misfits.length === 1 ? 'his role' : 'their roles'}: try Pick best roles.`);
  return { balance, fit, misfits, good, warn };
}
