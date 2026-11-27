/* Tactics: three saved tactics (formation, roles and duties, instructions), style presets to start from, and
   familiarity. A squad needs time to learn a shape and a way of playing: a new formation or a big change of
   instructions costs a little on the pitch until it has been played a few times. */
import { DEFAULT_INSTRUCTIONS, withDefaults, type Instructions } from './instructions';
import { slotsOf, type Formation } from './match';
import { fixRoles, type Duty, type SlotRole } from './roles';
import type { GameState } from './types';

export interface Tactic { name: string; formation: Formation; /** A different shape without the ball (none: the same). */ defFormation?: Formation; roles: SlotRole[]; instr: Instructions; /** How well the squad knows these instructions, 0–100. */ fam: number }
export interface TacticsState { slots: Tactic[]; active: number }

export interface StylePreset { id: string; name: string; desc: string; formation: Formation; defFormation?: Formation; roles: Partial<Record<string, Array<[string, Duty]>>>; instr: Partial<Instructions> }

/** Starting points. Roles are given per slot position, in slot order. */
export const STYLE_PRESETS: StylePreset[] = [
  { id: 'press', name: 'High press', desc: 'Win the ball high and fast; counter-press the moment it is lost. Demanding on fitness.', formation: '4-3-3',
    roles: { GK: [['sk', 'S']], LB: [['wb', 'S']], RB: [['wb', 'S']], CB: [['bpd', 'D'], ['cd', 'D']], CM: [['b2b', 'S'], ['dm', 'D'], ['mez', 'A']], LW: [['if', 'A']], RW: [['if', 'A']], ST: [['pf', 'A']] },
    instr: { mentality: 'positive', passing: 'mixed', tempo: 'fast', onLoss: 'counterpress', onWin: 'counter', block: 'high', line: 'high', press: 'high', tackling: 'hard' } },
  { id: 'possession', name: 'Possession', desc: 'Keep the ball, move it patiently and work the opening; win it back quickly. Defends in a 4-1-4-1.', formation: '4-3-3 DM', defFormation: '4-1-4-1',
    roles: { GK: [['sk', 'S']], LB: [['ifb', 'D']], RB: [['wb', 'S']], CB: [['bpd', 'D'], ['bpd', 'D']], DM: [['dlp', 'D']], CM: [['ap', 'S'], ['mez', 'S']], LW: [['iw', 'S']], RW: [['w', 'A']], ST: [['f9', 'S']] },
    instr: { mentality: 'positive', passing: 'short', tempo: 'slow', width: 'normal', approach: 'middle', finalThird: 'patient', onLoss: 'counterpress', onWin: 'hold', block: 'mid', line: 'high', press: 'medium' } },
  { id: 'counter', name: 'Counter-attack', desc: 'Sit compact, invite them on and break at speed into the space they leave. Defends in a 4-4-1-1.', formation: '4-2-3-1', defFormation: '4-4-1-1',
    roles: { LB: [['fb', 'D']], RB: [['fb', 'D']], DM: [['dm', 'D'], ['dlp', 'S']], LW: [['if', 'A']], RW: [['w', 'S']], AM: [['ss', 'A']], ST: [['af', 'A']] },
    instr: { mentality: 'cautious', passing: 'direct', tempo: 'fast', onLoss: 'regroup', onWin: 'counter', block: 'low', line: 'deep', press: 'low' } },
  { id: 'wings', name: 'Wing play', desc: 'Get the ball wide, beat the full-back and cross for a big target in the box.', formation: '4-4-2',
    roles: { LB: [['wb', 'S']], RB: [['wb', 'S']], LM: [['w', 'A']], RM: [['w', 'A']], CM: [['b2b', 'S'], ['dlp', 'D']], ST: [['tf', 'S'], ['af', 'A']] },
    instr: { mentality: 'positive', passing: 'mixed', width: 'wide', approach: 'flanks', finalThird: 'mixed', block: 'mid', press: 'medium' } },
  { id: 'direct', name: 'Direct', desc: 'Go long early to a target forward, win the second balls and turn the opposition around.', formation: '4-4-1-1',
    roles: { CB: [['nnd', 'D'], ['cd', 'D']], CM: [['bwm', 'D'], ['b2b', 'S']], LM: [['wm', 'S']], RM: [['wm', 'S']], AM: [['ss', 'A']], ST: [['tf', 'S']] },
    instr: { mentality: 'balanced', passing: 'direct', tempo: 'fast', approach: 'flanks', finalThird: 'shoot', onWin: 'counter', tackling: 'hard' } },
  { id: 'block', name: 'Low block', desc: 'Defend deep in numbers, protect the box and hit them on the break.', formation: '5-4-1',
    roles: { LWB: [['wb', 'D']], RWB: [['wb', 'D']], CB: [['cd', 'D'], ['nnd', 'D'], ['cd', 'D']], CM: [['dm', 'D'], ['car', 'S']], LM: [['dw', 'S']], RM: [['dw', 'S']], ST: [['tf', 'S']] },
    instr: { mentality: 'defensive', passing: 'direct', tempo: 'normal', width: 'narrow', onLoss: 'regroup', onWin: 'counter', block: 'low', line: 'deep', press: 'low', tackling: 'normal' } },
  { id: 'balanced', name: 'Balanced', desc: 'A solid all-round setup with no extremes.', formation: '4-2-3-1',
    roles: { DM: [['dm', 'D'], ['b2b', 'S']], AM: [['am', 'S']], LW: [['iw', 'S']], RW: [['w', 'A']] },
    instr: {} },
];

/** Builds a tactic from a preset (roles filled in slot order, the rest defaults). */
export function presetTactic(p: StylePreset, name = p.name): Tactic {
  const used: Record<string, number> = {};
  const base = fixRoles(p.formation);
  const roles = slotsOf(p.formation).map((slot, i) => {
    const list = p.roles[slot];
    const n = used[slot] = (used[slot] ?? -1) + 1;
    const pick = list?.[Math.min(n, list.length - 1)];
    return pick ? { role: pick[0], duty: pick[1] } : base[i];
  });
  return { name, formation: p.formation, ...(p.defFormation ? { defFormation: p.defFormation } : {}), roles: fixRoles(p.formation, roles), instr: withDefaults(p.instr), fam: 30 };
}

const PRESET = (id: string) => STYLE_PRESETS.find((p) => p.id === id)!;

/** Your three tactics; the first starts as whatever you play now. */
export function tacticsOf(s: GameState): TacticsState {
  if (!s.tactics) {
    s.tactics = { active: 0, slots: [
      { name: 'Tactic A', formation: s.formation, roles: fixRoles(s.formation, s.roles), instr: withDefaults(s.instructions), fam: 70 },
      presetTactic(PRESET('counter'), 'Tactic B'),
      presetTactic(PRESET('press'), 'Tactic C'),
    ] };
  }
  return s.tactics;
}

/** Copies the active tactic into what is played. */
function applyActive(s: GameState) {
  const t = tacticsOf(s).slots[tacticsOf(s).active];
  s.formation = t.formation;
  s.defFormation = t.defFormation && t.defFormation !== t.formation ? t.defFormation : undefined;
  s.roles = fixRoles(t.formation, t.roles);
  s.instructions = { ...t.instr };
}

/** Saves edits to the active tactic: changed instructions cost familiarity (6 a setting). */
export function saveActive(s: GameState, change: { formation?: Formation; defFormation?: Formation | null; roles?: SlotRole[]; instr?: Partial<Instructions> }) {
  ensureFamiliarity(s);
  const ts = tacticsOf(s), t = ts.slots[ts.active];
  if (change.formation && change.formation !== t.formation) { t.formation = change.formation; t.roles = fixRoles(change.formation, t.roles); }
  if (change.defFormation !== undefined) { if (change.defFormation && change.defFormation !== t.formation) t.defFormation = change.defFormation; else delete t.defFormation; }
  if (change.roles) t.roles = fixRoles(t.formation, change.roles);
  if (change.instr) {
    const next = { ...t.instr, ...change.instr };
    const changed = (Object.keys(change.instr) as Array<keyof Instructions>).filter((k) => t.instr[k] !== next[k]).length;
    t.fam = Math.max(20, t.fam - changed * 6);
    t.instr = next;
  }
  applyActive(s);
}

/** Switches to another saved tactic. */
export function switchTactic(s: GameState, index: number) {
  ensureFamiliarity(s);
  const ts = tacticsOf(s);
  if (index < 0 || index >= ts.slots.length) return;
  ts.active = index;
  applyActive(s);
}

/** Replaces the active tactic with a style preset (keeping its name). */
export function loadPreset(s: GameState, presetId: string) {
  ensureFamiliarity(s);
  const ts = tacticsOf(s), p = PRESET(presetId);
  if (!p) return;
  ts.slots[ts.active] = presetTactic(p, ts.slots[ts.active].name);
  applyActive(s);
}

export function renameTactic(s: GameState, index: number, name: string) {
  const t = tacticsOf(s).slots[index];
  if (t && name.trim()) t.name = name.trim().slice(0, 24);
}

/* ---------- familiarity ---------- */
const FLOOR = 25;
/** The squad knows the shape it plays at the start. */
export function ensureFamiliarity(s: GameState) { s.familiarity ??= { [s.formation]: 75 }; return s.familiarity; }
export const formationFamiliarity = (s: GameState, f: Formation) => s.familiarity?.[f] ?? (f === s.formation && !s.familiarity ? 75 : FLOOR);

/** Familiarity with the tactic you play now, 0–100: mostly the shape, partly the instructions. */
export function familiarity(s: GameState) {
  const ts = tacticsOf(s);
  // with a separate shape out of possession, the squad has to know both
  const shape = s.defFormation ? (formationFamiliarity(s, s.formation) + formationFamiliarity(s, s.defFormation)) / 2 : formationFamiliarity(s, s.formation);
  return Math.round(shape * 0.7 + ts.slots[ts.active].fam * 0.3);
}
/** On the pitch: about −2.5% with a brand-new tactic, nothing once it is fully learned. */
export const familiarityFactor = (fam: number) => 0.975 + 0.025 * Math.min(100, fam) / 100;

/** After each of your matches: the shape and instructions you used sink in. */
export function learnFromMatch(s: GameState) {
  const fam = ensureFamiliarity(s);
  fam[s.formation] = Math.min(100, (fam[s.formation] ?? FLOOR) + 6);
  if (s.defFormation) fam[s.defFormation] = Math.min(100, (fam[s.defFormation] ?? FLOOR) + 6);
  const ts = tacticsOf(s);
  ts.slots[ts.active].fam = Math.min(100, ts.slots[ts.active].fam + 8);
}

/** Each league week: shapes you aren't using fade slowly. */
export function weeklyFamiliarity(s: GameState) {
  if (!s.familiarity) return;
  for (const [f, v] of Object.entries(s.familiarity)) if (f !== s.formation && f !== s.defFormation && v > FLOOR) s.familiarity[f] = Math.max(FLOOR, v - 1);
}

/** A new club: the squad doesn't know your ideas yet. */
export function resetFamiliarity(s: GameState) {
  s.familiarity = { [s.formation]: 45 };
  for (const t of tacticsOf(s).slots) t.fam = 40;
}

export { DEFAULT_INSTRUCTIONS };
