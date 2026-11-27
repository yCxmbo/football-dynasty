/* Player roles and duties. A role says what a player does in his slot: how much he adds to the defence, the
   midfield and the attack, how often he gets into scoring positions, and which attributes the job needs (his
   suitability, shown as stars, is a small factor on his performance). The duty (defend, support, attack)
   pushes him back or forward. */
import type { Formation } from './match';
import { slotsOf } from './match';
import type { Player } from './types';

export type Duty = 'D' | 'S' | 'A';
export const DUTY_NAME: Record<Duty, string> = { D: 'Defend', S: 'Support', A: 'Attack' };

export interface RoleDef {
  id: string; name: string; short: string;
  /** Slot positions the role can be played in. */
  slots: string[];
  duties: Duty[];
  /** Attributes the role needs most. */
  keys: string[];
  /** Share of his game in defence, midfield and attack. */
  w: [number, number, number];
  /** How often he gets into scoring positions. */
  scorer: number;
  /** Small boosts (or costs) to a unit while he plays the role well. */
  bonus?: { def?: number; mid?: number; att?: number };
  special?: 'sweeper' | 'target' | 'presser';
  desc: string;
}

const GK = ['GK'], CB = ['CB'], FB = ['LB', 'RB'], WB = ['LWB', 'RWB'], DM = ['DM'], CM = ['CM'], AM = ['AM'], WM = ['LM', 'RM'], WF = ['LW', 'RW'], ST = ['ST'];

export const ROLES: RoleDef[] = [
  { id: 'gk', name: 'Goalkeeper', short: 'GK', slots: GK, duties: ['D'], keys: ['Reflexes', 'Handling', 'One on Ones', 'Positioning', 'Aerial Reach'], w: [1, 0, 0], scorer: 0, desc: 'Stays on his line and keeps the ball out.' },
  { id: 'sk', name: 'Sweeper keeper', short: 'SK', slots: GK, duties: ['D', 'S'], keys: ['Reflexes', 'Rushing Out', 'One on Ones', 'Passing', 'Composure', 'Acceleration'], w: [1, 0, 0], scorer: 0, special: 'sweeper', desc: 'Comes off his line to sweep up behind a high defence and starts attacks.' },
  { id: 'cd', name: 'Central defender', short: 'CD', slots: CB, duties: ['D', 'S'], keys: ['Marking', 'Tackling', 'Heading', 'Positioning', 'Strength', 'Jumping Reach'], w: [1, 0, 0], scorer: 0.6, desc: 'Defends the box and wins headers.' },
  { id: 'bpd', name: 'Ball-playing defender', short: 'BPD', slots: CB, duties: ['D', 'S'], keys: ['Passing', 'Composure', 'Vision', 'Marking', 'Tackling', 'Positioning'], w: [0.9, 0.1, 0], scorer: 0.5, bonus: { mid: 0.008 }, desc: 'Defends, then plays forward passes to start attacks.' },
  { id: 'nnd', name: 'No-nonsense defender', short: 'NND', slots: CB, duties: ['D'], keys: ['Tackling', 'Heading', 'Strength', 'Bravery', 'Marking', 'Jumping Reach'], w: [1, 0, 0], scorer: 0.6, bonus: { def: 0.008, mid: -0.004 }, desc: 'Clears his lines without fuss: solid but adds nothing going forward.' },
  { id: 'wcb', name: 'Wide centre-back', short: 'WCB', slots: CB, duties: ['D', 'S', 'A'], keys: ['Tackling', 'Marking', 'Pace', 'Passing', 'Dribbling', 'Crossing'], w: [0.85, 0.1, 0.05], scorer: 0.6, desc: 'In a back three: steps out wide and supports the wing-back.' },
  { id: 'fb', name: 'Full-back', short: 'FB', slots: FB, duties: ['D', 'S', 'A'], keys: ['Tackling', 'Marking', 'Positioning', 'Pace', 'Crossing', 'Work Rate'], w: [0.85, 0.05, 0.1], scorer: 0.5, desc: 'Defends his flank and overlaps when it is on.' },
  { id: 'wb', name: 'Wing-back', short: 'WB', slots: [...FB, ...WB], duties: ['D', 'S', 'A'], keys: ['Crossing', 'Pace', 'Stamina', 'Dribbling', 'Work Rate', 'Tackling'], w: [0.65, 0.1, 0.25], scorer: 0.6, desc: 'Covers the whole flank, providing width in attack.' },
  { id: 'ifb', name: 'Inverted full-back', short: 'IFB', slots: FB, duties: ['D'], keys: ['Passing', 'Positioning', 'Tackling', 'Composure', 'Decisions'], w: [0.75, 0.25, 0], scorer: 0.3, bonus: { mid: 0.006 }, desc: 'Tucks inside to make an extra midfielder in possession.' },
  { id: 'cwb', name: 'Complete wing-back', short: 'CWB', slots: WB, duties: ['S', 'A'], keys: ['Crossing', 'Dribbling', 'Pace', 'Stamina', 'Flair', 'Work Rate'], w: [0.5, 0.1, 0.4], scorer: 0.8, desc: 'Lives in the final third: a winger in a defender\'s shirt.' },
  { id: 'iwb', name: 'Inverted wing-back', short: 'IWB', slots: [...FB, ...WB], duties: ['D', 'S', 'A'], keys: ['Passing', 'Vision', 'Composure', 'Decisions', 'Dribbling'], w: [0.55, 0.35, 0.1], scorer: 0.6, bonus: { mid: 0.008 }, desc: 'Moves into midfield to help keep the ball.' },
  { id: 'dm', name: 'Defensive midfielder', short: 'DM', slots: [...DM, ...CM], duties: ['D', 'S'], keys: ['Tackling', 'Positioning', 'Anticipation', 'Marking', 'Teamwork'], w: [0.3, 0.7, 0], scorer: 0.6, desc: 'Screens the defence and breaks up play.' },
  { id: 'anc', name: 'Anchor', short: 'A', slots: DM, duties: ['D'], keys: ['Positioning', 'Marking', 'Concentration', 'Tackling', 'Decisions'], w: [0.45, 0.55, 0], scorer: 0.4, bonus: { def: 0.008 }, desc: 'Sits in front of the back four and never leaves.' },
  { id: 'hb', name: 'Half-back', short: 'HB', slots: DM, duties: ['D'], keys: ['Positioning', 'Marking', 'Passing', 'Tackling', 'Composure'], w: [0.5, 0.5, 0], scorer: 0.4, bonus: { def: 0.005, mid: 0.004 }, desc: 'Drops between the centre-backs to build from the back.' },
  { id: 'dlp', name: 'Deep-lying playmaker', short: 'DLP', slots: [...DM, ...CM], duties: ['D', 'S'], keys: ['Passing', 'Vision', 'Composure', 'Decisions', 'First Touch', 'Technique'], w: [0.15, 0.85, 0], scorer: 0.6, bonus: { mid: 0.014 }, desc: 'Dictates play from deep with his range of passing.' },
  { id: 'reg', name: 'Regista', short: 'REG', slots: DM, duties: ['S'], keys: ['Passing', 'Vision', 'Flair', 'Technique', 'Decisions', 'Long Shots'], w: [0.05, 0.85, 0.1], scorer: 0.8, bonus: { mid: 0.018, def: -0.006 }, desc: 'A free creative role from deep; little defensive work.' },
  { id: 'bwm', name: 'Ball-winning midfielder', short: 'BWM', slots: [...DM, ...CM], duties: ['D', 'S'], keys: ['Tackling', 'Aggression', 'Work Rate', 'Stamina', 'Anticipation'], w: [0.35, 0.65, 0], scorer: 0.6, bonus: { def: 0.006 }, desc: 'Harries opponents and wins the ball back.' },
  { id: 'cm', name: 'Central midfielder', short: 'CM', slots: CM, duties: ['D', 'S', 'A'], keys: ['Passing', 'Decisions', 'Teamwork', 'Tackling', 'First Touch', 'Work Rate'], w: [0.1, 0.85, 0.05], scorer: 1.2, desc: 'Does a bit of everything in the middle.' },
  { id: 'b2b', name: 'Box-to-box midfielder', short: 'BBM', slots: CM, duties: ['S'], keys: ['Stamina', 'Work Rate', 'Passing', 'Tackling', 'Off the Ball', 'Finishing'], w: [0.15, 0.65, 0.2], scorer: 1.5, desc: 'Gets up and down: tackles in his own box, arrives late in theirs.' },
  { id: 'car', name: 'Carrilero', short: 'CAR', slots: CM, duties: ['S'], keys: ['Passing', 'Positioning', 'Teamwork', 'Work Rate', 'Stamina'], w: [0.2, 0.8, 0], scorer: 0.8, bonus: { def: 0.004 }, desc: 'Shuttles sideways to cover the flank in a narrow shape.' },
  { id: 'mez', name: 'Mezzala', short: 'MEZ', slots: CM, duties: ['S', 'A'], keys: ['Dribbling', 'Off the Ball', 'Passing', 'Technique', 'Vision'], w: [0, 0.6, 0.4], scorer: 1.8, desc: 'Drifts into the half-space to create and score.' },
  { id: 'ap', name: 'Advanced playmaker', short: 'AP', slots: [...CM, ...AM], duties: ['S', 'A'], keys: ['Passing', 'Vision', 'Technique', 'First Touch', 'Decisions', 'Flair'], w: [0, 0.8, 0.2], scorer: 1.6, bonus: { mid: 0.014 }, desc: 'Finds pockets of space to unlock the defence.' },
  { id: 'am', name: 'Attacking midfielder', short: 'AM', slots: AM, duties: ['S', 'A'], keys: ['Passing', 'Vision', 'Technique', 'Off the Ball', 'Long Shots'], w: [0, 0.6, 0.4], scorer: 2.2, desc: 'Links midfield and attack, shoots from range.' },
  { id: 'ss', name: 'Shadow striker', short: 'SS', slots: AM, duties: ['A'], keys: ['Off the Ball', 'Finishing', 'Composure', 'Anticipation', 'Acceleration'], w: [0, 0.3, 0.7], scorer: 3.2, desc: 'Runs beyond the striker into the box.' },
  { id: 'wm', name: 'Wide midfielder', short: 'WM', slots: WM, duties: ['D', 'S', 'A'], keys: ['Crossing', 'Work Rate', 'Passing', 'Tackling', 'Stamina', 'Teamwork'], w: [0.1, 0.4, 0.5], scorer: 1.6, desc: 'Works the flank both ways.' },
  { id: 'dw', name: 'Defensive winger', short: 'DW', slots: [...WM, ...WF], duties: ['D', 'S'], keys: ['Work Rate', 'Tackling', 'Crossing', 'Stamina', 'Positioning'], w: [0.25, 0.35, 0.4], scorer: 1.2, bonus: { def: 0.004 }, desc: 'Helps his full-back first, attacks second.' },
  { id: 'w', name: 'Winger', short: 'W', slots: [...WM, ...WF], duties: ['S', 'A'], keys: ['Crossing', 'Dribbling', 'Pace', 'Acceleration', 'Technique'], w: [0, 0.2, 0.8], scorer: 2.2, desc: 'Hugs the touchline, beats his man and crosses.' },
  { id: 'wp', name: 'Wide playmaker', short: 'WP', slots: [...WM, ...WF], duties: ['S', 'A'], keys: ['Passing', 'Vision', 'Technique', 'First Touch', 'Dribbling'], w: [0, 0.5, 0.5], scorer: 1.6, bonus: { mid: 0.01 }, desc: 'Starts wide, comes inside to create.' },
  { id: 'iw', name: 'Inverted winger', short: 'IW', slots: [...WM, ...WF], duties: ['S', 'A'], keys: ['Dribbling', 'Passing', 'Technique', 'Long Shots', 'Vision'], w: [0, 0.35, 0.65], scorer: 2.4, desc: 'Cuts inside onto his stronger foot to shoot or pass.' },
  { id: 'if', name: 'Inside forward', short: 'IF', slots: WF, duties: ['S', 'A'], keys: ['Finishing', 'Dribbling', 'Off the Ball', 'Acceleration', 'Composure'], w: [0, 0.1, 0.9], scorer: 3.3, desc: 'Attacks the box from the flank like a second striker.' },
  { id: 'af', name: 'Advanced forward', short: 'AF', slots: ST, duties: ['A'], keys: ['Finishing', 'Off the Ball', 'Pace', 'Acceleration', 'Composure', 'Dribbling'], w: [0, 0, 1], scorer: 4.2, desc: 'Plays on the shoulder of the last defender.' },
  { id: 'p', name: 'Poacher', short: 'P', slots: ST, duties: ['A'], keys: ['Finishing', 'Off the Ball', 'Anticipation', 'Composure', 'Acceleration'], w: [0, 0, 1], scorer: 5.2, bonus: { mid: -0.005 }, desc: 'Lives in the box for the final touch; little else.' },
  { id: 'tf', name: 'Target forward', short: 'TF', slots: ST, duties: ['S', 'A'], keys: ['Heading', 'Strength', 'Jumping Reach', 'Bravery', 'Finishing'], w: [0, 0.1, 0.9], scorer: 3.6, special: 'target', desc: 'Wins the ball in the air and holds it up; feeds on crosses.' },
  { id: 'f9', name: 'False nine', short: 'F9', slots: ST, duties: ['S'], keys: ['Passing', 'Vision', 'Technique', 'First Touch', 'Off the Ball', 'Dribbling'], w: [0, 0.35, 0.65], scorer: 2.8, bonus: { mid: 0.014 }, desc: 'Drops deep to drag centre-backs out and create.' },
  { id: 'dlf', name: 'Deep-lying forward', short: 'DLF', slots: ST, duties: ['S', 'A'], keys: ['Passing', 'First Touch', 'Technique', 'Strength', 'Off the Ball'], w: [0, 0.25, 0.75], scorer: 3.4, bonus: { mid: 0.006 }, desc: 'Comes short to link play, then gets into the box.' },
  { id: 'pf', name: 'Pressing forward', short: 'PF', slots: ST, duties: ['D', 'S', 'A'], keys: ['Work Rate', 'Stamina', 'Aggression', 'Acceleration', 'Finishing'], w: [0.05, 0.1, 0.85], scorer: 3.6, special: 'presser', desc: 'Defends from the front, hunting the centre-backs.' },
  { id: 'cf', name: 'Complete forward', short: 'CF', slots: ST, duties: ['S', 'A'], keys: ['Finishing', 'Heading', 'Passing', 'Dribbling', 'Strength', 'First Touch', 'Technique'], w: [0, 0.15, 0.85], scorer: 4, desc: 'Does everything a striker can: scores, creates, holds up.' },
  { id: 'lib', name: 'Libero', short: 'LIB', slots: CB, duties: ['D', 'S'], keys: ['Passing', 'Vision', 'Composure', 'Dribbling', 'Anticipation', 'Positioning'], w: [0.75, 0.2, 0.05], scorer: 0.6, bonus: { mid: 0.01, def: -0.004 }, desc: 'Sweeps behind the line, then steps into midfield with the ball.' },
  { id: 'stp', name: 'Stopper', short: 'STP', slots: CB, duties: ['D'], keys: ['Tackling', 'Aggression', 'Bravery', 'Anticipation', 'Strength'], w: [1, 0, 0], scorer: 0.5, bonus: { def: 0.005 }, desc: 'Steps out to meet the striker before he can turn. Strong in a pair with a cover defender.' },
  { id: 'cov', name: 'Cover defender', short: 'COV', slots: CB, duties: ['D'], keys: ['Positioning', 'Anticipation', 'Pace', 'Concentration', 'Marking'], w: [1, 0, 0], scorer: 0.4, bonus: { def: 0.005 }, desc: 'Drops off to cover space behind his partner and the full-backs.' },
  { id: 'nnfb', name: 'No-nonsense full-back', short: 'NFB', slots: FB, duties: ['D'], keys: ['Tackling', 'Marking', 'Positioning', 'Strength', 'Bravery'], w: [1, 0, 0], scorer: 0.3, bonus: { def: 0.006, att: -0.004 }, desc: 'Stays at home and defends; rarely crosses the halfway line.' },
  { id: 'sv', name: 'Segundo volante', short: 'SV', slots: DM, duties: ['S', 'A'], keys: ['Off the Ball', 'Stamina', 'Work Rate', 'Long Shots', 'Finishing', 'Tackling'], w: [0.2, 0.55, 0.25], scorer: 1.8, desc: 'Starts in front of the defence and bursts forward to arrive in the box.' },
  { id: 'rpm', name: 'Roaming playmaker', short: 'RPM', slots: [...DM, ...CM], duties: ['S'], keys: ['Passing', 'Vision', 'Stamina', 'Work Rate', 'Off the Ball', 'Dribbling'], w: [0.1, 0.75, 0.15], scorer: 1.2, bonus: { mid: 0.012, def: -0.003 }, desc: 'Roams all over the pitch to find the ball and play the pass.' },
  { id: 'eng', name: 'Enganche', short: 'ENG', slots: AM, duties: ['S'], keys: ['Vision', 'Passing', 'Technique', 'First Touch', 'Composure', 'Decisions'], w: [0, 0.8, 0.2], scorer: 1.4, bonus: { mid: 0.016, def: -0.004 }, desc: 'The classic ten: stands still, gets the ball, and plays everyone in. Does not press.' },
  { id: 'treq', name: 'Trequartista', short: 'TRQ', slots: [...AM, ...ST], duties: ['A'], keys: ['Flair', 'Vision', 'Technique', 'Dribbling', 'Passing', 'Finishing'], w: [0, 0.4, 0.6], scorer: 2.8, bonus: { mid: 0.008, att: 0.006, def: -0.006 }, desc: 'A free role between the lines: brilliant with the ball, no defending at all.' },
  { id: 'wtf', name: 'Wide target forward', short: 'WTF', slots: [...WM, ...WF], duties: ['S', 'A'], keys: ['Heading', 'Strength', 'Jumping Reach', 'Bravery', 'Finishing'], w: [0.05, 0.15, 0.8], scorer: 2.6, special: 'target', desc: 'A big man on the flank: wins the long ball against a smaller full-back.' },
  { id: 'chf', name: 'Channel forward', short: 'CHF', slots: ST, duties: ['S', 'A'], keys: ['Pace', 'Off the Ball', 'Work Rate', 'Dribbling', 'Crossing', 'Finishing'], w: [0, 0.15, 0.85], scorer: 3.2, desc: 'Runs into the channels between full-back and centre-back to stretch the line.' },
];
export const ROLE_BY_ID: Record<string, RoleDef> = Object.fromEntries(ROLES.map((r) => [r.id, r]));

/** Individual instructions on top of a role. Whether they help depends on the player's attributes. */
export interface PlayerInstr { shoot?: 'less' | 'more'; dribble?: 'less' | 'more'; pass?: 'safer' | 'riskier'; move?: 'hold' | 'forward'; press?: 'less' | 'more'; tackle?: 'harder' }
export interface SlotRole { role: string; duty: Duty; pi?: PlayerInstr }

export const PLAYER_INSTR: Array<{ key: keyof PlayerInstr; label: string; options: Array<{ value: string; label: string }>; attr: string[]; desc: string }> = [
  { key: 'shoot', label: 'Shooting', options: [{ value: 'less', label: 'Less often' }, { value: 'more', label: 'More often' }], attr: ['Long Shots', 'Finishing'], desc: 'More shots from him: worth it with good Long Shots and Finishing, wasteful without.' },
  { key: 'dribble', label: 'Dribbling', options: [{ value: 'less', label: 'Less' }, { value: 'more', label: 'More' }], attr: ['Dribbling', 'Flair'], desc: 'Run at defenders: dangerous with good Dribbling, gives the ball away without. Less keeps possession.' },
  { key: 'pass', label: 'Passing', options: [{ value: 'safer', label: 'Safer' }, { value: 'riskier', label: 'Riskier' }], attr: ['Vision', 'Passing'], desc: 'Riskier passes create more with good Vision and Passing; safer passes keep the ball.' },
  { key: 'move', label: 'Movement', options: [{ value: 'hold', label: 'Hold position' }, { value: 'forward', label: 'Get forward' }], attr: ['Off the Ball', 'Stamina'], desc: 'Shifts him towards defence or attack beyond his duty.' },
  { key: 'press', label: 'Pressing', options: [{ value: 'less', label: 'Less' }, { value: 'more', label: 'More' }], attr: ['Work Rate', 'Stamina'], desc: 'More pressing unsettles their midfield but tires him faster (Work Rate and Stamina help).' },
  { key: 'tackle', label: 'Tackling', options: [{ value: 'harder', label: 'Tackle harder' }], attr: ['Tackling', 'Aggression'], desc: 'Wins more ball with good Tackling; more fouls and cards.' },
];

const DEFAULT_ROLE: Record<string, SlotRole> = {
  GK: { role: 'gk', duty: 'D' }, CB: { role: 'cd', duty: 'D' }, LB: { role: 'fb', duty: 'S' }, RB: { role: 'fb', duty: 'S' },
  LWB: { role: 'wb', duty: 'S' }, RWB: { role: 'wb', duty: 'S' }, DM: { role: 'dm', duty: 'D' }, CM: { role: 'cm', duty: 'S' },
  AM: { role: 'am', duty: 'A' }, LM: { role: 'wm', duty: 'S' }, RM: { role: 'wm', duty: 'S' }, LW: { role: 'w', duty: 'A' }, RW: { role: 'w', duty: 'A' }, ST: { role: 'af', duty: 'A' },
};
export const defaultRoles = (f: Formation): SlotRole[] => slotsOf(f).map((s) => ({ ...DEFAULT_ROLE[s] }));
export const rolesFor = (slot: string) => ROLES.filter((r) => r.slots.includes(slot));

/** Keeps saved roles valid for a formation: a role that can't be played in a slot falls back to the default. */
export function fixRoles(f: Formation, roles?: SlotRole[]): SlotRole[] {
  return slotsOf(f).map((s, i) => {
    const r = roles?.[i];
    const def = ROLE_BY_ID[r?.role ?? ''];
    if (!r || !def || !def.slots.includes(s)) return { ...DEFAULT_ROLE[s] };
    return def.duties.includes(r.duty) ? r : { role: r.role, duty: def.duties[0], ...(r.pi ? { pi: r.pi } : {}) };
  });
}

/** Suitability for a role, 0–5 stars in halves, from the role's key attributes. */
export function roleStars(p: Pick<Player, 'attributes'>, roleId: string) {
  const r = ROLE_BY_ID[roleId];
  if (!r) return 2.5;
  const avg = r.keys.reduce((a, k) => a + (p.attributes[k] ?? 10), 0) / r.keys.length;
  return Math.max(0, Math.min(5, Math.round(((avg - 5) / 2.6) * 2) / 2));
}
/** Performance factor from suitability: about −4% for a poor fit to +4% for a perfect one. */
export const roleFactor = (stars: number) => 0.96 + stars * 0.016;

/** What a slot's role and duty add to each unit (shares sum to 1), and the player's share of the goals. */
const shapeMemo = new Map<string, { w: [number, number, number]; scorer: number }>();
export function slotShape(sr: SlotRole): { w: [number, number, number]; scorer: number } {
  const key = sr.role + sr.duty + (sr.pi?.move ?? '') + (sr.pi?.shoot ?? '');
  let v = shapeMemo.get(key);
  if (!v) { v = computeShape(sr); shapeMemo.set(key, v); }
  return v;
}
function computeShape(sr: SlotRole): { w: [number, number, number]; scorer: number } {
  const r = ROLE_BY_ID[sr.role] ?? ROLE_BY_ID.cm;
  let [d, m, a] = r.w;
  const shift = 0.15;
  if (sr.duty === 'D' && r.id !== 'gk') {
    // back towards his own goal: from attack first, then midfield
    const fromA = Math.min(a, shift); a -= fromA; const fromM = Math.min(m, shift - fromA); m -= fromM; d += fromA + fromM;
  } else if (sr.duty === 'A' && r.id !== 'gk' && r.id !== 'sk') {
    const fromD = Math.min(d, shift); d -= fromD; const fromM = Math.min(m, shift - fromD); m -= fromM; a += fromD + fromM;
  }
  // individual movement: a further, smaller shift
  const step = 0.1;
  if (sr.pi?.move === 'hold' && r.id !== 'gk') { const fromA = Math.min(a, step); a -= fromA; const fromM = Math.min(m, step - fromA); m -= fromM; d += fromA + fromM; }
  else if (sr.pi?.move === 'forward' && r.id !== 'gk' && r.id !== 'sk') { const fromD = Math.min(d, step); d -= fromD; const fromM = Math.min(m, step - fromD); m -= fromM; a += fromD + fromM; }
  const scorer = r.scorer * (sr.duty === 'A' ? 1.25 : sr.duty === 'D' ? 0.7 : 1) * (sr.pi?.shoot === 'more' ? 1.3 : sr.pi?.shoot === 'less' ? 0.7 : 1);
  return { w: [d, m, a], scorer };
}

/** Roles a computer-run manager uses, by slot position (a sensible, common set). */
const AI_ROLES: Record<string, Array<[string, Duty]>> = {
  GK: [['gk', 'D'], ['sk', 'S']], CB: [['cd', 'D'], ['bpd', 'D'], ['nnd', 'D']],
  LB: [['fb', 'S'], ['wb', 'S'], ['ifb', 'D']], RB: [['fb', 'S'], ['wb', 'S'], ['ifb', 'D']],
  LWB: [['wb', 'S'], ['cwb', 'A']], RWB: [['wb', 'S'], ['cwb', 'A']],
  DM: [['dm', 'D'], ['dlp', 'S'], ['bwm', 'D'], ['anc', 'D']],
  CM: [['cm', 'S'], ['b2b', 'S'], ['dlp', 'S'], ['ap', 'S'], ['mez', 'S'], ['bwm', 'S']],
  AM: [['am', 'A'], ['ap', 'A'], ['ss', 'A']],
  LM: [['wm', 'S'], ['w', 'A'], ['iw', 'S']], RM: [['wm', 'S'], ['w', 'A'], ['iw', 'S']],
  LW: [['w', 'A'], ['if', 'A'], ['iw', 'A']], RW: [['w', 'A'], ['if', 'A'], ['iw', 'A']],
  ST: [['af', 'A'], ['p', 'A'], ['tf', 'S'], ['dlf', 'S'], ['pf', 'S'], ['cf', 'A']],
};
/** For each slot, the role (from a common set) that suits the player in it best. */
export function bestRoles(f: Formation, xi: Array<Pick<Player, 'attributes'> | undefined>): SlotRole[] {
  return slotsOf(f).map((slot, i) => {
    const p = xi[i];
    const opts = AI_ROLES[slot] ?? [[DEFAULT_ROLE[slot].role, DEFAULT_ROLE[slot].duty]];
    if (!p) return { role: opts[0][0], duty: opts[0][1] };
    let best = opts[0], bs = -1;
    for (const o of opts) { const st = roleStars(p, o[0]); if (st > bs + 0.25) { best = o; bs = st; } }
    return { role: best[0], duty: best[1] };
  });
}

/** For each slot, the best-suited role from every role that can be played there, with a sensible duty: the
    "pick best roles" button. Ties go to the more common role (earlier in the list). */
export function bestRolesAll(f: Formation, xi: Array<Pick<Player, 'attributes'> | undefined>, current?: SlotRole[]): SlotRole[] {
  return slotsOf(f).map((slot, i) => {
    const p = xi[i];
    const cur = current?.[i];
    if (!p) return cur ?? { ...DEFAULT_ROLE[slot] };
    let best = ROLE_BY_ID[DEFAULT_ROLE[slot].role], bs = -1;
    for (const r of rolesFor(slot)) { const st = roleStars(p, r.id); if (st > bs + 0.25) { best = r; bs = st; } }
    const keep = cur && cur.role === best.id && best.duties.includes(cur.duty);
    const duty = keep ? cur!.duty : best.duties.includes(DEFAULT_ROLE[slot].duty) ? DEFAULT_ROLE[slot].duty : best.duties.includes('S') ? 'S' : best.duties[0];
    return { role: best.id, duty, ...(cur?.pi ? { pi: cur.pi } : {}) };
  });
}

/** What a player's individual instructions do to each unit (multipliers), given his attributes: good at it,
    a small gain; poor at it, a small cost. */
export function instrEffect(pi: PlayerInstr | undefined, attrs: Record<string, number>): { def: number; mid: number; att: number } {
  const e = { def: 1, mid: 1, att: 1 };
  if (!pi) return e;
  const a = (k: string) => attrs[k] ?? 10;
  const skill = (...ks: string[]) => ks.reduce((x, k) => x + a(k), 0) / ks.length - 12; // above 12 helps
  if (pi.shoot === 'more') e.att *= 1 + skill('Long Shots', 'Finishing') * 0.0025;
  if (pi.dribble === 'more') e.att *= 1 + skill('Dribbling', 'Flair') * 0.0025;
  else if (pi.dribble === 'less') e.mid *= 1.003;
  if (pi.pass === 'riskier') { e.att *= 1 + skill('Vision', 'Passing') * 0.0025; e.mid *= 0.997; }
  else if (pi.pass === 'safer') { e.mid *= 1.004; e.att *= 0.996; }
  if (pi.tackle === 'harder') e.def *= 1 + skill('Tackling', 'Aggression') * 0.002;
  return e;
}
