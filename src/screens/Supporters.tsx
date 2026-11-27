import { fanWord, setTicketPrice, TICKETS } from '../engine/fans';
import type { GameState } from '../engine/types';

/** Supporters' mood, its recent course and reasons, and ticket prices. */
export default function Supporters({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const f = g.fans ?? { mood: 60, ticket: 'normal' as const, trend: [], notes: [] };
  const m = Math.round(f.mood);
  const tone = m >= 62 ? 'low' : m >= 30 ? 'medium' : 'high';
  const pts = f.trend.length > 1 ? f.trend.map((v, i) => `${(i / (f.trend.length - 1)) * 200},${40 - (v / 100) * 40}`).join(' ') : '';
  return (
    <section className="pg-card fans" aria-labelledby="fans-h">
      <div className="talk__head">
        <h2 className="pg-h" id="fans-h" style={{ margin: 0 }}>Supporters</h2>
        <span className="fd-muted talk__meta">{fanWord(m)} · {m}/100</span>
      </div>
      <div className="fans__grid">
        <div>
          <span className="fd-meter fd-meter--wide"><span className={`fd-meter__bar fd-meter__bar--${tone}`} style={{ width: m + '%' }} /></span>
          {pts ? (
            <svg className="fans__trend" viewBox="0 0 200 40" preserveAspectRatio="none" role="img" aria-label={`Supporters' mood over your last ${f.trend.length} matches: from ${f.trend[0]} to ${f.trend[f.trend.length - 1]}`}>
              <line x1="0" x2="200" y1="20" y2="20" className="fans__mid" />
              <polyline points={pts} className="fans__line" />
            </svg>
          ) : <p className="hm-note">The trend appears once you've played a few matches.</p>}
          <p className="hm-note" style={{ margin: 0 }}>Results against expectations move them most (derbies count double). Signing a star lifts them, selling one hurts. A happy ground (75+) gives a small lift at home and fills more seats; the board listens to the stands.</p>
        </div>
        <div>
          <span className="fd-label">Recently</span>
          <ul className="fans__notes">{f.notes.length ? f.notes.map((n, i) => <li key={i}>{n}</li>) : <li className="fd-muted">Nothing much to report.</li>}</ul>
          <span className="fd-label">Ticket prices</span>
          <div className="fd-seg" role="radiogroup" aria-label="Ticket prices">
            {TICKETS.map((t) => <button key={t.id} type="button" role="radio" aria-checked={f.ticket === t.id} className={'fd-seg__opt' + (f.ticket === t.id ? ' is-on' : '')} title={t.desc} onClick={() => update((d) => setTicketPrice(d, t.id))}>{t.label}</button>)}
          </div>
          <p className="hm-note" style={{ margin: '4px 0 0' }}>{TICKETS.find((t) => t.id === f.ticket)!.desc}</p>
        </div>
      </div>
    </section>
  );
}
