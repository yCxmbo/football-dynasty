import { useState } from 'react';
import { FD } from '../ds';
import { answerPress, pressTitle, skipPress } from '../engine/press';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';

/** The press room: answer the questions one by one, and see what each answer did. */
export default function PressRoom({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const c = g.press;
  const [said, setSaid] = useState<Record<number, string>>({});
  if (!c) return <div className="pg-stack"><div className="pg-head"><div><h1 className="pg-title">Press room</h1><p className="pg-sub">No press conference right now. They come the day before your matches and straight after them.</p></div></div></div>;
  const say = (qi: number, oi: number) => {
    const txt = answerPress(structuredClone(g), qi, oi); // same outcome, worked out on a copy for the reply
    if (txt) setSaid((m) => ({ ...m, [qi]: txt }));
    update((d) => { answerPress(d, qi, oi); });
  };
  const subject = (pid?: string) => (pid && g.players[pid] ? <button type="button" className="pg-link club-name" onClick={() => go('player', pid)}>{g.players[pid].name}</button> : null);
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Press room</h1><p className="pg-sub">{pressTitle(c)}{c.skipped ? ' · your assistant went instead' : c.done ? ' · finished' : ''}</p></div>
        {!c.done ? <FD.Button variant="ghost" onClick={() => update((d) => skipPress(d))}>Send your assistant</FD.Button> : <FD.Button variant="secondary" onClick={() => go('home')}>Back to work</FD.Button>}
      </div>
      <p className="hm-note" style={{ margin: 0 }}>Your answers move the squad's or a player's morale, the supporters' mood and the board's trust. There's rarely a free lunch: what pleases one often costs another.</p>
      {c.questions.map((q, qi) => {
        const a = c.answers[qi];
        return (
          <section key={q.id} className="pg-card press-q" aria-labelledby={`pq-${qi}`}>
            <span className="fd-label">Question {qi + 1} of {c.questions.length}{q.playerId ? <> · about {subject(q.playerId)}</> : null}</span>
            <h2 className="press-q__text" id={`pq-${qi}`}>“{q.text}”</h2>
            <div className="press-q__opts">
              {q.options.map((o, oi) => (
                <button key={oi} type="button" className={'talk__opt' + (a === oi ? ' is-chosen' : '')} disabled={a !== null || !!c.done} aria-pressed={a === oi} onClick={() => say(qi, oi)}>
                  <strong>{o.text}</strong>
                </button>
              ))}
            </div>
            {a !== null ? <p className="talk__reply" role="status">{said[qi] ?? q.options[a].effect.text}</p> : null}
          </section>
        );
      })}
    </div>
  );
}
