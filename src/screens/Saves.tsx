import { useEffect, useState } from 'react';
import { FD } from '../ds';
import { formatDate } from '../engine/fixtures';
import type { GameState } from '../engine/types';
import { deleteSlot, loadSlot, MAX_MANUAL, readSlots, saveManual, type SlotMeta } from '../saves';
import { exportSave } from '../store';

const KIND: Record<SlotMeta['kind'], string> = { manual: 'Your save', day: 'Daily backup', season: 'Season start' };

/** Save slots and automatic backups for the current career. */
export default function Saves({ g, careerId, onRestore }: { g: GameState; careerId: string | null; onRestore: (s: GameState) => void }) {
  const [list, setList] = useState<SlotMeta[]>(() => (careerId ? readSlots(careerId) : []));
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const refresh = () => careerId && setList(readSlots(careerId));
  useEffect(() => { refresh(); const t = setInterval(refresh, 4000); return () => clearInterval(t); }, [careerId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!careerId) return <section className="pg-card"><h2 className="pg-h">Saves and backups</h2><p className="hm-note" style={{ margin: 0 }}>Your career is saved automatically; slots become available after the first save.</p></section>;
  const manual = list.filter((s) => s.kind === 'manual').length;
  const sorted = list.slice().sort((a, b) => b.at - a.at);
  return (
    <section className="pg-card" aria-labelledby="saves-h">
      <h2 className="pg-h" id="saves-h">Saves and backups</h2>
      <p className="hm-note" style={{ marginTop: 0 }}>Your career saves itself all the time. On top of that, a backup is kept for each of the last two in-game days and at the start of the season, and you can keep up to {MAX_MANUAL} saves of your own. Restoring replaces where you are now.</p>
      <form className="tr-saved__form" style={{ marginLeft: 0, marginBottom: 12 }} onSubmit={async (e) => { e.preventDefault(); const err = await saveManual(careerId, g, name); setMsg(err ?? 'Saved.'); setName(''); refresh(); }}>
        <input className="fd-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this save" aria-label="Name this save" maxLength={40} />
        <FD.Button size="sm" type="submit" disabled={manual >= MAX_MANUAL}>Save now</FD.Button>
        <span className="fd-muted" style={{ fontSize: 12 }}>{manual}/{MAX_MANUAL} used</span>
      </form>
      {msg ? <p className="fd-muted" role="status" style={{ margin: '0 0 8px' }}>{msg}</p> : null}
      {sorted.length ? (
        <ul className="sv-list">{sorted.map((s) => (
          <li key={s.key}>
            <span className="sv-list__main"><strong>{s.name}</strong><span className="fd-muted">{KIND[s.kind]} · {s.club} · {s.season} · {s.day ? formatDate(s.day) : ''} · saved {new Date(s.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span>
            <span className="sv-list__act">
              <FD.Button size="sm" variant="secondary" onClick={async () => {
                if (!window.confirm(`Restore “${s.name}”? You'll go back to ${s.day ? formatDate(s.day) : 'that point'}; anything since then is lost unless you save it first.`)) return;
                const st = await loadSlot(s.key).catch(() => undefined);
                if (st) { onRestore(st); setMsg(`Restored “${s.name}”.`); } else setMsg('That save could not be read.');
              }}>Restore</FD.Button>
              <FD.Button size="sm" variant="ghost" onClick={async () => { const st = await loadSlot(s.key).catch(() => undefined); if (st) exportSave(st); }}>Export</FD.Button>
              <FD.Button size="sm" variant="ghost" onClick={async () => { if (window.confirm(`Delete “${s.name}”?`)) { await deleteSlot(careerId, s.key); refresh(); } }}>Delete</FD.Button>
            </span>
          </li>
        ))}</ul>
      ) : <p className="hm-note" style={{ margin: 0 }}>No saves or backups yet. The first backup appears a moment after your next change.</p>}
    </section>
  );
}
