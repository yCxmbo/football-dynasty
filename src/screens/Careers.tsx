import { useRef, useState } from 'react';
import { FD } from '../ds';
import type { Career } from '../store';

/** Saved careers with load and delete, plus importing a save file. */
export default function Careers({ careers, activeId, onLoad, onDelete, onImport }: {
  careers: Career[]; activeId?: string | null; onLoad: (id: string) => void; onDelete: (id: string) => void; onImport: (text: string) => Promise<string | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const when = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="careers">
      {careers.length ? (
        <table className="fd-mini"><tbody>
          {careers.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.club}</strong><div className="fd-muted" style={{ fontSize: 12 }}>{c.manager} · {c.season} · {c.world}</div></td>
              <td className="fd-muted fd-num">Saved {when(c.updated)}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {c.id === activeId ? <span className="fd-muted" style={{ marginRight: 12 }}>Playing now</span> : <FD.Button onClick={() => onLoad(c.id)}>Load</FD.Button>}
                {' '}
                <FD.Button variant="ghost" onClick={() => { if (window.confirm(`Delete the ${c.club} career (${c.season})? This can't be undone.`)) onDelete(c.id); }}>Delete</FD.Button>
              </td>
            </tr>
          ))}
        </tbody></table>
      ) : <p className="hm-note">No saved careers yet.</p>}
      <input ref={fileRef} type="file" accept=".fdsave,.json,text/plain" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = '';
        if (!f) return;
        setError((await onImport(await f.text())) ?? '');
      }} />
      <div className="pg-row" style={{ gap: 'var(--space-2)' }}>
        <FD.Button variant="secondary" onClick={() => fileRef.current?.click()}>Import a save file…</FD.Button>
      </div>
      {error && <p className="fd-warn" role="alert">{error}</p>}
    </div>
  );
}
