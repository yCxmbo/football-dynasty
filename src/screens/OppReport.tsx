import { oppositionReport } from '../engine/opposition';
import type { Fixture, GameState } from '../engine/types';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

/** The assistant's report on the next opponent. `compact` shows the essentials only (Home). */
export default function OppReport({ g, f, go, compact }: { g: GameState; f: Fixture; go: (s: Screen, id?: string) => void; compact?: boolean }) {
  const r = oppositionReport(g, f);
  if (!r) return null;
  const opp = g.clubs[r.oppId];
  const edge = (n: number) => <span className={n >= 4 ? 'pred-up' : n <= -4 ? 'pred-down' : 'fd-muted'}>{n > 0 ? `+${n}` : n}</span>;
  const following = g.formation === r.suggested;
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
          <p className="hm-note" style={{ margin: '8px 0 0' }}>Likely eleven ({r.formation}): {r.xi.map((x) => `${x.name} (${x.slot})`).join(', ')}.</p>
          {r.meetings.length ? <p className="hm-note" style={{ margin: '8px 0 0' }}>This season: {r.meetings.join(' · ')}</p> : null}
        </>
      ) : null}
    </section>
  );
}
