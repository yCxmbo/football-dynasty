/* Team instructions in three phases: in possession, in transition and out of possession. Each trades
   something, and many react to what the opponent does (a counter-attack punishes a high line; direct balls
   beat a high press; patient build-up struggles against a low block). Computer-run sides change theirs with
   the score. */

export interface Instructions {
  mentality: 'very defensive' | 'defensive' | 'cautious' | 'balanced' | 'positive' | 'attacking' | 'very attacking';
  // in possession
  passing: 'short' | 'mixed' | 'direct';
  tempo: 'slow' | 'normal' | 'fast';
  width: 'narrow' | 'normal' | 'wide';
  approach: 'middle' | 'mixed' | 'flanks';
  finalThird: 'patient' | 'mixed' | 'shoot';
  // in transition
  onLoss: 'counterpress' | 'mixed' | 'regroup';
  onWin: 'counter' | 'mixed' | 'hold';
  // out of possession
  block: 'low' | 'mid' | 'high';
  line: 'deep' | 'normal' | 'high';
  press: 'low' | 'medium' | 'high';
  tackling: 'stay' | 'normal' | 'hard';
  offside: 'off' | 'on';
}
export const DEFAULT_INSTRUCTIONS: Instructions = {
  mentality: 'balanced', passing: 'mixed', tempo: 'normal', width: 'normal', approach: 'mixed', finalThird: 'mixed',
  onLoss: 'mixed', onWin: 'mixed', block: 'mid', line: 'normal', press: 'medium', tackling: 'normal', offside: 'off',
};
/** Fills in settings missing from older saves. */
export const withDefaults = (i?: Partial<Instructions>): Instructions => ({ ...DEFAULT_INSTRUCTIONS, ...(i ?? {}) });

export type Phase = 'In possession' | 'In transition' | 'Out of possession' | 'Mentality';
type Key = keyof Instructions;
export interface InstructionOption { key: Key; label: string; phase: Phase; options: Array<{ value: string; label: string; desc: string }> }
export const INSTRUCTION_OPTIONS: InstructionOption[] = [
  { key: 'mentality', phase: 'Mentality', label: 'Mentality', options: [
    { value: 'very defensive', label: 'Very defensive', desc: 'Everyone behind the ball: very hard to break down, almost no threat. For seeing out a result.' },
    { value: 'defensive', label: 'Defensive', desc: 'Safety first: hard to break down, few chances made.' },
    { value: 'cautious', label: 'Cautious', desc: 'A little more careful than usual.' },
    { value: 'balanced', label: 'Balanced', desc: 'No particular bias.' },
    { value: 'positive', label: 'Positive', desc: 'Front foot: a few more men forward.' },
    { value: 'attacking', label: 'Attacking', desc: 'Throw men forward: more chances, more exposed.' },
    { value: 'very attacking', label: 'Very attacking', desc: 'All-out attack: the most chances, wide open at the back. For chasing a game.' } ] },
  { key: 'passing', phase: 'In possession', label: 'Passing', options: [
    { value: 'short', label: 'Short', desc: 'Keep the ball: stronger in midfield, fewer chances; risky against a high press.' },
    { value: 'mixed', label: 'Mixed', desc: 'Short or long as the moment needs.' },
    { value: 'direct', label: 'Direct', desc: 'Go long early: more chaos, and it beats a high press.' } ] },
  { key: 'tempo', phase: 'In possession', label: 'Tempo', options: [
    { value: 'slow', label: 'Slow', desc: 'Patient: fewer chances at both ends.' },
    { value: 'normal', label: 'Normal', desc: 'A mix of patience and speed.' },
    { value: 'fast', label: 'Fast', desc: 'Quick: more chances at both ends, more tiring. Punishes a high line.' } ] },
  { key: 'width', phase: 'In possession', label: 'Width', options: [
    { value: 'narrow', label: 'Narrow', desc: 'Crowd the middle: stronger midfield, fewer corners.' },
    { value: 'normal', label: 'Normal', desc: 'Use the whole pitch.' },
    { value: 'wide', label: 'Wide', desc: 'Stretch them: more crosses and corners, a thinner midfield.' } ] },
  { key: 'approach', phase: 'In possession', label: 'Attack through', options: [
    { value: 'middle', label: 'Middle', desc: 'Through the centre: good against a wide defence.' },
    { value: 'mixed', label: 'Mixed', desc: 'Wherever the space is.' },
    { value: 'flanks', label: 'Flanks', desc: 'Down the wings: good against a narrow defence, feeds a target forward.' } ] },
  { key: 'finalThird', phase: 'In possession', label: 'Final third', options: [
    { value: 'patient', label: 'Work it into the box', desc: 'Better chances, fewer of them; frustrating against a low block.' },
    { value: 'mixed', label: 'Mixed', desc: 'Shoot when it is on.' },
    { value: 'shoot', label: 'Shoot on sight', desc: 'More shots from range: useful against a low block.' } ] },
  { key: 'onLoss', phase: 'In transition', label: 'When the ball is lost', options: [
    { value: 'counterpress', label: 'Counter-press', desc: 'Win it straight back: smothers their counter, tiring.' },
    { value: 'mixed', label: 'Mixed', desc: 'Press when close, otherwise drop.' },
    { value: 'regroup', label: 'Regroup', desc: 'Get back into shape: solid, but gives them time.' } ] },
  { key: 'onWin', phase: 'In transition', label: 'When the ball is won', options: [
    { value: 'counter', label: 'Counter', desc: 'Break at speed: deadly against a high line or an attacking side.' },
    { value: 'mixed', label: 'Mixed', desc: 'Counter when it is on.' },
    { value: 'hold', label: 'Hold shape', desc: 'Keep the ball and build again: steadier, fewer quick chances.' } ] },
  { key: 'block', phase: 'Out of possession', label: 'Line of engagement', options: [
    { value: 'low', label: 'Low block', desc: 'Defend the box: very solid, hands them midfield.' },
    { value: 'mid', label: 'Mid block', desc: 'Engage around halfway.' },
    { value: 'high', label: 'High block', desc: 'Engage high: squeezes their midfield, tiring, leaves space behind.' } ] },
  { key: 'line', phase: 'Out of possession', label: 'Defensive line', options: [
    { value: 'deep', label: 'Deep', desc: 'Protect the box: solid, but it invites pressure.' },
    { value: 'normal', label: 'Normal', desc: 'A standard line.' },
    { value: 'high', label: 'High', desc: 'Squeeze the pitch: helps the midfield, exposed to fast play and counters.' } ] },
  { key: 'press', phase: 'Out of possession', label: 'Pressing', options: [
    { value: 'low', label: 'Low', desc: 'Sit off: a little more solid, saves the legs.' },
    { value: 'medium', label: 'Medium', desc: 'Press in the right moments.' },
    { value: 'high', label: 'High', desc: 'Hunt the ball: their midfield struggles, but your players tire and foul more.' } ] },
  { key: 'tackling', phase: 'Out of possession', label: 'Tackling', options: [
    { value: 'stay', label: 'Stay on feet', desc: 'Fewer fouls and cards, wins the ball back less.' },
    { value: 'normal', label: 'Normal', desc: 'Tackle when it is right.' },
    { value: 'hard', label: 'Get stuck in', desc: 'Wins more ball, gives away more fouls and cards.' } ] },
  { key: 'offside', phase: 'Out of possession', label: 'Offside trap', options: [
    { value: 'off', label: 'Off', desc: 'Track runners back.' },
    { value: 'on', label: 'On', desc: 'Step up together: catches runners, but fast direct teams can beat it.' } ] },
];
export const PHASES: Phase[] = ['Mentality', 'In possession', 'In transition', 'Out of possession'];

export interface InstructionEffects { atk: number; def: number; mid: number; oppMid: number; fatigue: number; corners: number; fouls: number; chaos: number }

/** Multipliers from one side's instructions, reacting to the opponent's. */
export function instructionEffects(mine?: Partial<Instructions>, theirs?: Partial<Instructions>): InstructionEffects {
  const i = withDefaults(mine), o = withDefaults(theirs);
  const e: InstructionEffects = { atk: 1, def: 1, mid: 1, oppMid: 1, fatigue: 1, corners: 1, fouls: 1, chaos: 1 };
  const MENT: Record<Instructions['mentality'], [number, number]> = { 'very defensive': [0.88, 1.09], defensive: [0.93, 1.06], cautious: [0.965, 1.03], balanced: [1, 1], positive: [1.03, 0.975], attacking: [1.06, 0.95], 'very attacking': [1.1, 0.9] };
  e.atk *= MENT[i.mentality][0]; e.def *= MENT[i.mentality][1];
  // in possession
  if (i.passing === 'short') { e.mid *= 1.03; e.chaos *= 0.96; if (o.press === 'high' || o.block === 'high') e.mid *= 0.975; }
  else if (i.passing === 'direct') { e.mid *= 0.98; e.chaos *= 1.04; if (o.press === 'high' || o.block === 'high') e.atk *= 1.025; }
  if (i.tempo === 'fast') { e.atk *= 1.03; e.def *= 0.98; e.fatigue *= 1.1; e.chaos *= 1.05; } else if (i.tempo === 'slow') { e.atk *= 0.97; e.def *= 1.02; e.chaos *= 0.94; }
  if (i.width === 'wide') { e.corners *= 1.35; e.mid *= 0.98; } else if (i.width === 'narrow') { e.mid *= 1.03; e.corners *= 0.75; }
  if (i.approach === 'flanks') { e.corners *= 1.15; if (o.width === 'narrow') e.atk *= 1.025; } else if (i.approach === 'middle') { e.corners *= 0.9; e.mid *= 1.01; if (o.width === 'wide') e.atk *= 1.025; }
  if (i.finalThird === 'patient') { e.chaos *= 0.96; e.atk *= o.block === 'low' ? 0.98 : 1.015; } else if (i.finalThird === 'shoot') { e.chaos *= 1.03; e.atk *= o.block === 'low' ? 1.02 : 0.99; }
  // in transition
  if (i.onLoss === 'counterpress') { e.oppMid *= 0.98; e.fatigue *= 1.1; if (o.onWin === 'counter') e.def *= 1.02; } else if (i.onLoss === 'regroup') { e.def *= 1.02; e.atk *= 0.99; }
  if (i.onWin === 'counter') {
    let c = 1.01;
    if (o.line === 'high') c *= 1.03;
    if (o.mentality === 'attacking' || o.mentality === 'positive' || o.mentality === 'very attacking') c *= 1.02;
    if (o.onLoss === 'counterpress') c *= 0.98;
    e.atk *= c; e.chaos *= 1.02;
  } else if (i.onWin === 'hold') { e.mid *= 1.02; e.atk *= 0.985; e.chaos *= 0.97; }
  // out of possession
  if (i.block === 'low') { e.def *= 1.04; e.oppMid *= 1.03; e.atk *= 0.97; } else if (i.block === 'high') { e.oppMid *= 0.97; e.def *= 0.985; e.fatigue *= 1.08; }
  if (i.line === 'high') { e.mid *= 1.02; e.def *= o.tempo === 'fast' || o.onWin === 'counter' ? 0.94 : 0.97; } else if (i.line === 'deep') { e.def *= 1.04; e.atk *= 0.97; e.oppMid *= 1.02; }
  if (i.press === 'high') { e.oppMid *= 0.96; e.fatigue *= 1.3; e.fouls *= 1.15; } else if (i.press === 'low') { e.oppMid *= 1.02; e.def *= 1.02; e.fatigue *= 0.85; }
  if (i.tackling === 'hard') { e.oppMid *= 0.985; e.fouls *= 1.3; } else if (i.tackling === 'stay') { e.fouls *= 0.8; e.def *= 0.99; }
  if (i.offside === 'on') e.def *= o.passing === 'direct' || o.tempo === 'fast' ? 0.97 : 1.015;
  return e;
}

/** How a computer-run side sets up: by the score late on, otherwise by how it compares. */
export function aiInstructions(minute: number, goalDiff: number, strengthRatio: number): Instructions {
  if (minute >= 80 && goalDiff < 0) return { ...DEFAULT_INSTRUCTIONS, mentality: 'very attacking', press: 'high', tempo: 'fast', width: 'wide', line: 'high', passing: 'direct', block: 'high' };
  if (minute >= 85 && goalDiff > 0) return { ...DEFAULT_INSTRUCTIONS, mentality: 'very defensive', press: 'low', tempo: 'slow', width: 'narrow', line: 'deep', block: 'low', onWin: 'hold' };
  if (minute >= 60 && goalDiff < 0) return { ...DEFAULT_INSTRUCTIONS, mentality: 'attacking', press: 'high', tempo: 'fast', width: 'wide', line: 'high', passing: 'direct', block: 'high' };
  if (minute >= 75 && goalDiff > 0) return { ...DEFAULT_INSTRUCTIONS, mentality: 'defensive', press: 'low', tempo: 'slow', width: 'narrow', line: 'deep', block: 'low', onWin: 'hold' };
  if (strengthRatio < 0.9) return { ...DEFAULT_INSTRUCTIONS, mentality: 'cautious', line: 'deep', block: 'low', onWin: 'counter' };
  if (strengthRatio > 1.1) return { ...DEFAULT_INSTRUCTIONS, mentality: 'positive', press: 'high', passing: 'short', onLoss: 'counterpress' };
  return DEFAULT_INSTRUCTIONS;
}

export const describeInstructions = (i: Instructions) =>
  INSTRUCTION_OPTIONS.map((o) => `${o.label}: ${o.options.find((x) => x.value === i[o.key])?.label}`).join(' · ');
