import { useState } from 'react';
import { FD } from '../ds';
import { acceptOffer, applyChance, boardConfidence, career, clubLine, confidenceWord, currentSpell, interviewForJob, interviewQuestions, managerWage, requestNewContract, resign } from '../engine/career';
import { toCur } from '../store';
import { baseTarget, boardTarget } from '../engine/game';
import { ACHIEVEMENTS } from '../engine/achievements';
import { STYLES, setStyle, styleOf } from '../engine/style';
import { managerReputation } from '../engine/nationaljob';
import { favouriteFor, topManagers } from '../engine/managers';
import { nationName } from '../engine/nations';
import { seasonLabel, type GameState } from '../engine/types';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

const stars = (rep: number) => Math.max(0.5, Math.min(5, Math.round(((rep - 30) / 60) * 10) / 2));
const LEFT: Record<string, string> = { sacked: 'Sacked', resigned: 'Resigned', moved: 'Moved on' };

function ClubCell({ g, id, go }: { g: GameState; id: string; go?: (s: Screen, id?: string) => void }) {
  const c = g.clubs[id];
  const inner = <><img className="club-badge" src={badgeUrl(c)} alt="" /><strong>{c.name}</strong></>;
  return go ? <button type="button" className="pg-link club-cell" onClick={() => go('club', id)}>{inner}</button> : <span className="club-cell">{inner}</span>;
}

export default function Career({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const c = g.career ?? career(structuredClone(g));
  const [note, setNote] = useState('');
  const club = g.clubs[g.userClubId];
  const spell = currentSpell(g);
  const conf = boardConfidence(g, boardTarget(g, g.userClubId));
  const rep = managerReputation(g);
  // the ten most relevant: the biggest clubs that might realistically hire you
  const vacancies = c.vacancies.filter((id) => g.clubs[id] && id !== g.userClubId && g.clubs[id].reputation >= rep - 30)
    .sort((a, b) => g.clubs[b].reputation - g.clubs[a].reputation).slice(0, 10);

  const take = (id: string) => {
    if (!c.sacked && !window.confirm(`Leave ${club.name} for ${g.clubs[id].name}?`)) return;
    update((d) => acceptOffer(d, id));
    go('home');
  };
  const [interview, setInterview] = useState<{ id: string; answers: Array<number | undefined> } | null>(null);
  const [contractNote, setContractNote] = useState('');
  const money = (n: number) => FD.formatMoney(toCur(n, g.currency), g.currency);
  const wk = (n: number) => `${money(n)} a week`;
  const submitInterview = () => {
    if (!interview) return;
    const id = interview.id, answers = interview.answers.map((a) => a ?? 0);
    let ok = false;
    update((d) => { ok = interviewForJob(d, id, baseTarget(d, id).pos, answers); });
    // the update runs synchronously inside React's state setter; read the result on the next tick
    setTimeout(() => {
      setInterview(null);
      if (ok) go('home');
      else setNote(`${g.clubs[id].name} thanked you for your time and went with another candidate.`);
    }, 0);
  };
  const askContract = () => {
    let r = { ok: false, text: '' };
    update((d) => { r = requestNewContract(d, conf); });
    setTimeout(() => setContractNote(r.text), 0);
  };

  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div>
        <h1 className="pg-title">Manager career</h1>
        <p className="hm-note" style={{ margin: 0 }}>{g.managerName} · reputation {rep} · {g.manager.w} won, {g.manager.d} drawn, {g.manager.l} lost · {g.manager.trophies.length} trophies</p>
      </div>

      {c.sacked ? (
        <section className="pg-card career-out" role="status">
          <h2 className="pg-title" style={{ margin: 0 }}>Out of work</h2>
          <p className="hm-note" style={{ margin: 0 }}>Your time at {club.name} is over. Take one of the offers below, or apply for a vacancy, to carry on. Nothing is played until you have a new club.</p>
        </section>
      ) : (
        <section className="pg-card intl-hero">
          <img className="club-badge club-badge--lg" src={badgeUrl(club)} alt="" />
          <div style={{ flex: 1 }}>
            <p className="pg-h" style={{ margin: 0 }}>Manager since {seasonLabel(spell.from)}</p>
            <h2 className="pg-title" style={{ margin: '2px 0' }}>{club.name}</h2>
            <p className="hm-note" style={{ margin: 0 }}>{clubLine(g, club.id).league} · {spell.w}–{spell.d}–{spell.l} · {spell.trophies} trophies here · Board: {confidenceWord(conf)}</p>
            <p className="hm-note" style={{ margin: '4px 0 0' }}>Contract: {c.contract ? `${wk(c.contract.wage)} until ${seasonLabel(c.contract.until)}` : '—'} · career earnings {money(c.earnings ?? 0)}
              {' '}<button type="button" className="pg-link" onClick={askContract}>Ask for a new contract</button></p>
            {contractNote ? <p className="fd-warn" role="status" style={{ margin: '4px 0 0' }}>{contractNote}</p> : null}
            <span className="fd-meter fd-meter--wide" style={{ marginTop: 8 }}><span className={`fd-meter__bar fd-meter__bar--${conf >= 60 ? 'low' : conf >= 40 ? 'medium' : 'high'}`} style={{ width: conf + '%' }} /></span>
          </div>
          <FD.Button variant="ghost" onClick={() => { if (window.confirm(`Resign as ${club.name} manager? You'll have to find a new club before playing on.`)) update((d) => resign(d)); }}>Resign</FD.Button>
        </section>
      )}

      <section className="pg-card">
        <h2 className="pg-h">Coaching style</h2>
        <div className="fd-seg" role="radiogroup" aria-label="Coaching style" style={{ flexWrap: 'wrap' }}>
          {STYLES.map((st) => <button key={st.id} type="button" role="radio" aria-checked={styleOf(g) === st.id} disabled={g.styleChanged === g.year && styleOf(g) !== st.id} className={'fd-seg__opt' + (styleOf(g) === st.id ? ' is-on' : '')}
            onClick={() => { if (styleOf(g) !== st.id && window.confirm(`Switch to ${st.title}? You can change your style once a season.`)) update((d) => { setStyle(d, st.id); }); }}>{st.title}</button>)}
        </div>
        <p className="hm-note" style={{ marginBottom: 0 }}>{STYLES.find((x) => x.id === styleOf(g))!.text}{g.styleChanged === g.year ? ' Changed this season.' : ' You can change it once a season.'}</p>
      </section>

      <section className="pg-card">
        <h2 className="pg-h">Offers</h2>
        {c.offers.length ? (
          <table className="fd-mini"><tbody>
            {c.offers.filter((o) => g.clubs[o.clubId]).map((o) => {
              const line = clubLine(g, o.clubId);
              return (
                <tr key={o.clubId}>
                  <td><ClubCell g={g} go={go} id={o.clubId} /></td>
                  <td className="fd-muted">{line.league} · {line.country}</td>
                  <td><FD.StarRating value={stars(line.reputation)} size={13} /></td>
                  <td className="fd-muted">{wk(managerWage(g, o.clubId))} · 3 seasons</td>
                  <td style={{ textAlign: 'right' }}><FD.Button onClick={() => take(o.clubId)}>Accept</FD.Button></td>
                </tr>
              );
            })}
          </tbody></table>
        ) : <p className="hm-note">No offers right now. A good season brings offers from bigger clubs.</p>}
      </section>

      <section className="pg-card">
        <h2 className="pg-h">Vacancies</h2>
        <p className="hm-note" style={{ marginTop: 0 }}>Clubs without a manager. You can apply once to each and the club answers straight away, weighing you against the best manager out of work. Clubs fill their jobs within a few weeks, so don't wait too long.</p>
        {note && <p className="fd-warn" role="status">{note}</p>}
        {interview && g.clubs[interview.id] ? (() => {
          const target = baseTarget(g, interview.id).pos;
          const qs = interviewQuestions(g, interview.id, target);
          const done = qs.every((_, i) => interview.answers[i] !== undefined);
          return (
            <div className="pg-card interview" role="group" aria-label={`Interview at ${g.clubs[interview.id].name}`}>
              <h3 className="pg-title" style={{ margin: 0, fontSize: 20 }}>Interview: {g.clubs[interview.id].name}</h3>
              <p className="hm-note" style={{ margin: '4px 0 10px' }}>The board meets you. On offer: {wk(managerWage(g, interview.id))} for two seasons. Promise more than they expect and they'll hold you to it in your first season.</p>
              {qs.map((q, i) => (
                <fieldset key={i} className="interview__q">
                  <legend>{q.q}</legend>
                  {q.options.map((o, j) => (
                    <label key={j} className="interview__opt"><input type="radio" name={`iq${i}`} checked={interview.answers[i] === j}
                      onChange={() => setInterview({ ...interview, answers: Object.assign([...interview.answers], { [i]: j }) })} /> {o.label}</label>
                  ))}
                </fieldset>
              ))}
              <div className="pg-row" style={{ marginTop: 8 }}>
                <FD.Button disabled={!done} onClick={submitInterview}>Give your answers</FD.Button>
                <FD.Button variant="ghost" onClick={() => setInterview(null)}>Cancel</FD.Button>
              </div>
            </div>
          );
        })() : null}
        {vacancies.length ? (
          <table className="fd-mini"><tbody>
            {vacancies.map((id) => {
              const line = clubLine(g, id);
              const p = applyChance(g, id);
              return (
                <tr key={id}>
                  <td><ClubCell g={g} go={go} id={id} /></td>
                  <td className="fd-muted">{line.league} · {line.country}</td>
                  <td><FD.StarRating value={stars(line.reputation)} size={13} /></td>
                  <td className="fd-muted">{(() => { const f = favouriteFor(g, id); return f ? <>Rival: {f.name} <span title="Reputation">({f.rep})</span></> : 'No strong rival'; })()}</td>
                  <td className="fd-muted">{p >= 0.7 ? 'Good chance' : p >= 0.35 ? 'Possible' : 'Long shot'}</td>
                  <td style={{ textAlign: 'right' }}><FD.Button variant="secondary" onClick={() => { setNote(''); setInterview({ id, answers: [] }); }}>Apply</FD.Button></td>
                </tr>
              );
            })}
          </tbody></table>
        ) : <p className="hm-note">No vacancies yet. They open at the end of each season.</p>}
      </section>

      <section className="pg-card">
        <h2 className="pg-h">Achievements · {Object.keys(g.achievements ?? {}).length} of {ACHIEVEMENTS.length}</h2>
        {(['Results', 'Trophies', 'Club', 'Career'] as const).map((group) => (
          <div key={group} className="ach-group">
            <h3 className="ach-h">{group}</h3>
            <div className="ach-grid">
              {ACHIEVEMENTS.filter((a) => a.group === group).map((a) => {
                const when = g.achievements?.[a.id];
                return (
                  <div key={a.id} className={'ach' + (when ? ' is-on' : '')} title={a.desc}>
                    <strong>{a.title}</strong>
                    <span>{a.desc}</span>
                    <em>{when ? `Unlocked ${when}` : 'Locked'}</em>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {g.manager.awards?.length ? (
        <section className="pg-card intl-line">
          <h2 className="pg-h" style={{ margin: 0 }}>Your awards</h2>
          {g.manager.awards.map((x, i) => <span key={i} className="aw-chip aw-chip--gold">{x}</span>)}
        </section>
      ) : null}
      <Managers g={g} rep={rep} />

      <section className="pg-card">
        <h2 className="pg-h">Clubs managed</h2>
        <table className="fd-mini"><thead><tr><th>Club</th><th>Seasons</th><th className="fd-num">W</th><th className="fd-num">D</th><th className="fd-num">L</th><th className="fd-num">Trophies</th><th>Left</th></tr></thead><tbody>
          {c.spells.map((sp, i) => {
            const open = i === c.spells.length - 1 && sp.to === undefined;
            const row = open ? spell : sp;
            return (
              <tr key={i}>
                <td>{g.clubs[sp.clubId] ? <ClubCell g={g} go={go} id={sp.clubId} /> : sp.club}</td>
                <td className="fd-muted">{seasonLabel(sp.from)}{sp.to !== undefined ? ` – ${seasonLabel(sp.to)}` : ' – now'}</td>
                <td className="fd-num">{row.w}</td><td className="fd-num">{row.d}</td><td className="fd-num">{row.l}</td><td className="fd-num">{row.trophies}</td>
                <td className="fd-muted">{open ? (c.sacked ? (sp.left === 'resigned' ? 'Resigned' : 'Sacked') : 'Current') : LEFT[sp.left ?? ''] ?? ''}</td>
              </tr>
            );
          })}
        </tbody></table>
      </section>
    </div>
  );
}

/** The world's best managers by reputation, with you placed among them. */
function Managers({ g, rep }: { g: GameState; rep: number }) {
  const [all, setAll] = useState(false);
  const list = topManagers(g, all ? 50 : 12);
  const you = { you: true as const, rep };
  const rows: Array<typeof you | ReturnType<typeof topManagers>[number]> = [...list];
  const at = rows.findIndex((x) => x.rep < rep);
  if (at >= 0) rows.splice(at, 0, you); else if (all) rows.push(you);
  const free = Object.values(g.managers?.all ?? {}).filter((m) => !m.clubId).length;
  return (
    <section className="pg-card">
      <h2 className="pg-h">The world's top managers</h2>
      <p className="hm-note" style={{ marginTop: 0 }}>Ranked by reputation (1–100), which decides who gets the big jobs. {free} managers are out of work.</p>
      <div className="mg-scroll">
        <table className="fd-mini"><thead><tr><th className="fd-num">#</th><th>Manager</th><th>Club</th><th className="fd-num">Age</th><th className="fd-num">W-D-L</th><th className="fd-num">Trophies</th><th className="fd-num">Rep</th></tr></thead><tbody>
          {rows.map((m, i) => 'you' in m ? (
            <tr key="you"><td className="fd-num fd-muted">{i + 1}</td><td><strong className="fd-gold">{g.managerName} (you)</strong></td><td>{g.clubs[g.userClubId].name}</td><td className="fd-num">—</td>
              <td className="fd-num">{g.manager.w}-{g.manager.d}-{g.manager.l}</td><td className="fd-num">{g.manager.trophies.length}</td><td className="fd-num"><strong>{m.rep}</strong></td></tr>
          ) : (
            <tr key={m.id} title={m.trophies.slice(0, 6).join(', ')}>
              <td className="fd-num fd-muted">{i + 1}</td>
              <td>{m.name} <span className="fd-muted">· {nationName(m.nation)}</span></td>
              <td>{m.clubId ? g.clubs[m.clubId]?.name : <span className="fd-muted">Out of work</span>}</td>
              <td className="fd-num">{m.age}</td>
              <td className="fd-num">{m.w}-{m.d}-{m.l}</td>
              <td className="fd-num">{m.trophies.length}</td>
              <td className="fd-num">{m.rep}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <FD.Button size="sm" variant="secondary" onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : 'Show top 50'}</FD.Button>
    </section>
  );
}
