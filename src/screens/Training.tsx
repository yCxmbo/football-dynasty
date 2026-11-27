import { FD } from '../ds';
import { squadOf, youthScale, leagueScale } from '../engine/game';
import { useState } from 'react';
import { DAYS, LEARNABLE, PRESETS, SESSIONS, effects, focusOptions, injuryRisk, positionLevel } from '../engine/training';
import { ROLE_BY_ID, ROLES } from '../engine/roles';
import type { Day, GameState, Intensity, Player, SessionType } from '../engine/types';

const focusLabel = (f?: string) => (f?.startsWith('role:') ? `${ROLE_BY_ID[f.slice(5)]?.name ?? 'Role'} (role)` : f);
/** Roles a player could train for: those that can be played in his position, and its wide/central equivalents. */
const rolesForPlayer = (p: Player) => ROLES.filter((r) => r.slots.includes(p.pos) || Object.keys(p.positions).some((x) => r.slots.includes(x) && ['natural', 'accomplished'].includes(p.positions[x])));

function devCard(g: GameState, p: Player) {
  const delta = p.ability - (p.caStart ?? p.ability);
  const changes = Object.entries(p.progress ?? {}).filter(([, d]) => d !== 0).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4)
    .map(([attr, d]) => ({ attr, delta: d, value: p.attributes[attr] }));
  return {
    name: p.name, pos: p.pos, age: p.age, squad: p.squad, contractType: p.contractType, ability: p.ability, potential: p.potential,
    trend: delta >= 2 ? 'up' : delta <= -2 ? 'down' : 'steady', period: 'season', changes, focus: focusLabel(g.training.focus[p.id]),
  };
}

export default function Training({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const t = g.training;
  const e = effects(t);
  const risk = injuryRisk(t);
  const mine = squadOf(g, g.userClubId);
  const developing = mine.filter((p) => p.age <= 24 && p.potential - p.ability >= 5).sort((a, b) => (b.potential - b.ability) - (a.potential - a.ability)).slice(0, 9);
  const presetName = Object.entries(PRESETS).find(([, w]) => JSON.stringify(w) === JSON.stringify(t.week))?.[0];
  const cycle = (day: Day, i: number) => update((d) => {
    const cur = d.training.week[day][i];
    if (cur === 'match') return;
    const next = SESSIONS[(SESSIONS.indexOf(cur) + 1) % SESSIONS.length] as SessionType;
    d.training.week[day][i] = next;
  });
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Training</h1><p className="pg-sub">Click a session to change it. Harder weeks develop players faster but raise the injury risk; days off keep morale up.</p></div>
        <div className="fd-seg" role="radiogroup" aria-label="Training plan">
          {Object.keys(PRESETS).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={presetName === k} className={'fd-seg__opt' + (presetName === k ? ' is-on' : '')}
              onClick={() => update((d) => { d.training.week = structuredClone(PRESETS[k]); })}>{k}</button>
          ))}
        </div>
      </div>
      <FD.TrainingSchedule week={t.week} intensity={t.intensity} onIntensityChange={(v: Intensity) => update((d) => { d.training.intensity = v; })}
        onEditSession={(day: Day, i: number) => cycle(day, i)} focus={presetName ? `${presetName} plan` : 'Custom plan'} />
      <div className="tg-effects">
        <div className="pg-card"><span className="pg-h">Development speed</span><strong className={e.development >= 1.05 ? 'fd-ok' : e.development < 0.95 ? 'fd-warn' : ''}>{Math.round(e.development * 100)}%</strong><span className="hm-note">of normal, from technical, fitness and tactical work</span></div>
        <div className="pg-card"><span className="pg-h">Injury risk</span><strong className={risk === 'high' ? 'fd-money--neg' : risk === 'medium' ? 'fd-warn' : 'fd-ok'}>{risk === 'high' ? 'High' : risk === 'medium' ? 'Some' : 'Low'}</strong><span className="hm-note">in matches and in training</span></div>
        <div className="pg-card"><span className="pg-h">Match sharpness</span><strong className={e.matchBoost > 1.005 ? 'fd-ok' : ''}>{e.matchBoost >= 1 ? '+' : ''}{((e.matchBoost - 1) * 100).toFixed(1)}%</strong><span className="hm-note">from match prep, tactics and set pieces</span></div>
        <div className="pg-card"><span className="pg-h">Days off</span><strong className={e.restDays === 0 ? 'fd-money--neg' : 'fd-ok'}>{e.restDays}</strong><span className="hm-note">{e.restDays === 0 ? 'Players will get tired and unhappy' : 'Rest and recovery keep morale up'}</span></div>
      </div>
      <section>
        <h2 className="pg-h">Player development · individual focus</h2>
        <p className="hm-note" style={{ marginBottom: 12 }}>Young players grow every few matchdays. An individual focus puts most of that growth into one attribute, or into a role's key attributes.</p>
        <div className="tg-devs">
          {developing.map((p) => (
            <FD.DevelopmentCard key={p.id} player={devCard(g, p)} scale={p.squad === 'First team' ? leagueScale(g) : youthScale()}
              action={<FD.Select value={t.focus[p.id] ?? ''} label={`Individual focus for ${p.name}`} options={[{ value: '', label: 'No focus' }, ...rolesForPlayer(p).map((r) => ({ value: `role:${r.id}`, label: `Role: ${r.name}` })), ...focusOptions(p).filter((a, i, arr) => arr.indexOf(a) === i).map((a) => ({ value: a, label: a }))]}
                onChange={(v: string) => update((d) => { if (v) d.training.focus[p.id] = v; else delete d.training.focus[p.id]; })} />} />
          ))}
        </div>
      </section>
      <LearnPosition g={g} update={update} />
    </div>
  );
}

/** Players learning a new position: progress each week until they're accomplished there. */
function LearnPosition({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const squad = squadOf(g, g.userClubId).filter((p) => p.squad === 'First team' || p.squad === 'U21');
  const learn = g.training.learn ?? {};
  const [who, setWho] = useState('');
  const [pos, setPos] = useState('');
  const sel = g.players[who];
  const options = sel ? LEARNABLE.filter((x) => x !== sel.pos && !['accomplished', 'natural'].includes(positionLevel(sel, x)) && (x === 'GK') === (sel.pos === 'GK')) : [];
  return (
    <section className="pg-card" style={{ marginTop: 16 }}>
      <h2 className="pg-h">Learn a new position</h2>
      <p className="hm-note" style={{ marginTop: 0 }}>A player improves at a position week by week, from awkward up to accomplished. Young players, and those with good Decisions and Anticipation, learn faster.</p>
      {Object.keys(learn).length ? (
        <table className="fd-mini" style={{ marginBottom: 10 }}><tbody>
          {Object.entries(learn).filter(([id]) => g.players[id]).map(([id, l]) => (
            <tr key={id}>
              <td><strong>{g.players[id].name}</strong> <span className="fd-muted">({g.players[id].pos})</span></td>
              <td>Learning {l.pos} · now {positionLevel(g.players[id], l.pos)}</td>
              <td style={{ width: 140 }}><span className="fd-meter"><span className="fd-meter__bar fd-meter__bar--low" style={{ width: Math.min(100, (l.progress / 8) * 100) + '%' }} /></span></td>
              <td style={{ textAlign: 'right' }}><button type="button" className="pg-link" onClick={() => update((d) => { delete d.training.learn![id]; })}>Stop</button></td>
            </tr>
          ))}
        </tbody></table>
      ) : null}
      <div className="sp-grid">
        <label className="sp-field"><span className="fd-label">Player</span>
          <select className="fd-input" value={who} onChange={(e) => { setWho(e.target.value); setPos(''); }} aria-label="Player to retrain">
            <option value="">Choose…</option>
            {squad.filter((p) => !learn[p.id]).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.pos}</option>)}
          </select>
        </label>
        <label className="sp-field"><span className="fd-label">New position</span>
          <select className="fd-input" value={pos} disabled={!sel} onChange={(e) => setPos(e.target.value)} aria-label="New position">
            <option value="">Choose…</option>
            {options.map((x) => <option key={x} value={x}>{x} · now {sel ? positionLevel(sel, x) : ''}</option>)}
          </select>
        </label>
        <div className="sp-field" style={{ justifyContent: 'flex-end' }}>
          <FD.Button size="sm" disabled={!who || !pos} onClick={() => { update((d) => { (d.training.learn ??= {})[who] = { pos, progress: 0 }; }); setWho(''); setPos(''); }}>Start learning</FD.Button>
        </div>
      </div>
    </section>
  );
}
export { DAYS };
