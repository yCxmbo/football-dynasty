import { useState } from 'react';
import { FD } from '../ds';
import { available, fitFor, slotsOf, type Formation } from '../engine/match';
import { DUTY_NAME, fixRoles, PLAYER_INSTR, ROLE_BY_ID, roleStars, rolesFor, type Duty, type PlayerInstr, type SlotRole } from '../engine/roles';
import type { Player } from '../engine/types';

/** Where each slot sits on the pitch (x, y in %), in slot order. */
export const LAYOUT: Record<Formation, Array<[number, number]>> = {
  '4-3-3': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [25, 50], [50, 55], [75, 50], [17, 24], [50, 14], [83, 24]],
  '4-4-2': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [14, 45], [38, 50], [62, 50], [86, 45], [38, 16], [62, 16]],
  '4-2-3-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [37, 57], [63, 57], [17, 35], [50, 37], [83, 35], [50, 14]],
  '3-5-2': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 50], [32, 46], [50, 60], [68, 46], [90, 50], [38, 16], [62, 16]],
  '4-3-3 DM': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [50, 61], [32, 46], [68, 46], [17, 24], [50, 14], [83, 24]],
  '4-1-4-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [50, 61], [14, 40], [37, 44], [63, 44], [86, 40], [50, 15]],
  '4-4-1-1': [[50, 90], [14, 70], [37, 75], [63, 75], [86, 70], [14, 46], [38, 52], [62, 52], [86, 46], [50, 32], [50, 14]],
  '4-4-2 diamond': [[50, 90], [14, 68], [37, 75], [63, 75], [86, 68], [50, 62], [30, 48], [70, 48], [50, 34], [38, 16], [62, 16]],
  '3-4-3': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 48], [37, 52], [63, 52], [90, 48], [18, 24], [50, 15], [82, 24]],
  '3-4-2-1': [[50, 90], [25, 74], [50, 77], [75, 74], [10, 50], [37, 56], [63, 56], [90, 50], [35, 32], [65, 32], [50, 14]],
  '5-3-2': [[50, 90], [8, 62], [28, 75], [50, 78], [72, 75], [92, 62], [30, 46], [50, 56], [70, 46], [38, 17], [62, 17]],
  '5-4-1': [[50, 90], [8, 64], [28, 76], [50, 78], [72, 76], [92, 64], [14, 42], [38, 48], [62, 48], [86, 42], [50, 16]],
};
export const FORMATION_LIST = Object.keys(LAYOUT) as Formation[];

const fitClass = (p: Player | undefined, slot: string) => {
  if (!p) return 'awkward';
  const f = fitFor(p, slot);
  return f >= 1 ? 'natural' : f >= 0.95 ? 'accomplished' : f >= 0.9 ? 'competent' : f >= 0.8 ? 'unconvincing' : 'awkward';
};
const surname = (n: string) => { const i = n.indexOf(' '); return i < 0 ? n : n.slice(i + 1); };
const cond = (p: Player) => Math.round(p.condition ?? 100);

/** Pitch with your eleven, roles and duties; pick a slot to change its role, then another slot or a
    substitute to swap players. */
export default function TacticsBoard({ formation, roles, xi, bench, onSwap, onRole }: {
  formation: Formation; roles?: SlotRole[]; xi: Player[]; bench: Player[];
  onSwap: (lineup: string[]) => void; onRole: (index: number, role: SlotRole) => void;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const slots = slotsOf(formation);
  const rs = fixRoles(formation, roles);
  const pos = LAYOUT[formation];
  const ids = xi.map((p) => p.id);
  const pickSlot = (i: number) => {
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    const l = [...ids]; [l[sel], l[i]] = [l[i], l[sel]];
    onSwap(l); setSel(i);
  };
  const pickBench = (p: Player) => {
    if (sel === null) return;
    const l = [...ids]; l[sel] = p.id;
    onSwap(l);
  };
  const cur = sel !== null ? { slot: slots[sel], p: xi[sel], r: rs[sel] } : null;
  const def = cur ? ROLE_BY_ID[cur.r.role] : undefined;
  return (
    <div className="tb">
      <div className="fd-pitch tb__pitch" role="group" aria-label={`Starting eleven, ${formation}`}>
        <svg className="fd-pitch__lines" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
          <rect x="3" y="3" width="94" height="134" /><line x1="3" y1="70" x2="97" y2="70" /><circle cx="50" cy="70" r="11" />
          <rect x="24" y="3" width="52" height="20" /><rect x="38" y="3" width="24" height="7" /><rect x="24" y="117" width="52" height="20" /><rect x="38" y="130" width="24" height="7" />
        </svg>
        {slots.map((s, i) => {
          const p = xi[i], r = rs[i], fit = fitClass(p, s);
          const st = p ? roleStars(p, r.role) : 0;
          return (
            <button key={i} type="button" className={`fd-slot fd-slot--${fit} tb__slot${sel === i ? ' is-selected' : ''}`} style={{ left: pos[i][0] + '%', top: pos[i][1] + '%' }}
              aria-pressed={sel === i} aria-label={`${s}: ${p ? p.name : 'empty'}, ${ROLE_BY_ID[r.role]?.name} (${DUTY_NAME[r.duty]})`} onClick={() => pickSlot(i)}>
              <span className="fd-slot__disc">{p ? p.number : '+'}</span>
              <span className="fd-slot__name">{p ? surname(p.name) : s}</span>
              <span className="fd-slot__pos">{ROLE_BY_ID[r.role]?.short}-{r.duty}{r.pi && Object.keys(r.pi).length ? ` +${Object.keys(r.pi).length}` : ''}{p && !available(p) ? ' · out' : ''}</span>
              {p ? <span className={'tb__stars tb__stars--' + (st >= 3.5 ? 'good' : st >= 2 ? 'ok' : 'poor')} aria-hidden="true">{'★'.repeat(Math.round(st))}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="tb__side">
        {cur && def ? (
          <section className="pg-card tb__role">
            <div className="aw-head"><h3 className="pg-h" style={{ margin: 0 }}>{cur.slot} · {cur.p?.name ?? 'Empty'}</h3><button type="button" className="pg-link" onClick={() => setSel(null)}>Done</button></div>
            <label className="sp-field"><span className="fd-label">Role</span>
              <select className="fd-input" value={cur.r.role} aria-label="Role" onChange={(e) => { const d = ROLE_BY_ID[e.target.value]; onRole(sel!, { role: d.id, duty: d.duties.includes(cur.r.duty) ? cur.r.duty : d.duties[0] }); }}>
                {rolesFor(cur.slot).map((r) => <option key={r.id} value={r.id}>{r.name}{cur.p ? ` · ${roleStars(cur.p, r.id)}★` : ''}</option>)}
              </select>
            </label>
            <div className="fd-seg" role="radiogroup" aria-label="Duty" style={{ marginTop: 8 }}>
              {(['D', 'S', 'A'] as Duty[]).map((d) => (
                <button key={d} type="button" role="radio" aria-checked={cur.r.duty === d} disabled={!def.duties.includes(d)} className={'fd-seg__opt' + (cur.r.duty === d ? ' is-on' : '')} onClick={() => onRole(sel!, { role: cur.r.role, duty: d })}>{DUTY_NAME[d]}</button>
              ))}
            </div>
            <p className="hm-note" style={{ margin: '8px 0 4px' }}>{def.desc}</p>
            {cur.p ? (
              <>
                <p className="hm-note" style={{ margin: 0 }}>Suitability: <FD.StarRating value={roleStars(cur.p, def.id)} size={13} /></p>
                <p className="hm-note tb__keys">{def.keys.map((k) => <span key={k}>{k} <strong>{cur.p!.attributes[k] ?? '–'}</strong></span>)}</p>
              </>
            ) : null}
            <details className="tb__pi" open={!!cur.r.pi && Object.keys(cur.r.pi).length > 0}>
              <summary className="fd-label">Player instructions{cur.r.pi && Object.keys(cur.r.pi).length ? ` (${Object.keys(cur.r.pi).length})` : ''}</summary>
              {PLAYER_INSTR.map((o) => {
                const val = cur.r.pi?.[o.key];
                const skill = cur.p ? o.attr.reduce((x, k) => x + (cur.p!.attributes[k] ?? 10), 0) / o.attr.length : 10;
                const set = (v?: string) => {
                  const pi: PlayerInstr = { ...(cur.r.pi ?? {}) };
                  if (v) (pi as Record<string, string>)[o.key] = v; else delete pi[o.key];
                  onRole(sel!, { role: cur.r.role, duty: cur.r.duty, ...(Object.keys(pi).length ? { pi } : {}) });
                };
                return (
                  <div key={o.key} className="tb__pirow" title={o.desc}>
                    <span className="tb__pilabel">{o.label}</span>
                    <div className="fd-seg" role="radiogroup" aria-label={o.label}>
                      <button type="button" role="radio" aria-checked={!val} className={'fd-seg__opt' + (!val ? ' is-on' : '')} onClick={() => set()}>Normal</button>
                      {o.options.map((x) => <button key={x.value} type="button" role="radio" aria-checked={val === x.value} className={'fd-seg__opt' + (val === x.value ? ' is-on' : '')} onClick={() => set(x.value)}>{x.label}</button>)}
                    </div>
                    {cur.p ? <span className={'tb__pihint ' + (skill >= 13 ? 'pred-up' : skill < 12 ? 'pred-down' : 'fd-muted')}>{o.attr.map((k) => `${k} ${cur.p!.attributes[k] ?? '–'}`).join(', ')}{skill >= 13 ? ' · suits him' : skill < 12 ? ' · not his strength' : ''}</span> : null}
                  </div>
                );
              })}
            </details>
            <p className="hm-note" style={{ margin: '6px 0 0' }}>Pick another slot or a substitute to swap him.</p>
          </section>
        ) : <p className="hm-note" style={{ margin: '0 0 8px' }}>Pick a player on the pitch to set his role and duty, or to swap him.</p>}
        <div className="fd-bench">
          <h4 className="fd-label">Substitutes</h4>
          {bench.map((p) => (
            <button key={p.id} type="button" className="fd-bench__row" disabled={sel === null} onClick={() => pickBench(p)}>
              <span className="fd-bench__num">{p.number}</span>
              <span className="fd-bench__name">{p.name}{!available(p) ? ` (${p.injuredFor ? 'injured' : 'suspended'})` : ` · ${cond(p)}%`}</span>
              <span className="fd-pos">{p.pos}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
