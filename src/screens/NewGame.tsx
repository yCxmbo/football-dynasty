import { useMemo, useRef, useState } from 'react';
import { FD } from '../ds';
import { builtinWorld, templateWorld } from '../engine/builtin';
import { validateWorld, type ClubDef, type LeagueDef, type Validation, type WorldDef } from '../engine/worlddef';
import type { Currency } from '../engine/types';
import { realWorld } from '../data/real';
import { badgeUrl } from './badge';

type Source = 'real' | 'builtin' | 'import';
export interface StartOpts { clubId: string; name: string; currency: Currency; world: WorldDef; source: Source }

const SOURCES: Array<[Source, string, string]> = [
  ['real', 'Real world', '15 countries, 17 leagues and real players from 2025/26, with club names close to the real ones.'],
  ['builtin', 'Fictional world', 'Invented clubs and players in five countries. Nobody knows who the stars are.'],
  ['import', 'Load a world file', 'Play with leagues, clubs and players from a world file you made or downloaded.'],
];

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** What the board would expect, from the club's rank by reputation and the league's rules. */
function expectation(l: LeagueDef, rank: number, size: number, world: WorldDef) {
  const cont = world.continental.filter((k) => k.rank === 1).reduce((a, k) => a + (k.places[l.country] ?? 0), 0);
  if (l.tier === 1) {
    if (rank < 2) return 'Title favourites';
    if (cont && rank < cont) return 'Expected: continental places';
    if (rank < size / 2) return 'Expected: top half';
    return l.relegate ? 'Expected: avoid relegation' : 'Expected: lower half';
  }
  if (rank < l.promote) return 'Expected: promotion';
  if (l.playoff && rank < l.playoff[1]) return 'Expected: play-offs';
  return l.relegate ? 'Expected: avoid relegation' : 'Expected: build for the future';
}

const stars = (rep: number) => Math.max(0.5, Math.min(5, Math.round(((rep - 30) / 60) * 10) / 2));

export default function NewGame({ onStart, oldSave }: { onStart: (o: StartOpts) => void; oldSave?: boolean }) {
  const [source, setSource] = useState<Source>('real');
  const [imported, setImported] = useState<{ world: WorldDef; check: Validation; file: string } | null>(null);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const world = useMemo<WorldDef | null>(() => (source === 'real' ? realWorld() : source === 'builtin' ? builtinWorld() : imported?.check.ok ? imported.world : null), [source, imported]);
  const playable = useMemo(() => (world ? world.countries.filter((k) => world.leagues.some((l) => l.country === k.id)) : []), [world]);
  const [country, setCountry] = useState('eng');
  const [league, setLeague] = useState('eng1');
  const [club, setClub] = useState('eng-arsenal');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [busy, setBusy] = useState(false);

  const countryId = playable.some((k) => k.id === country) ? country : playable[0]?.id;
  const leagues = world ? world.leagues.filter((l) => l.country === countryId).sort((a, b) => a.tier - b.tier) : [];
  const lg = leagues.find((l) => l.id === league) ?? leagues[0];
  const clubs: ClubDef[] = world && lg ? world.clubs.filter((c) => c.league === lg.id).sort((a, b) => b.reputation - a.reputation) : [];
  const clubId = clubs.some((c) => c.id === club) ? club : clubs[0]?.id;

  const pickCountry = (id: string) => {
    setCountry(id);
    const first = world?.leagues.filter((l) => l.country === id).sort((a, b) => a.tier - b.tier)[0];
    if (first) setLeague(first.id);
  };

  async function readFile(f: File) {
    setImportError('');
    try {
      const raw = JSON.parse(await f.text());
      const check = validateWorld(raw);
      setImported({ world: raw as WorldDef, check, file: f.name });
      if (check.ok) {
        const w = raw as WorldDef;
        const first = w.leagues.slice().sort((a, b) => a.tier - b.tier)[0];
        if (first) { setCountry(first.country); setLeague(first.id); }
      }
    } catch {
      setImported(null);
      setImportError(`"${f.name}" isn't a readable JSON file.`);
    }
  }

  return (
    <main className="ng">
      <img className="ng__crest" src={`${import.meta.env.BASE_URL}crest-512.png`} alt="Football Dynasty" />
      <section className="ng__card pg-card">
        <h1 className="pg-title">Start your dynasty</h1>
        {oldSave && <p className="fd-warn" role="status">Your previous save is from an older version and can't be loaded. Starting a career replaces it.</p>}
        <div className="fd-grid2">
          <FD.Field label="Your name"><div className="fd-input"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Manager name" aria-label="Your name" maxLength={40} /></div></FD.Field>
          <FD.Field label="Currency"><FD.CurrencyToggle value={currency} onChange={setCurrency} /></FD.Field>
        </div>

        <h2 className="pg-h">Choose a world</h2>
        <div className="ng__worlds" role="radiogroup" aria-label="World">
          {SOURCES.map(([id, label, text]) => (
            <button key={id} type="button" role="radio" aria-checked={source === id} className={'ng__world' + (source === id ? ' is-on' : '')}
              onClick={() => { setSource(id); if (id !== 'import') pickCountry('eng'); }}>
              <strong>{label}</strong><span>{text}</span>
            </button>
          ))}
        </div>

        {source === 'import' && (
          <div className="ng__import">
            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.target.value = ''; }} />
            <div className="pg-row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <FD.Button onClick={() => fileRef.current?.click()}>Choose world file…</FD.Button>
              <FD.Button variant="secondary" onClick={() => download('football-dynasty-template.json', templateWorld())}>Download template</FD.Button>
              <FD.Button variant="secondary" onClick={() => download('football-dynasty-real-world.json', realWorld())}>Download real world to edit</FD.Button>
            </div>
            <p className="hm-note">A world file lists countries, leagues, cups, continental competitions, clubs and (optionally) players. Clubs without enough players get generated ones. Only import names and data you have the right to use.</p>
            {importError && <p className="fd-warn" role="alert">{importError}</p>}
            {imported && (
              <div className={'ng__check' + (imported.check.ok ? ' is-ok' : ' is-bad')} role="status">
                <strong>{imported.file}: {imported.check.ok ? 'ready to play' : `${imported.check.errors.length} problem${imported.check.errors.length === 1 ? '' : 's'} to fix`}</strong>
                {imported.check.summary && <span>{imported.check.summary}</span>}
                {imported.check.errors.length > 0 && <ul>{imported.check.errors.slice(0, 12).map((e) => <li key={e}>{e}</li>)}</ul>}
                {imported.check.warnings.length > 0 && <ul className="ng__warn">{imported.check.warnings.slice(0, 6).map((e) => <li key={e}>{e}</li>)}</ul>}
              </div>
            )}
          </div>
        )}

        {world && countryId && lg && (
          <>
            <h2 className="pg-h">Choose your club</h2>
            <div className="ng__pick">
              <FD.Field label="Country"><FD.Select value={countryId} label="Country" options={playable.map((k) => ({ value: k.id, label: k.name }))} onChange={(v: string) => pickCountry(v)} /></FD.Field>
              {leagues.length > 1 && (
                <div className="fd-seg" role="radiogroup" aria-label="League" style={{ alignSelf: 'flex-end' }}>
                  {leagues.map((l) => <button key={l.id} type="button" role="radio" aria-checked={lg.id === l.id} className={'fd-seg__opt' + (lg.id === l.id ? ' is-on' : '')} onClick={() => setLeague(l.id)}>{l.short ?? l.name}</button>)}
                </div>
              )}
            </div>
            <p className="hm-note">{lg.name}: {clubs.length} clubs{lg.promote ? `, ${lg.promote} promoted` : ''}{lg.playoff ? ', play-offs for one more place' : ''}{lg.relegate ? `, ${lg.relegate} relegated` : ''}.</p>
            <div className="ng__clubs" role="radiogroup" aria-label="Club">
              {clubs.map((c, i) => (
                <button key={c.id} type="button" role="radio" aria-checked={clubId === c.id} className={'ng__club' + (clubId === c.id ? ' is-on' : '')} onClick={() => setClub(c.id)}>
                  <span className="ng__clubhead"><img className="club-badge" src={badgeUrl({ id: c.id, short: c.short ?? c.name.slice(0, 3), colours: c.colours })} alt="" /><strong>{c.name}</strong></span>
                  <FD.StarRating value={stars(c.reputation)} size={14} />
                  <span>{expectation(lg, i, clubs.length, world)}{c.stadium ? ` · ${c.stadium}` : ''}</span>
                </button>
              ))}
            </div>
            <div className="pg-row" style={{ justifyContent: 'flex-end' }}>
              {busy && <span className="hm-note" role="status">Building the world and its squads…</span>}
              <FD.Button icon="play" disabled={!clubId || busy} onClick={() => { if (!clubId) return; setBusy(true); setTimeout(() => onStart({ clubId, name: name.trim() || 'The Boss', currency, world, source }), 30); }}>Start career</FD.Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
