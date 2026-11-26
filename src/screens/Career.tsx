import { useState } from 'react';
import { FD } from '../ds';
import { acceptOffer, applyChance, applyForJob, boardConfidence, career, clubLine, confidenceWord, currentSpell, resign } from '../engine/career';
import { boardTarget } from '../engine/game';
import { ACHIEVEMENTS } from '../engine/achievements';
import { managerReputation } from '../engine/nationaljob';
import { seasonLabel, type GameState } from '../engine/types';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

const stars = (rep: number) => Math.max(0.5, Math.min(5, Math.round(((rep - 30) / 60) * 10) / 2));
const LEFT: Record<string, string> = { sacked: 'Sacked', resigned: 'Resigned', moved: 'Moved on' };

function ClubCell({ g, id }: { g: GameState; id: string }) {
  const c = g.clubs[id];
  return <span className="club-cell"><img className="club-badge" src={badgeUrl(c)} alt="" /><strong>{c.name}</strong></span>;
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
  const apply = (id: string) => {
    let ok = false;
    update((d) => { ok = applyForJob(d, id); });
    // the update runs synchronously inside React's state setter; read the result on the next tick
    setTimeout(() => {
      if (ok) go('home');
      else setNote(`${g.clubs[id].name} went with another candidate.`);
    }, 0);
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
            <span className="fd-meter fd-meter--wide" style={{ marginTop: 8 }}><span className={`fd-meter__bar fd-meter__bar--${conf >= 60 ? 'low' : conf >= 40 ? 'medium' : 'high'}`} style={{ width: conf + '%' }} /></span>
          </div>
          <FD.Button variant="ghost" onClick={() => { if (window.confirm(`Resign as ${club.name} manager? You'll have to find a new club before playing on.`)) update((d) => resign(d)); }}>Resign</FD.Button>
        </section>
      )}

      <section className="pg-card">
        <h2 className="pg-h">Offers</h2>
        {c.offers.length ? (
          <table className="fd-mini"><tbody>
            {c.offers.filter((o) => g.clubs[o.clubId]).map((o) => {
              const line = clubLine(g, o.clubId);
              return (
                <tr key={o.clubId}>
                  <td><ClubCell g={g} id={o.clubId} /></td>
                  <td className="fd-muted">{line.league} · {line.country}</td>
                  <td><FD.StarRating value={stars(line.reputation)} size={13} /></td>
                  <td style={{ textAlign: 'right' }}><FD.Button onClick={() => take(o.clubId)}>Accept</FD.Button></td>
                </tr>
              );
            })}
          </tbody></table>
        ) : <p className="hm-note">No offers right now. A good season brings offers from bigger clubs.</p>}
      </section>

      <section className="pg-card">
        <h2 className="pg-h">Vacancies</h2>
        <p className="hm-note" style={{ marginTop: 0 }}>Clubs that changed manager after last season. You can apply once to each; the club answers straight away.</p>
        {note && <p className="fd-warn" role="status">{note}</p>}
        {vacancies.length ? (
          <table className="fd-mini"><tbody>
            {vacancies.map((id) => {
              const line = clubLine(g, id);
              const p = applyChance(g, id);
              return (
                <tr key={id}>
                  <td><ClubCell g={g} id={id} /></td>
                  <td className="fd-muted">{line.league} · {line.country}</td>
                  <td><FD.StarRating value={stars(line.reputation)} size={13} /></td>
                  <td className="fd-muted">{p >= 0.7 ? 'Good chance' : p >= 0.35 ? 'Possible' : 'Long shot'}</td>
                  <td style={{ textAlign: 'right' }}><FD.Button variant="secondary" onClick={() => apply(id)}>Apply</FD.Button></td>
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

      <section className="pg-card">
        <h2 className="pg-h">Clubs managed</h2>
        <table className="fd-mini"><thead><tr><th>Club</th><th>Seasons</th><th className="fd-num">W</th><th className="fd-num">D</th><th className="fd-num">L</th><th className="fd-num">Trophies</th><th>Left</th></tr></thead><tbody>
          {c.spells.map((sp, i) => {
            const open = i === c.spells.length - 1 && sp.to === undefined;
            const row = open ? spell : sp;
            return (
              <tr key={i}>
                <td>{g.clubs[sp.clubId] ? <ClubCell g={g} id={sp.clubId} /> : sp.club}</td>
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
