import { useState } from 'react';
import { FD } from '../ds';
import { nationName } from '../engine/nations';
import { ROLES, developmentBoost, hire, injuryLengthFactor, maxRatingFor, moraleRecoveryChance, recoveryBonus, scoutPerMatchday, staffWageBill, youthPotentialBonus, type StaffRole } from '../engine/staff';
import type { GameState } from '../engine/types';
import { toCur } from '../store';

const stars = (r: number) => Math.max(0.5, Math.round(r / 2) / 2);
const pct = (x: number) => `${x >= 0 ? '+' : ''}${Math.round(x * 100)}%`;

/** What this rating does now, in words. */
function impact(g: GameState, role: StaffRole) {
  switch (role) {
    case 'coach': return `Development ${pct(developmentBoost(g) - 1)}`;
    case 'fitness': return `Recovery ${recoveryBonus(g) >= 0 ? '+' : ''}${recoveryBonus(g).toFixed(1)} per day`;
    case 'physio': return `Injury length ${pct(injuryLengthFactor(g) - 1)}`;
    case 'scout': return `${scoutPerMatchday(g)}% knowledge a matchday`;
    case 'youth': return `Intake potential ${youthPotentialBonus(g) >= 0 ? '+' : ''}${Math.round(youthPotentialBonus(g))}`;
    case 'assistant': return `${Math.round(moraleRecoveryChance(g) * 100)}% weekly morale recovery`;
  }
}

export default function Staff({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const [role, setRole] = useState<StaffRole>('coach');
  const [note, setNote] = useState('');
  const club = g.clubs[g.userClubId];
  const top = maxRatingFor(club.reputation);
  const cur = g.currency;
  const money = (n: number) => FD.formatMoney(toCur(n, cur), cur);
  const pool = (g.staffPool ?? []).filter((m) => m.role === role);
  const current = g.staff?.[role];
  return (
    <div className="pg-stack" style={{ gap: 16 }}>
      <div>
        <h1 className="pg-title">Staff</h1>
        <p className="hm-note" style={{ margin: 0 }}>Staff wages {money(staffWageBill(g))} a week. Rated 1–20: 10 is average, better staff help and weaker ones hold the club back. {club.name} can attract staff rated up to {top}.</p>
      </div>

      <section className="pg-card">
        <table className="fd-mini staff-table"><thead><tr><th>Role</th><th>Name</th><th>Rating</th><th>Effect now</th><th className="fd-num">Wage</th></tr></thead><tbody>
          {ROLES.map((r) => {
            const m = g.staff?.[r.role];
            return (
              <tr key={r.role} className={r.role === role ? 'is-on' : undefined} onClick={() => { setRole(r.role); setNote(''); }} style={{ cursor: 'pointer' }}>
                <td><strong>{r.title}</strong><div className="fd-muted" style={{ fontSize: 12 }}>{r.effect}</div></td>
                <td>{m ? <>{m.name}{m.legend ? <span className="fd-tag fd-tag--gold" style={{ marginLeft: 6 }}>Club legend</span> : null}<div className="fd-muted" style={{ fontSize: 12 }}>{nationName(m.nationality)} · {m.age}</div></> : <span className="fd-muted">Vacant</span>}</td>
                <td>{m ? <span title={`${m.rating}/20`}><FD.StarRating value={stars(m.rating)} size={13} /> <span className="fd-muted">{m.rating}</span></span> : '—'}</td>
                <td className="fd-muted">{impact(g, r.role)}</td>
                <td className="fd-num">{m ? money(m.wage) : '—'}</td>
              </tr>
            );
          })}
        </tbody></table>
      </section>

      <section className="pg-card">
        <h2 className="pg-h">Candidates · {ROLES.find((r) => r.role === role)!.title}</h2>
        <p className="hm-note" style={{ marginTop: 0 }}>
          {current ? `Hiring replaces ${current.name} (${current.rating}), who is paid off with eight weeks' wages (${money(current.wage * 8)}).` : 'The role is vacant.'} New candidates come onto the market each summer.
        </p>
        {note && <p className="fd-warn" role="alert">{note}</p>}
        {pool.length ? (
          <table className="fd-mini"><tbody>
            {pool.map((m) => (
              <tr key={m.id}>
                <td>{m.name}{m.legend ? <span className="fd-tag fd-tag--gold" style={{ marginLeft: 6 }} title="A club legend: the fans will love it">Club legend</span> : null}<div className="fd-muted" style={{ fontSize: 12 }}>{nationName(m.nationality)} · {m.age}</div></td>
                <td><FD.StarRating value={stars(m.rating)} size={13} /> <span className="fd-muted">{m.rating}</span></td>
                <td className="fd-num">{money(m.wage)}/wk</td>
                <td style={{ textAlign: 'right' }}>
                  {m.rating > top ? <span className="fd-muted">Wants a bigger club</span>
                    : <FD.Button size="sm" variant={current && m.rating <= current.rating ? 'ghost' : 'primary'} onClick={() => {
                        let err: string | null = null;
                        update((d) => { err = hire(d, m.id); });
                        setTimeout(() => setNote(err ?? ''), 0);
                      }}>Hire</FD.Button>}
                </td>
              </tr>
            ))}
          </tbody></table>
        ) : <p className="hm-note">No candidates for this role until the summer.</p>}
      </section>
    </div>
  );
}
