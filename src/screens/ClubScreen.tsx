import { FD } from '../ds';
import { leagueDef, leagueTableOf } from '../engine/competitions';
import { ordinal, squadOf } from '../engine/game';
import { managerOf } from '../engine/managers';
import { managerReputation } from '../engine/nationaljob';
import { nationName } from '../engine/nations';
import { knowledgeOf } from '../engine/transfers';
import type { GameState } from '../engine/types';
import { toCur } from '../store';
import { badgeUrl } from './badge';
import { squadRow, type Screen } from './shared';

const stars = (rep: number) => Math.max(0.5, Math.min(5, Math.round(((rep - 30) / 60) * 10) / 2));

/** Any club: manager, squad, season so far, honours, recent seasons, money and rivals. */
export default function ClubScreen({ g, id, go }: { g: GameState; id?: string; go: (s: Screen, id?: string) => void }) {
  const club = id ? g.clubs[id] : undefined;
  if (!club) return <div className="pg-card pg-empty">Club not found.</div>;
  const mine = club.id === g.userClubId;
  const country = g.world.countries.find((k) => k.id === club.country)?.name ?? club.country;
  const league = leagueDef(g, club.league);
  const table = league ? leagueTableOf(g, league.id) : [];
  const row = table.findIndex((r) => r.clubId === club.id);
  const mgr = managerOf(g, club.id);
  const squad = squadOf(g, club.id).filter((p) => p.squad === 'First team').sort((a, b) => b.ability - a.ability);
  const cas = league ? Object.values(g.players).filter((p) => p.squad === 'First team' && g.clubs[p.clubId]?.league === league.id).map((p) => p.ability) : squad.map((p) => p.ability);
  const scale = cas.length ? { low: Math.min(...cas), high: Math.max(...cas) } : { low: 40, high: 180 };
  const wageBill = squadOf(g, club.id).reduce((a, p) => a + p.wage, 0);
  const value = squad.reduce((a, p) => a + p.value, 0);
  const played = g.fixtures.filter((f) => f.result && (f.homeId === club.id || f.awayId === club.id) && f.comp !== 'friendly').slice(-6).reverse();
  const next = g.fixtures.filter((f) => !f.result && (f.homeId === club.id || f.awayId === club.id)).sort((a, b) => a.matchday - b.matchday).slice(0, 3);
  const trophies = (g.trophies[club.id] ?? []).slice().sort((a, b) => b.seasons.length - a.seasons.length);
  const seasons = (g.history[club.id] ?? []).slice(0, 8);
  const rivals = (g.world.rivalries ?? []).filter((r) => r.a === club.id || r.b === club.id);
  const money = (n: number) => FD.formatMoney(toCur(n, g.currency), g.currency);
  const opp = (f: (typeof g.fixtures)[number]) => g.clubs[f.homeId === club.id ? f.awayId : f.homeId];
  const link = (cid: string) => {
    const c = g.clubs[cid];
    return c ? <button className="pg-link club-cell" onClick={() => go('club', cid)}><img className="club-badge" src={badgeUrl(c)} alt="" />{c.name}</button> : '?';
  };

  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div className="club-cell">
          <img className="club-badge club-badge--lg" src={badgeUrl(club)} alt="" />
          <div>
            <h1 className="pg-title">{club.name}{mine ? <span className="derby-tag">Your club</span> : null}</h1>
            <p className="pg-sub">{league?.name ?? 'No league'} · {country} · {club.stadium} ({club.capacity.toLocaleString('en-GB')})</p>
          </div>
        </div>
        <FD.StarRating value={stars(club.reputation)} size={16} />
      </div>

      <div className="pg-grid2 rec-grid">
        <section className="pg-card">
          <h2 className="pg-h">Manager</h2>
          {mine ? (
            <p style={{ margin: 0 }}><strong className="fd-gold">{g.managerName} (you)</strong> · reputation {managerReputation(g)} · {g.manager.w}-{g.manager.d}-{g.manager.l} · {g.manager.trophies.length} trophies</p>
          ) : mgr ? (
            <>
              <p style={{ margin: '0 0 6px' }}><strong>{mgr.name}</strong> <span className="fd-muted">· {nationName(mgr.nation)} · {mgr.age}</span></p>
              <p className="hm-note" style={{ margin: 0 }}>Reputation {mgr.rep} · league record before this season {mgr.w}-{mgr.d}-{mgr.l} · {mgr.trophies.length} trophies</p>
              {mgr.spells.length > 1 ? <p className="hm-note" style={{ margin: '6px 0 0' }}>Before: {mgr.spells.slice(1, 5).map((sp) => `${sp.club} (${sp.from}–${sp.to ?? ''}${sp.left === 'sacked' ? ', sacked' : ''})`).join(', ')}</p> : null}
              {mgr.trophies.length ? <p className="hm-note" style={{ margin: '6px 0 0' }}>Won: {mgr.trophies.slice(0, 5).join(', ')}</p> : null}
            </>
          ) : <p className="hm-note" style={{ margin: 0 }}>No manager: the club is looking for one{g.career?.vacancies.includes(club.id) ? '. You can apply on the Career screen.' : '.'}</p>}
        </section>

        <section className="pg-card">
          <h2 className="pg-h">This season</h2>
          {row >= 0 ? <p style={{ margin: '0 0 8px' }}><strong>{ordinal(row + 1)}</strong> in {league!.name} · {table[row].pts} pts from {table[row].p} games ({table[row].w}-{table[row].d}-{table[row].l})</p> : null}
          {played.length ? (
            <table className="fd-mini cs-results"><tbody>
              {played.map((f) => {
                const home = f.homeId === club.id;
                const [h, a] = f.result!.score;
                const us = home ? h : a, them = home ? a : h;
                const res = us > them || f.result!.winnerId === club.id ? 'W' : us < them || (f.result!.winnerId && f.result!.winnerId !== club.id) ? 'L' : 'D';
                return <tr key={f.id}><td><span className={`fd-form fd-form--${res}`}>{res}</span></td><td>{link(opp(f).id)}</td><td className="fd-muted">{home ? 'H' : 'A'}</td><td className="fd-num">{us}–{them}</td><td className="fd-muted">{g.comps[f.comp]?.short ?? ''}</td></tr>;
              })}
            </tbody></table>
          ) : <p className="hm-note" style={{ margin: 0 }}>No matches played yet.</p>}
          {next.length ? <p className="hm-note" style={{ margin: '8px 0 0' }}>Next: {next.map((f) => `${opp(f).name} (${f.homeId === club.id ? 'H' : 'A'}, ${g.comps[f.comp]?.short ?? ''})`).join(' · ')}</p> : null}
        </section>
      </div>

      <section>
        <h2 className="pg-h">First team · {squad.length} players · squad value {money(value)} · wages <FD.Money amount={toCur(wageBill, g.currency)} currency={g.currency} perWeek /></h2>
        <FD.SquadTable players={squad.map((p) => ({ ...squadRow(p, g.currency, g.year), knowledge: mine ? 100 : knowledgeOf(g, p) }))} currency={g.currency} scale={scale} onSelect={(p: { id: string }) => go('player', p.id)} />
        {!mine ? <p className="hm-note">Stars are your scouts' estimates where they don't know a player yet. Click a player for his profile, to scout him or make an offer.</p> : null}
      </section>

      <div className="pg-grid2 rec-grid">
        <section className="pg-card">
          <h2 className="pg-h">Honours</h2>
          {trophies.length ? (
            <table className="fd-mini"><tbody>
              {trophies.map((t) => <tr key={t.name}><td>{t.name}</td><td className="fd-muted">{t.seasons.slice(0, 4).join(', ')}{t.seasons.length > 4 ? '…' : ''}</td><td className="fd-num"><strong>{t.seasons.length}</strong></td></tr>)}
            </tbody></table>
          ) : <p className="hm-note" style={{ margin: 0 }}>Nothing won since your career began (honours are counted from then).</p>}
        </section>
        <section className="pg-card">
          <h2 className="pg-h">Recent seasons</h2>
          {seasons.length ? (
            <table className="fd-mini"><thead><tr><th>Season</th><th>League</th><th className="fd-num">Pos</th><th className="fd-num">Pts</th><th>Cup</th></tr></thead><tbody>
              {seasons.map((h) => <tr key={h.season}><td>{h.season}</td><td>{h.division}{h.movement ? <span className="fd-muted"> · {h.movement}</span> : null}</td><td className="fd-num">{h.pos}</td><td className="fd-num">{h.pts}</td><td className="fd-muted">{h.cup ?? ''}</td></tr>)}
            </tbody></table>
          ) : <p className="hm-note" style={{ margin: 0 }}>Finished seasons appear here.</p>}
        </section>
      </div>

      <div className="pg-grid2 rec-grid">
        <section className="pg-card">
          <h2 className="pg-h">Money</h2>
          <table className="fd-mini"><tbody>
            <tr><td>Balance</td><td className="fd-num">{money(club.balance)}</td></tr>
            <tr><td>Transfer budget</td><td className="fd-num">{money(club.transferBudget)}</td></tr>
            <tr><td>Wage bill</td><td className="fd-num"><FD.Money amount={toCur(wageBill, g.currency)} currency={g.currency} perWeek /></td></tr>
          </tbody></table>
        </section>
        <section className="pg-card">
          <h2 className="pg-h">Rivals</h2>
          {rivals.length ? (
            <table className="fd-mini"><tbody>
              {rivals.map((r) => {
                const other = r.a === club.id ? r.b : r.a;
                const d = g.derbies?.[r.name];
                const w = d ? (d.a === club.id ? d.aWins : d.bWins) : 0, l = d ? (d.a === club.id ? d.bWins : d.aWins) : 0;
                return <tr key={r.name}><td>{link(other)}</td><td className="fd-muted">{r.name}</td><td className="fd-num">{d ? `${w}W ${d.draws}D ${l}L` : 'Not played yet'}</td></tr>;
              })}
            </tbody></table>
          ) : <p className="hm-note" style={{ margin: 0 }}>No named derbies.</p>}
        </section>
      </div>
    </div>
  );
}
