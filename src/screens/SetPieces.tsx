import { useState } from 'react';
import { squadOf } from '../engine/game';
import { captainOf, setCaptain, setTaker, takersOf } from '../engine/leadership';
import type { GameState, Player } from '../engine/types';
import { BODIES, CORNERS, DEFAULT_ROUTINES, estimateCorners, FREE_KICKS, type Routines as R } from '../engine/routines';

type Kind = 'pen' | 'fk' | 'corner';
const KINDS: Array<{ k: Kind; label: string; attr: string }> = [
  { k: 'pen', label: 'Penalties', attr: 'Penalties' },
  { k: 'fk', label: 'Free kicks', attr: 'Free Kicks' },
  { k: 'corner', label: 'Corners', attr: 'Corners' },
];

/** Captain and set-piece takers for your side. */
export default function SetPieces({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const [note, setNote] = useState('');
  const ft = squadOf(g, g.userClubId).filter((p) => p.squad === 'First team' && p.pos !== 'GK');
  const all = squadOf(g, g.userClubId).filter((p) => p.squad === 'First team');
  const cap = captainOf(g, g.userClubId);
  const takers = takersOf(g);
  const a = (p: Player, k: string) => p.attributes[k] ?? 10;
  const by = (k: string, list: Player[]) => list.slice().sort((x, y) => a(y, k) - a(x, k));
  const best = (k: string) => by(k, ft)[0];
  return (
    <section className="pg-card">
      <h2 className="pg-h">Captain and set pieces</h2>
      <p className="hm-note" style={{ marginTop: 0 }}>A captain with high Leadership lifts the side, more so when it's behind. Naming a weak or very young captain, or taking the armband from a respected leader, upsets the dressing room. Takers' attributes decide how often set pieces go in; if a taker isn't playing, the best available steps up.</p>
      <div className="sp-grid">
        <label className="sp-field"><span className="pg-h" style={{ margin: 0 }}>Captain</span>
          <select className="fd-input" value={cap?.captain ? cap.id : ''} aria-label="Captain" onChange={(e) => {
            const id = e.target.value; if (!id) return;
            let msg = '';
            update((d) => { msg = setCaptain(d, id); });
            setTimeout(() => setNote(msg), 0);
          }}>
            {!cap?.captain ? <option value="">Not chosen (best leader: {cap?.name})</option> : null}
            {by('Leadership', all).map((p) => <option key={p.id} value={p.id}>{p.name} · Leadership {a(p, 'Leadership')}{p.age < 22 ? ` · ${p.age}` : ''}</option>)}
          </select>
        </label>
        {KINDS.map(({ k, label, attr }) => (
          <label key={k} className="sp-field"><span className="pg-h" style={{ margin: 0 }}>{label}</span>
            <select className="fd-input" value={takers[k] ?? ''} aria-label={`${label} taker`} onChange={(e) => update((d) => setTaker(d, k, e.target.value || undefined))}>
              <option value="">Best available ({best(attr)?.name} · {best(attr) ? a(best(attr), attr) : '–'})</option>
              {by(attr, ft).map((p) => <option key={p.id} value={p.id}>{p.name} · {attr} {a(p, attr)}</option>)}
            </select>
          </label>
        ))}
      </div>
      {note ? <p className="fd-warn" role="status" style={{ marginBottom: 0 }}>{note}</p> : null}
      <Routines g={g} update={update} />
    </section>
  );
}

/** Corner and free-kick routines, with an estimate from your current eleven. */
function Routines({ g, update }: { g: GameState; update: (fn: (d: GameState) => void) => void }) {
  const r = g.routines ?? DEFAULT_ROUTINES;
  const xi = g.lineup.map((id) => g.players[id]).filter((p) => p && p.pos !== 'GK');
  const taker = (takersOf(g).corner && g.players[takersOf(g).corner!]) || xi.slice().sort((a, b) => (b.attributes.Corners ?? 10) - (a.attributes.Corners ?? 10))[0];
  const set = (c: Partial<R>) => update((d) => { d.routines = { ...(d.routines ?? DEFAULT_ROUTINES), ...c }; });
  const est = (c: R['corner']) => estimateCorners({ ...r, corner: c }, taker?.attributes.Corners ?? 10, xi.map((p) => p.attributes));
  const seg = <T extends string>(label: string, value: T, opts: Array<{ id: T; label: string; desc: string }>, onPick: (v: T) => void, extra?: (id: T) => string) => (
    <div className="fd-field">
      <span className="fd-field__label">{label}</span>
      <div className="fd-seg" role="radiogroup" aria-label={label} style={{ flexWrap: 'wrap' }}>
        {opts.map((o) => <button key={o.id} type="button" role="radio" aria-checked={value === o.id} title={o.desc} className={'fd-seg__opt' + (value === o.id ? ' is-on' : '')} onClick={() => onPick(o.id)}>{o.label}{extra ? <span className="fd-muted sp-est"> {extra(o.id)}</span> : null}</button>)}
      </div>
      <span className="fd-field__hint">{opts.find((o) => o.id === value)!.desc}</span>
    </div>
  );
  return (
    <div className="sp-routines">
      <h3 className="pg-h" style={{ marginTop: 16 }}>Set-piece routines</h3>
      <p className="hm-note" style={{ marginTop: 0 }}>Expected goals from ten corners with your current eleven{taker ? ` and ${taker.name} taking them` : ''} are shown beside each corner routine.</p>
      {seg('Corners', r.corner, CORNERS, (v) => set({ corner: v }), (id) => est(id).toFixed(2))}
      {seg('Free kicks', r.fk, FREE_KICKS, (v) => set({ fk: v }))}
      {seg('Players forward', r.bodies, BODIES, (v) => set({ bodies: v }))}
    </div>
  );
}
