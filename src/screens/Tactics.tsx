import SetPieces from './SetPieces';
import OppReport from './OppReport';
import type { Screen } from './shared';
import { applyPreset, nextUserFixture, setDefFormation, setInstructions, setRole, useTactic } from '../engine/game';
import InstructionsPanel from './InstructionsPanel';
import TacticsBoard, { FORMATION_LIST } from './TacticsBoard';
import { reviewTactic } from '../engine/review';
import { bestRolesAll, fixRoles } from '../engine/roles';
import { familiarity, formationFamiliarity, renameTactic, saveActive, STYLE_PRESETS, tacticsOf } from '../engine/tactics';
import { useState } from 'react';
import { FD } from '../ds';
import { available, slotsOf, type Formation } from '../engine/match';
import { describeInstructions, withDefaults } from '../engine/instructions';
import { bestLineup, recoveryPerDay, squadOf, userLineup } from '../engine/game';
import { EQUIVALENT } from '../engine/world';
import type { GameState, Player } from '../engine/types';

/** Saves made before wide-position equivalents existed still show LW→LM etc. as accomplished. */
const withEquivalents = (p: Player): Player => {
  const positions = { ...p.positions };
  for (const e of EQUIVALENT[p.pos] ?? []) positions[e] ??= 'accomplished';
  return { ...p, positions };
};
const famWord = (f: number) => (f >= 90 ? 'Fluid' : f >= 70 ? 'Familiar' : f >= 50 ? 'Learning' : 'New to the squad');
const cond = (p: Player) => Math.round(p.condition ?? 100);

function FitnessRow({ g, p, slot, rotated }: { g: GameState; p: Player; slot?: string; rotated?: boolean }) {
  const c = cond(p);
  const daysTo100 = c >= 100 ? 0 : Math.ceil((100 - c) / recoveryPerDay(g, p));
  return (
    <tr>
      <td>{slot ? <span className="fd-pos">{slot}</span> : null}</td>
      <td><strong>{p.name}</strong>{rotated ? <span className="fd-tag fd-tag--warn" style={{ marginLeft: 6 }}>Rested next match</span> : null}{!available(p) ? <span className="fd-tag fd-tag--loss" style={{ marginLeft: 6 }}>{p.injuredFor ? 'Injured' : 'Suspended'}</span> : null}</td>
      <td style={{ width: 180 }}><span className="sub-cond"><span className="fd-meter"><span className={`fd-meter__bar fd-meter__bar--${c >= 75 ? 'low' : c >= 60 ? 'medium' : 'high'}`} style={{ width: c + '%' }} /></span><span className={c < 60 ? 'fd-money--neg' : c < 75 ? 'fd-warn' : 'fd-muted'}>{c}%</span></span></td>
      <td className="fd-num fd-muted">{daysTo100 ? `${daysTo100} ${daysTo100 === 1 ? 'day' : 'days'} to full` : 'Fresh'}</td>
    </tr>
  );
}

export default function Tactics({ g, go, update, onChange, onAutoRotate, liveNote }: { g: GameState; go: (s: Screen, id?: string) => void; update: (fn: (d: GameState) => void) => void; onChange: (formation: Formation, lineup: string[]) => void; onAutoRotate: (on: boolean) => void; liveNote?: boolean }) {
  const nextFx = nextUserFixture(g);
  const ft = squadOf(g, g.userClubId).filter((p) => p.squad === 'First team');
  const xi = g.lineup.map((id) => g.players[id]).filter(Boolean);
  const bench = ft.filter((p) => !g.lineup.includes(p.id)).sort((a, b) => Number(available(b)) - Number(available(a)) || b.ability - a.ability);
  const unavailable = xi.filter((p) => !available(p));
  const next = new Set(userLineup(g));
  const slots = slotsOf(g.formation);
  const rotateOn = g.autoRotate !== false;
  const tired = xi.filter((p) => cond(p) < 70);
  const ts = tacticsOf(structuredClone({ tactics: g.tactics, formation: g.formation, roles: g.roles, instructions: g.instructions }) as GameState);
  const fam = familiarity({ ...g, tactics: ts } as GameState);
  const [renaming, setRenaming] = useState(false);
  return (
    <div className="pg-stack">
      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div><h1 className="pg-title">Tactics</h1><p className="pg-sub">Three saved tactics, each with a formation, a role and duty for every player, and instructions for every phase of play. Pick a player on the pitch to set his role or swap him.</p></div>
        <div className="pg-row" style={{ gap: 8 }}>
          <FD.Button variant="secondary" icon="sim" onClick={() => onChange(g.formation, bestLineup(g))}>Pick best XI</FD.Button>
          <FD.Button variant="secondary" icon="tactics" onClick={() => update((d) => saveActive(d, { roles: bestRolesAll(d.formation, d.lineup.map((id) => d.players[id]), fixRoles(d.formation, d.roles)) }))}>Pick best roles</FD.Button>
        </div>
      </div>
      {liveNote && <p className="tr-window" role="status">A match is in progress. Changes here apply from the next match; make substitutions from the match screen.</p>}
      {unavailable.length > 0 && <p className="fd-money--neg" role="alert">{unavailable.map((p) => p.name).join(', ')} {unavailable.length === 1 ? 'is' : 'are'} unavailable and will be replaced automatically. Pick a replacement or use Pick best XI.</p>}
      {nextFx && nextFx.comp !== 'friendly' ? <OppReport g={g} f={nextFx} go={go} /> : null}
      <section className="pg-card tac-bar">
        <div className="fd-seg" role="tablist" aria-label="Saved tactics">
          {ts.slots.map((t, i) => (
            <button key={i} type="button" role="tab" aria-selected={ts.active === i} className={'fd-seg__opt' + (ts.active === i ? ' is-on' : '')} onClick={() => update((d) => useTactic(d, i))}>{t.name} · {t.formation}{t.defFormation ? `/${t.defFormation}` : ''}</button>
          ))}
        </div>
        {renaming ? (
          <input className="fd-input tac-name" autoFocus defaultValue={ts.slots[ts.active].name} aria-label="Tactic name" maxLength={24}
            onBlur={(e) => { const v = e.target.value; update((d) => renameTactic(d, tacticsOf(d).active, v)); setRenaming(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        ) : <button type="button" className="pg-link" onClick={() => setRenaming(true)}>Rename</button>}
        <label className="tac-field"><span className="fd-label">Formation</span>
          <select className="fd-input" value={g.formation} aria-label="Formation" onChange={(e) => { const f = e.target.value as Formation; onChange(f, bestLineup(g, f)); }}>
            {FORMATION_LIST.map((f) => <option key={f} value={f}>{f} · {famWord(formationFamiliarity(g, f))}</option>)}
          </select>
        </label>
        <label className="tac-field"><span className="fd-label">Without the ball</span>
          <select className="fd-input" value={g.defFormation ?? ''} aria-label="Shape without the ball" onChange={(e) => { const f = e.target.value as Formation | ''; update((d) => setDefFormation(d, f || null)); }}>
            <option value="">Same shape</option>
            {FORMATION_LIST.filter((f) => f !== g.formation).map((f) => <option key={f} value={f}>{f} · {famWord(formationFamiliarity(g, f))}</option>)}
          </select>
        </label>
        <label className="tac-field"><span className="fd-label">Start from a style</span>
          <select className="fd-input" value="" aria-label="Load a tactical style" onChange={(e) => {
            const p = STYLE_PRESETS.find((x) => x.id === e.target.value);
            if (p && window.confirm(`Replace ${ts.slots[ts.active].name} with the ${p.name} style (${p.formation})? ${p.desc}`)) update((d) => applyPreset(d, p.id));
          }}>
            <option value="">Choose a style…</option>
            {STYLE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.formation})</option>)}
          </select>
        </label>
        <div className="tac-fam" title="A new shape or big changes to the instructions cost a little on the pitch until the squad has played them a few times.">
          <span className="fd-label">Familiarity · {famWord(fam)}</span>
          <span className="fd-meter fd-meter--wide"><span className={`fd-meter__bar fd-meter__bar--${fam >= 70 ? 'low' : fam >= 50 ? 'medium' : 'high'}`} style={{ width: fam + '%' }} /></span>
        </div>
      </section>
      <TacticsBoard formation={g.formation} defFormation={g.defFormation} roles={g.roles} xi={xi.map(withEquivalents)} bench={bench.map(withEquivalents)}
        onSwap={(l) => onChange(g.formation, l.slice(0, slots.length))} onRole={(i, r) => update((d) => setRole(d, i, r))} />
      <TacticOverview g={g} xi={xi} />
      <section className="pg-card">
        <h2 className="pg-h">Team instructions · {ts.slots[ts.active].name}</h2>
        <p className="hm-note" style={{ marginTop: 0 }}>How the team plays in each phase. Every choice trades something, and many depend on the opponent: hover an option for what it does. Changing several at once costs familiarity until the squad has played them; you can also change them during a match.</p>
        <InstructionsPanel value={g.instructions} onChange={(c) => update((d) => setInstructions(d, c))} />
        <p className="hm-note" style={{ marginBottom: 0, fontSize: 12 }}>{describeInstructions(withDefaults(g.instructions))}</p>
      </section>
      <SetPieces g={g} update={update} />
      <section className="pg-card">
        <div className="pg-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h2 className="pg-h" style={{ margin: 0 }}>Fitness</h2>
            <p className="hm-note">Players tire during matches and recover a few points a day ({tired.length ? `${tired.length} of your starters ${tired.length === 1 ? 'is' : 'are'} under 70%` : 'your starters are fit'}). Tired players play worse and get injured more.</p>
          </div>
          <label className="tr-check"><input type="checkbox" checked={rotateOn} onChange={(e) => onAutoRotate(e.target.checked)} /> Rotate tired players (under 70%) automatically</label>
        </div>
        <table className="fd-mini fit-table">
          <tbody>
            {xi.map((p, i) => <FitnessRow key={p.id} g={g} p={p} slot={slots[i]} rotated={rotateOn && !next.has(p.id)} />)}
            <tr><td colSpan={4} className="pg-h" style={{ paddingTop: 12 }}>Substitutes</td></tr>
            {bench.map((p) => <FitnessRow key={p.id} g={g} p={p} />)}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/** The assistant's read of the tactic: balance between the units, role fit, and what stands out. */
function TacticOverview({ g, xi }: { g: GameState; xi: Player[] }) {
  const r = reviewTactic(g.formation, g.roles, xi, g.instructions);
  const units: Array<[string, number]> = [['Defence', r.balance.def], ['Midfield', r.balance.mid], ['Attack', r.balance.att]];
  return (
    <section className="pg-card tac-review" aria-labelledby="tac-review-h">
      <h2 className="pg-h" id="tac-review-h">Tactic overview</h2>
      <div className="tac-review__grid">
        <div>
          <span className="fd-label">Where the work goes</span>
          <div className="tac-balance" role="img" aria-label={units.map(([k, v]) => `${k} ${v}%`).join(', ')}>
            {units.map(([k, v]) => <span key={k} className={`tac-balance__seg tac-balance__seg--${k.toLowerCase()}`} style={{ flexGrow: v }} title={`${k} ${v}%`} />)}
          </div>
          <div className="tac-balance__legend">{units.map(([k, v]) => <span key={k}><i className={`tac-balance__key tac-balance__seg--${k.toLowerCase()}`} />{k} <strong>{v}%</strong></span>)}</div>
          <p className="hm-note">Role fit: <strong>{r.fit.toFixed(1)}</strong> of 5 stars on average. Mentality: <strong>{(g.instructions?.mentality ?? 'balanced').replace(/^./, (c) => c.toUpperCase())}</strong>.</p>
        </div>
        <ul className="tac-notes">
          {r.good.map((t) => <li key={t} className="tac-notes__good"><span className="tac-notes__mark" aria-hidden>+</span><span className="sr-only">Strength: </span>{t}</li>)}
          {r.warn.map((t) => <li key={t} className="tac-notes__warn"><span className="tac-notes__mark" aria-hidden>!</span><span className="sr-only">Watch out: </span>{t}</li>)}
        </ul>
      </div>
      {r.misfits.length ? <p className="hm-note" style={{ marginBottom: 0 }}>Poor fits: {r.misfits.map((m) => `${m.name} as ${m.role} (${m.slot}, ${m.stars}★)`).join(' · ')}</p> : null}
    </section>
  );
}
