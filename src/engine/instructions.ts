/* Team instructions: mentality, pressing, tempo, width and defensive line. Each trades something for something
   (a high press unsettles the opponent's midfield but tires your players; a high line squeezes the pitch but is
   exposed to fast, direct opponents). Computer-run sides change theirs with the score. */

export interface Instructions {
  mentality: 'defensive' | 'balanced' | 'attacking';
  press: 'low' | 'medium' | 'high';
  tempo: 'slow' | 'normal' | 'fast';
  width: 'narrow' | 'normal' | 'wide';
  line: 'deep' | 'normal' | 'high';
}
export const DEFAULT_INSTRUCTIONS: Instructions = { mentality: 'balanced', press: 'medium', tempo: 'normal', width: 'normal', line: 'normal' };

type Key = keyof Instructions;
export const INSTRUCTION_OPTIONS: Array<{ key: Key; label: string; options: Array<{ value: string; label: string; desc: string }> }> = [
  { key: 'mentality', label: 'Mentality', options: [
    { value: 'defensive', label: 'Defensive', desc: 'Safety first: harder to break down, fewer chances made.' },
    { value: 'balanced', label: 'Balanced', desc: 'No particular bias.' },
    { value: 'attacking', label: 'Attacking', desc: 'More men forward: more chances, more exposed at the back.' } ] },
  { key: 'press', label: 'Pressing', options: [
    { value: 'low', label: 'Low', desc: 'Sit off: a little more solid, saves the legs, gives them the ball.' },
    { value: 'medium', label: 'Medium', desc: 'Press in the right moments.' },
    { value: 'high', label: 'High', desc: 'Hunt the ball: their midfield struggles, but your players tire faster and foul more.' } ] },
  { key: 'tempo', label: 'Tempo', options: [
    { value: 'slow', label: 'Slow', desc: 'Patient: fewer chances at both ends.' },
    { value: 'normal', label: 'Normal', desc: 'A mix of patience and speed.' },
    { value: 'fast', label: 'Fast', desc: 'Direct: more chances at both ends, more tiring. Punishes a high line.' } ] },
  { key: 'width', label: 'Width', options: [
    { value: 'narrow', label: 'Narrow', desc: 'Crowd the middle: stronger midfield, fewer corners.' },
    { value: 'normal', label: 'Normal', desc: 'Use the whole pitch.' },
    { value: 'wide', label: 'Wide', desc: 'Stretch them: more crosses and corners, a thinner midfield.' } ] },
  { key: 'line', label: 'Defensive line', options: [
    { value: 'deep', label: 'Deep', desc: 'Protect the box: solid, but it invites pressure.' },
    { value: 'normal', label: 'Normal', desc: 'A standard line.' },
    { value: 'high', label: 'High', desc: 'Squeeze the pitch: helps the midfield, exposed to fast, direct sides.' } ] },
];

export interface InstructionEffects { atk: number; def: number; mid: number; oppMid: number; fatigue: number; corners: number; fouls: number; chaos: number }

/** Multipliers from one side's instructions (and, for the high line, the opponent's tempo). */
export function instructionEffects(i: Instructions = DEFAULT_INSTRUCTIONS, opp: Instructions = DEFAULT_INSTRUCTIONS): InstructionEffects {
  const e: InstructionEffects = { atk: 1, def: 1, mid: 1, oppMid: 1, fatigue: 1, corners: 1, fouls: 1, chaos: 1 };
  if (i.mentality === 'attacking') { e.atk *= 1.06; e.def *= 0.95; } else if (i.mentality === 'defensive') { e.atk *= 0.93; e.def *= 1.06; }
  if (i.press === 'high') { e.oppMid *= 0.96; e.fatigue *= 1.3; e.fouls *= 1.15; } else if (i.press === 'low') { e.oppMid *= 1.02; e.def *= 1.02; e.fatigue *= 0.85; }
  if (i.tempo === 'fast') { e.atk *= 1.03; e.def *= 0.98; e.fatigue *= 1.1; e.chaos *= 1.05; } else if (i.tempo === 'slow') { e.atk *= 0.97; e.def *= 1.02; e.chaos *= 0.94; }
  if (i.width === 'wide') { e.corners *= 1.35; e.mid *= 0.98; } else if (i.width === 'narrow') { e.mid *= 1.03; e.corners *= 0.75; }
  if (i.line === 'high') { e.mid *= 1.02; e.def *= opp.tempo === 'fast' ? 0.93 : 0.97; } else if (i.line === 'deep') { e.def *= 1.04; e.atk *= 0.97; e.oppMid *= 1.02; }
  return e;
}

/** How a computer-run side sets up: by the score late on, otherwise by how it compares. */
export function aiInstructions(minute: number, goalDiff: number, strengthRatio: number): Instructions {
  if (minute >= 60 && goalDiff < 0) return { mentality: 'attacking', press: 'high', tempo: 'fast', width: 'wide', line: 'high' };
  if (minute >= 75 && goalDiff > 0) return { mentality: 'defensive', press: 'low', tempo: 'slow', width: 'narrow', line: 'deep' };
  if (strengthRatio < 0.9) return { mentality: 'defensive', press: 'medium', tempo: 'normal', width: 'normal', line: 'deep' };
  if (strengthRatio > 1.1) return { mentality: 'attacking', press: 'high', tempo: 'normal', width: 'normal', line: 'normal' };
  return DEFAULT_INSTRUCTIONS;
}

export const describeInstructions = (i: Instructions) =>
  INSTRUCTION_OPTIONS.map((o) => `${o.label}: ${o.options.find((x) => x.value === i[o.key])?.label}`).join(' · ');
