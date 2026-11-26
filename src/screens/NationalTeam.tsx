import { useMemo } from 'react';
import { FD } from '../ds';
import { FORMATIONS, type Formation } from '../engine/match';
import { nextTournaments } from '../engine/international';
import { MAX_SQUAD, autoPick, candidates, jobOffers, managerReputation, reputationNeeded, resignJob, setNationalFormation, takeJob, toggleSelection } from '../engine/nationaljob';
import { NATION, nationName } from '../engine/nations';
import type { GameState, Player } from '../engine/types';
import { badgeUrl } from './badge';
import type { Screen } from './shared';

const flag = (code: string) => badgeUrl({ id: `nation-${code}`, short: code, colours: NATION[code]?.colours });
const stars = (ability: number) => Math.max(0.5, Math.min(5, Math.round(ability / 20) / 2));

function PlayerRows({ g, list, picked, onToggle, go, full }: { g: GameState; list: Player[]; picked: Set<string>; onToggle: (id: string) => void; go: (s: Screen, id?: string) => void; full: boolean }) {
  return (
    <table className="fd-mini nt-table"><tbody>
      {list.map((p) => {
        const on = picked.has(p.id);
        return (
          <tr key={p.id}>
            <td className="fd-muted" style={{ width: 36 }}>{p.pos}</td>
            <td><button className="pg-link" style={{ textDecoration: 'none' }} onClick={() => go('player', p.id)}>{p.name}</button>{p.injuredFor > 0 ? <span className="fd-warn"> · injured</span> : null}</td>
            <td className="fd-muted nt-club">{g.clubs[p.clubId]?.name ?? 'Free agent'}</td>
            <td className="fd-num fd-muted">{p.age}</td>
            <td><FD.StarRating value={stars(p.ability)} size={12} /></td>
            <td style={{ textAlign: 'right' }}>
              <FD.Button variant={on ? 'secondary' : 'ghost'} onClick={() => onToggle(p.id)} disabled={!on && full}>{on ? 'Drop' : 'Pick'}</FD.Button>
            </td>
          </tr>
        );
      })}
    </tbody></table>
  );
}

export default function NationalTeam({ g, go, update, ranking }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void; ranking: string[] }) {
  const job = g.nationalJob;
  const rep = managerReputation(g);
  const offers = useMemo(() => jobOffers(g, ranking), [g, ranking]);
  const pool = useMemo(() => (job ? candidates(g, job.code).slice(0, 70) : []), [g, job]);
  const next = nextTournaments(g.year);

  if (!job) {
    const rank = (code: string) => ranking.indexOf(code) + 1;
    return (
      <div className="pg-stack" style={{ gap: 16 }}>
        <section className="pg-card">
          <h2 className="pg-h">Manage a national team</h2>
          <p className="hm-note" style={{ marginTop: 0 }}>
            You can lead a nation at the {next.names.join(' and ') || 'next tournament'} alongside your club job: you pick the 26 and the formation, and the team plays the summer tournaments.
            Federations hire on reputation. Yours is <strong>{rep}</strong>; the top five nations ask for {reputationNeeded(1)}, the top twelve {reputationNeeded(6)}, the top 25 {reputationNeeded(13)}.
            Win trophies to raise it. A top nation that goes out in the group stage, or fails to qualify, will dismiss you.
          </p>
          {offers.length ? (
            <table className="fd-mini"><tbody>
              {offers.map((o) => (
                <tr key={o.code}>
                  <td><span className="club-cell"><img className="club-badge" src={flag(o.code)} alt="" />{nationName(o.code)}</span></td>
                  <td className="fd-muted">{NATION[o.code].confed}</td>
                  <td className="fd-muted fd-num">World #{rank(o.code)}</td>
                  <td style={{ textAlign: 'right' }}><FD.Button onClick={() => update((d) => takeJob(d, o.code))}>Take the job</FD.Button></td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="hm-note">No national team would appoint you yet.</p>}
        </section>
      </div>
    );
  }

  const picked = new Set(job.squad);
  const sel = job.squad.map((id) => g.players[id]).filter(Boolean).sort((a, b) => ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'].indexOf(a.pos) - ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'].indexOf(b.pos) || b.ability - a.ability);
  const gks = sel.filter((p) => p.pos === 'GK').length;
  const full = job.squad.length >= MAX_SQUAD;
  const others = pool.filter((p) => !picked.has(p.id));
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <section className="pg-card intl-hero">
        <img className="club-badge club-badge--lg" src={flag(job.code)} alt="" />
        <div style={{ flex: 1 }}>
          <p className="pg-h" style={{ margin: 0 }}>National team · since {job.since + 1}</p>
          <h2 className="pg-title" style={{ margin: '2px 0' }}>{nationName(job.code)}</h2>
          <p className="hm-note" style={{ margin: 0 }}>
            World #{ranking.indexOf(job.code) + 1} · Record {job.w}–{job.d}–{job.l}
            {job.tournaments.length ? ` · ${job.tournaments.map((t) => `${t.name}: ${t.reached}`).join(' · ')}` : ''}
            {next.names.length ? ` · Next: ${next.names.filter((n) => (n === 'UEFA Euro' ? NATION[job.code].confed === 'UEFA' : n === 'Copa América' ? ['CONMEBOL', 'CONCACAF'].includes(NATION[job.code].confed) : true)).join(' and ') || 'no tournament for your confederation'} ${next.year}` : ''}
          </p>
        </div>
        <FD.Button variant="ghost" onClick={() => { if (confirm(`Resign as ${nationName(job.code)} manager?`)) update((d) => resignJob(d)); }}>Resign</FD.Button>
      </section>

      <div className="pg-row" style={{ flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
        <FD.Field label="Formation">
          <FD.Select value={job.formation} label="Formation" options={(Object.keys(FORMATIONS) as Formation[]).map((f) => ({ value: f, label: f }))} onChange={(v: string) => update((d) => setNationalFormation(d, v as Formation))} />
        </FD.Field>
        <FD.Button variant="secondary" onClick={() => update((d) => { if (d.nationalJob) d.nationalJob.squad = autoPick(d, d.nationalJob.code); })}>Pick the best 26</FD.Button>
        <span className="hm-note">{job.squad.length}/{MAX_SQUAD} picked · {gks} goalkeeper{gks === 1 ? '' : 's'}{gks < 3 ? ' (take three)' : ''}. Injured or retired picks are replaced at the tournament by the best available.</span>
      </div>

      <div className="pg-grid2 nt-grid">
        <section className="pg-card">
          <h2 className="pg-h">Your squad</h2>
          {sel.length ? <PlayerRows g={g} list={sel} picked={picked} onToggle={(id) => update((d) => toggleSelection(d, id))} go={go} full={full} />
            : <p className="hm-note">Nobody picked yet.</p>}
        </section>
        <section className="pg-card">
          <h2 className="pg-h">Eligible players</h2>
          <PlayerRows g={g} list={others} picked={picked} onToggle={(id) => update((d) => toggleSelection(d, id))} go={go} full={full} />
        </section>
      </div>
    </div>
  );
}
