import { useState } from 'react';
import { FD } from '../ds';
import { atmosphere, atmosphereWord, canMentor, groupLabel, groups, MAX_MENTORING, squadMoods, startMentoring, stopMentoring, type Tier } from '../engine/dynamics';
import { squadOf } from '../engine/game';
import type { GameState } from '../engine/types';
import type { Screen } from './shared';
import { TeamMeeting } from './Talks';

const TIERS: Tier[] = ['Team leader', 'Highly influential', 'Influential', 'Other'];
const moodClass = (score: number) => (score >= 1 ? 'pred-up' : score <= -1 ? 'pred-down' : 'fd-muted');

/** The dressing room: atmosphere, hierarchy and moods, groups, mentoring. */
export default function SquadDynamics({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const moods = squadMoods(g);
  const atm = atmosphere(g, moods);
  const grp = groups(g, moods);
  const name = (id: string) => g.players[id]?.name ?? '?';
  const link = (id: string) => <button type="button" className="pg-link club-name" onClick={() => go('player', id)}>{name(id)}</button>;
  const ft = squadOf(g, g.userClubId);
  const mentors = ft.filter((p) => p.squad === 'First team' && p.age >= 26).sort((a, b) => (b.attributes.Leadership ?? 0) - (a.attributes.Leadership ?? 0));
  const pupils = ft.filter((p) => p.age <= 21).sort((a, b) => b.potential - a.potential);
  const [mentor, setMentor] = useState('');
  const [pupil, setPupil] = useState('');
  const [note, setNote] = useState('');
  const pairs = g.mentoring ?? [];
  return (
    <div className="pg-stack" style={{ gap: 16, marginTop: 12 }}>
      <TeamMeeting g={g} update={update} />
      <section className="pg-card">
        <div className="aw-head">
          <h2 className="pg-h" style={{ margin: 0 }}>Dressing-room atmosphere · {atmosphereWord(atm)}</h2>
          <span className="hm-note" style={{ margin: 0 }}>{atm}/100</span>
        </div>
        <span className="fd-meter fd-meter--wide"><span className={`fd-meter__bar fd-meter__bar--${atm >= 60 ? 'low' : atm >= 40 ? 'medium' : 'high'}`} style={{ width: atm + '%' }} /></span>
        <p className="hm-note" style={{ marginBottom: 0 }}>Happiness weighted by influence: team leaders count most. A good atmosphere lifts performances a little, a toxic one costs you. Unhappy leaders and unsettled groups spread their mood.</p>
      </section>

      <section className="pg-card">
        <h2 className="pg-h">Hierarchy and moods</h2>
        <div className="mg-scroll"><table className="fd-mini"><thead><tr><th>Player</th><th>Standing</th><th>Mood</th><th>Why</th></tr></thead><tbody>
          {TIERS.flatMap((tier) => moods.filter((m) => m.tier === tier).map((m) => (
            <tr key={m.id}>
              <td>{link(m.id)}{g.players[m.id]?.captain ? <span className="derby-tag">Captain</span> : null}</td>
              <td className="fd-muted">{tier}</td>
              <td className={moodClass(m.score)}><strong>{m.label}</strong></td>
              <td className="fd-muted">{m.reasons.join(' · ') || '—'}</td>
            </tr>
          )))}
        </tbody></table></div>
      </section>

      <div className="pg-grid2 rec-grid">
        <section className="pg-card">
          <h2 className="pg-h">Groups</h2>
          {grp.length ? (
            <table className="fd-mini"><tbody>
              {grp.map((x) => (
                <tr key={x.name}>
                  <td><strong>{groupLabel(x.name).replace(/^./, (c) => c.toUpperCase())}</strong><div className="fd-muted" style={{ fontSize: 12 }}>{x.members.map(name).join(', ')}</div></td>
                  <td className={moodClass(x.mood >= 1 ? 1 : x.mood <= -1 ? -1 : 0)}>{x.mood >= 1 ? 'Happy' : x.mood <= -1 ? 'Unsettled' : 'Settled'}</td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="hm-note" style={{ margin: 0 }}>No groups of three or more.</p>}
        </section>

        <section className="pg-card">
          <h2 className="pg-h">Mentoring · {pairs.length} of {MAX_MENTORING}</h2>
          <p className="hm-note" style={{ marginTop: 0 }}>Pair an experienced player (26 or older) with a youngster (21 or under). The youngster develops a little faster and can pick up his mentor's professionalism, determination and leadership.</p>
          {pairs.length ? (
            <table className="fd-mini"><tbody>
              {pairs.map((x) => (
                <tr key={x.pupil}><td>{link(x.mentor)} <span className="fd-muted">mentors</span> {link(x.pupil)}</td><td style={{ textAlign: 'right' }}><button type="button" className="pg-link" onClick={() => update((d) => stopMentoring(d, x.pupil))}>End</button></td></tr>
              ))}
            </tbody></table>
          ) : null}
          {pairs.length < MAX_MENTORING ? (
            <div className="sp-grid" style={{ marginTop: 8 }}>
              <label className="sp-field"><span className="fd-label">Mentor</span>
                <select className="fd-input" value={mentor} onChange={(e) => setMentor(e.target.value)} aria-label="Mentor">
                  <option value="">Choose…</option>
                  {mentors.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.age} · Leadership {p.attributes.Leadership ?? '–'}</option>)}
                </select>
              </label>
              <label className="sp-field"><span className="fd-label">Youngster</span>
                <select className="fd-input" value={pupil} onChange={(e) => setPupil(e.target.value)} aria-label="Youngster">
                  <option value="">Choose…</option>
                  {pupils.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.age} · {p.squad}</option>)}
                </select>
              </label>
              <div className="sp-field" style={{ justifyContent: 'flex-end' }}>
                <FD.Button size="sm" disabled={!mentor || !pupil} onClick={() => {
                  const err = canMentor(g, mentor, pupil);
                  if (err) { setNote(err); return; }
                  update((d) => { startMentoring(d, mentor, pupil); });
                  setMentor(''); setPupil(''); setNote('');
                }}>Start mentoring</FD.Button>
              </div>
            </div>
          ) : null}
          {note ? <p className="fd-warn" role="status" style={{ marginBottom: 0 }}>{note}</p> : null}
        </section>
      </div>
    </div>
  );
}
