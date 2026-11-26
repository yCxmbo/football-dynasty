import { useMemo, useState } from 'react';
import { FD } from '../ds';
import { groupTable, nationRanking, nextTournaments, type Tournament } from '../engine/international';
import { NATION, nationName } from '../engine/nations';
import { createRng } from '../engine/rng';
import type { GameState } from '../engine/types';
import { badgeUrl } from './badge';
import type { Screen } from './shared';
import NationalTeam from './NationalTeam';

const KNOWN_HOSTS: Record<string, string> = { 'FIFA World Cup 2026': 'USA, Mexico and Canada', 'FIFA World Cup 2030': 'Spain, Portugal and Morocco', 'FIFA World Cup 2034': 'Saudi Arabia', 'UEFA Euro 2028': 'the UK and Ireland', 'UEFA Euro 2032': 'Italy and Turkey', 'Africa Cup of Nations 2027': 'Kenya, Uganda and Tanzania', 'AFC Asian Cup 2027': 'Saudi Arabia' };
const KO_ORDER = ['Final', 'Semi-final', 'Quarter-final', 'Round of 16', 'Round of 32'];

const flag = (code: string) => badgeUrl({ id: `nation-${code}`, short: code, colours: NATION[code]?.colours });
function Nation({ code, bold }: { code: string; bold?: boolean }) {
  return <span className="club-cell" style={{ fontWeight: bold ? 700 : 400 }}><img className="club-badge" src={flag(code)} alt="" />{nationName(code)}</span>;
}
const stars = (strength: number) => Math.max(0.5, Math.min(5, Math.round(((strength - 110) / 12) * 2) / 2));

function TournamentView({ g, t, go }: { g: GameState; t: Tournament; go: (s: Screen, id?: string) => void }) {
  const fin = t.matches[t.matches.length - 1];
  const mine = Object.entries(t.squads).flatMap(([code, ids]) => ids.filter((id) => g.players[id]?.clubId === g.userClubId).map((id) => ({ id, code })));
  const reached = (code: string) => {
    if (code === t.winner) return 'Winners';
    if (code === t.runnerUp) return 'Runners-up';
    const ko = t.matches.filter((m) => m.stage !== 'Group' && (m.h === code || m.a === code));
    return ko.length ? `Out in the ${ko[ko.length - 1].stage.toLowerCase()}` : 'Group stage';
  };
  const ko = KO_ORDER.filter((r) => t.matches.some((m) => m.stage === r));
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <section className="pg-card intl-hero">
        <img className="club-badge club-badge--lg" src={flag(t.winner)} alt="" />
        <div>
          <p className="pg-h" style={{ margin: 0 }}>{t.name} champions</p>
          <h2 className="pg-title" style={{ margin: '2px 0' }}>{nationName(t.winner)}</h2>
          <p className="hm-note" style={{ margin: 0 }}>
            Beat {nationName(t.runnerUp)} {fin.h === t.winner ? `${fin.s[0]}–${fin.s[1]}` : `${fin.s[1]}–${fin.s[0]}`}{fin.p ? ` on penalties (${fin.h === t.winner ? `${fin.p[0]}–${fin.p[1]}` : `${fin.p[1]}–${fin.p[0]}`})` : ''} in the final.
            {t.topScorer ? ` Golden Boot: ${t.topScorer.name} (${nationName(t.topScorer.nation)}), ${t.topScorer.goals} goals.` : ''}
            {t.bestPlayer ? ` Player of the tournament: ${t.bestPlayer.name}.` : ''}
          </p>
        </div>
      </section>

      <section className="pg-card">
        <h2 className="pg-h">Our players at the {t.name}</h2>
        {mine.length ? (
          <table className="fd-mini"><tbody>
            {mine.map(({ id, code }) => (
              <tr key={id} onClick={() => go('player', id)} style={{ cursor: 'pointer' }}>
                <td>{g.players[id].name}</td><td><Nation code={code} /></td><td className="fd-muted">{reached(code)}</td>
              </tr>
            ))}
          </tbody></table>
        ) : <p className="hm-note">None of our players were called up.</p>}
      </section>

      {ko.map((r) => (
        <section key={r} className="pg-card">
          <h2 className="pg-h">{r}</h2>
          <table className="fd-mini cup-ties"><tbody>
            {t.matches.filter((m) => m.stage === r).map((m, i) => {
              const w = m.s[0] !== m.s[1] ? (m.s[0] > m.s[1] ? m.h : m.a) : m.p && m.p[1] > m.p[0] ? m.a : m.h;
              return (
                <tr key={i}>
                  <td className="cup-home"><span className="club-cell club-cell--end" style={{ fontWeight: w === m.h ? 700 : 400 }}>{nationName(m.h)}<img className="club-badge" src={flag(m.h)} alt="" /></span></td>
                  <td className="cup-score">{m.s[0]}–{m.s[1]}{m.p ? <span className="fd-muted"> ({m.p[0]}–{m.p[1]} p)</span> : null}</td>
                  <td><Nation code={m.a} bold={w === m.a} /></td>
                </tr>
              );
            })}
          </tbody></table>
        </section>
      ))}

      <div className="cc-groups">
        {t.groups.map((_, gi) => (
          <FD.LeagueTable key={gi} compact title={`Group ${'ABCDEFGHIJKL'[gi]}`} zones={{ promotion: 2, promotionLabel: 'Knockout stage' }}
            rows={groupTable(t, gi).map((r) => ({ clubId: r.code, club: nationName(r.code), p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.pts, form: [], isUser: false }))} />
        ))}
      </div>
    </div>
  );
}

export default function International({ g, go, update }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void }) {
  const past = (g.internationals ?? []).slice().reverse();
  const [tab, setTab] = useState<string>(past[0]?.name ?? 'ranking');
  const ranking = useMemo(() => nationRanking(g, createRng(g.year * 100 + 7)), [g.year, g.internationals?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = nextTournaments(g.year);
  const nextLabel = next.names.map((n) => `the ${n} ${next.year}${KNOWN_HOSTS[`${n} ${next.year}`] ? ` (in ${KNOWN_HOSTS[`${n} ${next.year}`]})` : ''}`).join(' and ');
  const ours = ranking.flatMap((q) => q.called.filter((id) => g.players[id]?.clubId === g.userClubId).map((id) => ({ id, code: q.code })));
  const current = past.find((t) => t.name === tab);
  const rank = (code: string) => ranking.findIndex((q) => q.code === code) + 1;

  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div>
        <h1 className="pg-title">International football</h1>
        <p className="hm-note" style={{ margin: 0 }}>
          Next: {nextLabel}, in the summer after the {next.year - 1}/{String(next.year).slice(2)} season. National teams pick the best players of their nationality in the world, wherever they play.
          {ours.length ? ` ${ours.length} of our players would be called up today.` : ''}
        </p>
      </div>

      <div className="fd-seg" role="tablist" aria-label="Tournaments" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        <button type="button" role="tab" aria-selected={tab === 'ranking'} className={'fd-seg__opt' + (tab === 'ranking' ? ' is-on' : '')} onClick={() => setTab('ranking')}>World ranking</button>
        <button type="button" role="tab" aria-selected={tab === 'job'} className={'fd-seg__opt' + (tab === 'job' ? ' is-on' : '')} onClick={() => setTab('job')}>{g.nationalJob ? nationName(g.nationalJob.code) : 'National team'}</button>
        {past.map((t) => <button key={t.name} type="button" role="tab" aria-selected={tab === t.name} className={'fd-seg__opt' + (tab === t.name ? ' is-on' : '')} onClick={() => setTab(t.name)}>{t.name}</button>)}
        {past.length > 0 && <button type="button" role="tab" aria-selected={tab === 'honours'} className={'fd-seg__opt' + (tab === 'honours' ? ' is-on' : '')} onClick={() => setTab('honours')}>Roll of honour</button>}
      </div>

      {current ? <TournamentView g={g} t={current} go={go} />
        : tab === 'job' ? <NationalTeam g={g} go={go} update={update} ranking={ranking.map((q) => q.code)} />
        : tab === 'honours' ? (
          <section className="pg-card">
            <table className="fd-mini"><thead><tr><th>Tournament</th><th>Winners</th><th>Runners-up</th><th>Golden Boot</th></tr></thead><tbody>
              {past.map((t) => (
                <tr key={t.name}><td>{t.name}</td><td><Nation code={t.winner} bold /></td><td><Nation code={t.runnerUp} /></td><td className="fd-muted">{t.topScorer ? `${t.topScorer.name} (${t.topScorer.goals})` : '—'}</td></tr>
              ))}
            </tbody></table>
          </section>
        ) : (
          <div className="pg-grid2">
            <section className="pg-card">
              <h2 className="pg-h">Strongest national teams today</h2>
              <table className="fd-mini"><thead><tr><th className="fd-num">#</th><th>Nation</th><th>Confederation</th><th>Strength</th><th>Best player</th></tr></thead><tbody>
                {ranking.slice(0, 40).map((q, i) => {
                  const star = q.players.filter((p) => !p.id.startsWith('nt-')).sort((a, b) => b.ability - a.ability)[0];
                  return (
                    <tr key={q.code}>
                      <td className="fd-num">{i + 1}</td><td><Nation code={q.code} /></td><td className="fd-muted">{NATION[q.code].confed}</td>
                      <td><FD.StarRating value={stars(q.strength)} size={13} /></td>
                      <td>{star ? <button className="pg-link" style={{ textDecoration: 'none' }} onClick={() => go('player', star.id)}>{star.name}</button> : <span className="fd-muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody></table>
            </section>
            <section className="pg-card">
              <h2 className="pg-h">Our internationals</h2>
              {ours.length ? (
                <table className="fd-mini"><tbody>
                  {ours.map(({ id, code }) => {
                    const p = g.players[id];
                    return (
                      <tr key={id} onClick={() => go('player', id)} style={{ cursor: 'pointer' }}>
                        <td>{p.name}</td><td><Nation code={code} /></td><td className="fd-muted fd-num">#{rank(code)}</td>
                        <td className="fd-muted fd-num">{p.intl ? `${p.intl.caps} caps, ${p.intl.goals} goals` : 'Uncapped here'}</td>
                      </tr>
                    );
                  })}
                </tbody></table>
              ) : <p className="hm-note">No one in our squad would make their national team's 26 today.</p>}
            </section>
          </div>
        )}
    </div>
  );
}
