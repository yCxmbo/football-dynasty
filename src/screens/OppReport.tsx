import { FOCUS, focusValue, oppositionReport, setPrep } from '../engine/opposition';
import { FORMATION_LAYOUT } from '../engine/match';
import type { Fixture, GameState } from '../engine/types';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

/** The assistant's report on the next opponent. `compact` shows the essentials only (Home). */
export default function OppReport({ g, f, go, compact, update }: { g: GameState; f: Fixture; go: (s: Screen, id?: string) => void; compact?: boolean; update?: (fn: (d: GameState) => void) => void }) {
  const r = oppositionReport(g, f);
  if (!r) return null;
  const opp = g.clubs[r.oppId];
  const edge = (n: number) => <span className={n >= 4 ? 'pred-up' : n <= -4 ? 'pred-down' : 'fd-muted'}>{n > 0 ? `+${n}` : n}</span>;
  const following = g.formation === r.suggested;
  const prep = g.matchPrep?.fixtureId === f.id ? g.matchPrep : undefined;
  return (
    <section className="pg-card opp">
      <div className="aw-head">
        <h2 className="pg-h" style={{ margin: 0 }}>Opposition report</h2>
        <button type="button" className="pg-link club-cell" onClick={() => go('club', opp.id)}><img className="club-badge" src={badgeUrl(opp)} alt="" />{opp.name}</button>
      </div>
      <p className="hm-note" style={{ margin: '0 0 6px' }}>
        Form: {r.form.length ? <span className="opp__form">{r.form.map((x, i) => <span key={i} className={`fd-form fd-form--${x}`}>{x}</span>)}</span> : 'no games yet'}
        {' '}· Pundits: win {r.odds.win}% · draw {r.odds.draw}% · loss {r.odds.loss}%
      </p>
      <p className="hm-note" style={{ margin: '0 0 6px' }}>Our edge: attack v their defence {edge(r.edges.attack)} · midfield {edge(r.edges.midfield)} · defence v their attack {edge(r.edges.defence)}</p>
      <ul className="opp__advice">{r.advice.map((a, i) => <li key={i}>{a}</li>)}</ul>
      <p className="hm-note" style={{ margin: '6px 0 0' }}>
        Suggested formation: <strong>{r.suggested}</strong> {following ? <span className="pred-up">(you're using it: a small edge on the day)</span> : <span className="fd-muted">(you're in {g.formation}; {compact ? 'switch on the Tactics screen' : 'pick it below'} for a small edge)</span>}
      </p>
      {!compact ? (
        <>
          {r.danger.length ? <p className="hm-note" style={{ margin: '8px 0 0' }}>Danger men: {r.danger.map((d, i) => <span key={d.id}>{i ? ', ' : ''}<button type="button" className="pg-link club-name" onClick={() => go('player', d.id)}><strong>{d.name}</strong></button> ({d.why})</span>)}</p> : null}
          {update ? <Prep g={g} f={f} r={r} update={update} /> : null}
          <div className="opp__xi">
            <span className="fd-label">Their likely eleven · {r.formation}</span>
            <div className="opp__pitch" role="img" aria-label={`Likely eleven: ${r.xi.map((x) => `${x.name} (${x.slot})`).join(', ')}`}>
              {r.xi.map((x, i) => {
                const [left, top] = FORMATION_LAYOUT[r.formation][i] ?? [50, 50];
                const marked = prep?.mark === x.id, danger = r.danger.some((d) => d.id === x.id);
                return <span key={x.id} className={'opp__dot' + (danger ? ' is-danger' : '') + (marked ? ' is-marked' : '')} style={{ left: left + '%', top: (100 - top) + '%' }}><i />{x.name.split(' ').slice(-1)[0]}</span>;
              })}
            </div>
          </div>
          {r.meetings.length ? <p className="hm-note" style={{ margin: '8px 0 0' }}>This season: {r.meetings.join(' · ')}</p> : null}
        </>
      ) : null}
    </section>
  );
}

/** Match preparation: where to focus, and who to man-mark. */
function Prep({ g, f, r, update }: { g: GameState; f: Fixture; r: NonNullable<ReturnType<typeof oppositionReport>>; update: (fn: (d: GameState) => void) => void }) {
  const prep = g.matchPrep?.fixtureId === f.id ? g.matchPrep : undefined;
  const candidates = [...r.danger.map((d) => ({ id: d.id, name: d.name, why: r.xi.some((x) => x.id === d.id) ? d.why : `${d.why}; may not start` })), ...r.xi.filter((x) => x.slot !== 'GK' && !r.danger.some((d) => d.id === x.id)).map((x) => ({ id: x.id, name: x.name, why: x.slot }))];
  const pct = (v: number) => { const d = Math.round((v - 1) * 1000) / 10; return d > 0 ? `+${d}%` : `${d}%`; };
  return (
    <div className="opp__prep">
      <span className="fd-label">Match prep</span>
      <div className="fd-seg opp__focus" role="radiogroup" aria-label="Focus">
        <button type="button" role="radio" aria-checked={!prep?.focus} className={'fd-seg__opt' + (!prep?.focus ? ' is-on' : '')} onClick={() => update((d) => setPrep(d, f.id, { focus: null }))}>No focus</button>
        {FOCUS.map((x) => {
          const e = r.edges[x.edge], v = focusValue(e);
          return <button key={x.id} type="button" role="radio" aria-checked={prep?.focus === x.id} className={'fd-seg__opt' + (prep?.focus === x.id ? ' is-on' : '')} title={`${x.desc} Our edge here: ${e > 0 ? '+' : ''}${e}. Worth ${pct(v)} on the day.`} onClick={() => update((d) => setPrep(d, f.id, { focus: x.id }))}>{x.label}</button>;
        })}
      </div>
      {prep?.focus ? (() => { const x = FOCUS.find((y) => y.id === prep.focus)!; const e = r.edges[x.edge]; return <p className={'hm-note ' + (e >= 4 ? 'pred-up' : e < 0 ? 'pred-down' : '')} style={{ margin: 0 }}>{e >= 4 ? `Good call: we have the edge there (+${e}). Worth ${pct(focusValue(e))}.` : e < 0 ? `Risky: they are stronger there (${e}). Costs ${pct(focusValue(e))}.` : `Little in it there (${e > 0 ? '+' : ''}${e}): a small gain at best.`}</p>; })() : null}
      <label className="tac-field"><span className="fd-label">Man-mark</span>
        <select className="fd-input" value={prep?.mark ?? ''} aria-label="Man-mark a player" onChange={(e) => { const v = e.target.value; update((d) => setPrep(d, f.id, { mark: v || null })); }}>
          <option value="">Nobody</option>
          {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.why})</option>)}
        </select>
      </label>
      {prep?.mark ? <p className="hm-note" style={{ margin: 0 }}>He'll get far fewer chances, but tying up one of ours costs a little elsewhere (−0.5%). Worth it against a player who scores the goals.</p> : null}
    </div>
  );
}
