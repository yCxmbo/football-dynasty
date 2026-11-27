import { useEffect, useRef, useState } from 'react';
import { FORMATION_LAYOUT, type Formation } from '../engine/match';
import type { LiveMatch } from '../engine/live';
import type { MatchEvent } from '../engine/types';

/* A top-down view of the live match. The engine plays minute by minute and reports events, not positions, so this
   is a picture of the match rather than a simulation: both shapes (from their formations) slide up and down the
   pitch with possession, the ball moves between players, and goals, chances, saves, cards and substitutions get
   a short moment of their own. It never changes the result. */

type Side = 'home' | 'away';
interface Moment { side: Side; kind: MatchEvent['type']; text: string; step: number }
const MOMENT_STEPS = 4;
const STEP_MS: Record<string, number> = { '1': 900, '2': 520, '4': 260 };
const PRIORITY: Partial<Record<MatchEvent['type'], number>> = { goal: 5, owngoal: 5, penalty: 4, red: 3, save: 2, chance: 2, injury: 1, yellow: 1, sub: 0 };

/** Pitch coordinates (x 0–100 left to right, home attacking right; y 0–100 top to bottom) for a side's eleven. */
function shape(f: Formation, side: Side, push: number) {
  return FORMATION_LAYOUT[f].map(([lx, ly]) => {
    const depth = 100 - ly; // 10 = own goal, 86 = up front
    const x = Math.min(95, Math.max(4, 3 + depth * 0.6 + (depth > 15 ? push : push * 0.2)));
    return side === 'home' ? { x, y: lx } : { x: 100 - x, y: 100 - lx };
  });
}
function hash(t: string) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export default function MatchPitch({ lm, userSide, speed, names }: { lm: LiveMatch; userSide: Side; speed: string; names: [string, string] }) {
  const [step, setStep] = useState(0);
  const [moment, setMoment] = useState<Moment | null>(null);
  const seen = useRef(lm.events.length);
  const owner = useRef<Side>('home');
  const holder = useRef(9);
  const paused = speed === 'pause' || lm.done;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // new events: the most important one this minute gets a moment
  useEffect(() => {
    const fresh = lm.events.slice(seen.current);
    seen.current = lm.events.length;
    const top = fresh.filter((e) => e.side && PRIORITY[e.type] !== undefined).sort((a, b) => (PRIORITY[b.type] ?? 0) - (PRIORITY[a.type] ?? 0))[0];
    // a save is reported for the goalkeeper's side: the attack was the other team's
    const att = top?.side && (top.type === 'save' ? (top.side === 'home' ? 'away' : 'home') : top.side);
    if (top && att) { setMoment({ side: att, kind: top.type, text: top.text, step }); owner.current = att; }
  }, [lm.events.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // the run of play between events
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setStep((n) => {
        const mins = Math.max(1, lm.minute), poss = lm.stats.possession / mins / 100; // home share
        const r = (hash(`${n}:${lm.minute}`) % 1000) / 1000;
        if (r < 0.22) owner.current = (hash(`o${n}`) % 1000) / 1000 < poss ? 'home' : 'away';
        holder.current = 1 + (hash(`h${n}:${owner.current}`) % 10);
        return n + 1;
      });
    }, STEP_MS[speed] ?? 520);
    return () => window.clearInterval(t);
  }, [paused, speed, lm]);

  const active = moment && step - moment.step < MOMENT_STEPS ? moment : null;
  const attackSide: Side = active?.side ?? owner.current;
  const goalMoment = active?.kind === 'goal' || active?.kind === 'owngoal' || active?.kind === 'penalty'; // a penalty event is a scored one
  const dots: Array<{ id: string; x: number; y: number; side: Side; num: number; i: number }> = [];
  for (const side of ['home', 'away'] as const) {
    const s = lm[side];
    const f = attackSide === side ? s.formation : s.defFormation ?? s.formation;
    const push = attackSide === side ? (active ? 16 : 9) : (active ? -12 : -7);
    const pts = shape(f, side, push);
    s.xi.forEach((id, i) => {
      if (!id) return;
      const p = pts[i] ?? { x: 50, y: 50 };
      const jx = ((hash(id + step) % 100) / 100 - 0.5) * (reduced ? 0 : 3), jy = ((hash(step + id) % 100) / 100 - 0.5) * (reduced ? 0 : 4);
      dots.push({ id, side, i, num: lm.players[id]?.number ?? 0, x: Math.min(97, Math.max(3, p.x + jx)), y: Math.min(96, Math.max(4, p.y + jy)) });
    });
  }
  // the ball: with the holder, or heading for goal in a big moment
  const attackers = dots.filter((d) => d.side === attackSide && d.i > 0);
  const carrier = attackers.length ? attackers[(active ? attackers.length - 1 : holder.current) % attackers.length] : undefined;
  const goalX = attackSide === 'home' ? 98.5 : 1.5;
  const ball = goalMoment ? { x: goalX, y: 50 } : active && (active.kind === 'save' || active.kind === 'chance') ? { x: attackSide === 'home' ? 90 : 10, y: 46 } : carrier ? { x: carrier.x + (attackSide === 'home' ? 1.5 : -1.5), y: carrier.y + 1.5 } : { x: 50, y: 50 };
  const label = active ? (goalMoment ? 'GOAL!' : active.kind === 'save' ? 'Saved' : active.kind === 'chance' ? 'Chance' : active.kind === 'yellow' ? 'Booked' : active.kind === 'red' ? 'Sent off' : active.kind === 'sub' ? 'Substitution' : active.kind === 'injury' ? 'Injury' : '') : '';
  const last = [...lm.events].reverse().find((e) => e.side);

  return (
    <section className="pg-card mp" aria-label="Pitch view">
      <div className={'mp__pitch' + (reduced ? ' is-still' : '')} role="img" aria-label={`${names[0]} ${lm.score[0]}, ${names[1]} ${lm.score[1]}, ${lm.minute} minutes. ${last?.text ?? ''}`}>
        <span className="mp__line mp__line--half" /><span className="mp__circle" /><span className="mp__box mp__box--l" /><span className="mp__box mp__box--r" /><span className="mp__goal mp__goal--l" /><span className="mp__goal mp__goal--r" />
        {dots.map((d) => (
          <span key={d.id} className={`mp__dot ${d.side === userSide ? 'is-us' : 'is-them'}${d.i === 0 ? ' is-gk' : ''}`} style={{ left: d.x + '%', top: d.y + '%' }}>{d.num}</span>
        ))}
        <span className={'mp__ball' + (goalMoment ? ' is-goal' : '')} style={{ left: ball.x + '%', top: ball.y + '%' }} />
        {label ? <span className={`mp__flash mp__flash--${goalMoment ? 'goal' : 'event'}`} key={active!.step}>{label}</span> : null}
        <span className="mp__score">{lm.minute}′ · {lm.score[0]}–{lm.score[1]}</span>
      </div>
      <p className="mp__ticker" aria-live="polite">{last ? <><strong>{last.minute}′</strong> {last.text}</> : 'Kick-off.'}</p>
    </section>
  );
}
