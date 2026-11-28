import { useEffect, useRef, useState } from 'react';
import { FD } from './ds';
import { currentDate, markRead, newGame, playMatchday, promote, seasonOver, setAutoRotate, setTactics, startUserMatch, advanceDay, todaysFixture, daysToNextMatch } from './engine/game';
import type { Formation } from './engine/match';
import { formatDate } from './engine/fixtures';
import { seasonLabel, type GameState } from './engine/types';
import { toCur, useGame, useTheme } from './store';
import { compInfo, currentSlot } from './engine/competitions';
import { makeOffer, respondToBid, startScouting, toggleShortlist, toggleTransferList, type OfferTerms } from './engine/transfers';
import Contract from './screens/Contract';
import Finances from './screens/Finances';
import Training from './screens/Training';
import Offer from './screens/Offer';
import Scouting from './screens/Scouting';
import Transfers from './screens/Transfers';
import Fixtures from './screens/Fixtures';
import History from './screens/History';
import Home from './screens/Home';
import InboxScreen from './screens/InboxScreen';
import Match, { type LiveState } from './screens/Match';
import { runToEnd } from './engine/live';
import { summerTournaments, tournamentName } from './engine/international';
import NewGame from './screens/NewGame';
import International from './screens/International';
import Career from './screens/Career';
import Staff from './screens/Staff';
import Medical from './screens/Medical';
import SeasonReview from './screens/SeasonReview';
import PressRoom from './screens/PressRoom';
import Affiliates from './screens/Affiliates';
import DataHub from './screens/DataHub';
import ClubScreen from './screens/ClubScreen';
import StatsHub from './screens/StatsHub';
import Calendar from './screens/Calendar';
import { windowsFor } from './engine/windows';
import Records from './screens/Records';
import Tip, { TIPS } from './screens/Tip';
import { simulate } from './sim/client';
import NationalMatch from './screens/NationalMatch';
import { beginSummer, summerLabel, summerStep, summerTournamentFor } from './engine/summer';
import { NATION } from './engine/nations';
import FacilitiesScreen from './screens/FacilitiesScreen';
import { answer } from './engine/media';
import Placeholder from './screens/Placeholder';
import PlayerScreen from './screens/PlayerScreen';
import Settings from './screens/Settings';
import Squad from './screens/Squad';
import Table from './screens/Table';
import Tactics from './screens/Tactics';
import Youth from './screens/Youth';
import Frame from './screens/Frame';
import { isTyping, shortcutAction, SHORTCUT_HELP } from './screens/shortcuts';
/** Screens that don't depend on having a club, still open while you're out of work. */
const OPEN_WHEN_OUT = new Set<string>(['career', 'inbox', 'table', 'stats', 'records', 'settings', 'review']);
import { NAV, type Screen, NAV_LABEL } from './screens/shared';

function liveFx0(g: NonNullable<ReturnType<typeof useGame>['game']>, live: LiveState | null) {
  return live ? g.fixtures.find((f) => f.id === live.fixtureId) : undefined;
}

export default function App() {
  const { game: g, setGame, update, loading, oldSave, careers, activeId, leave, loadCareer, deleteCareer, importSave, restore } = useGame();
  const [theme, setTheme] = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [param, setParam] = useState<string | undefined>();
  // where you came from, for the Back button (and the browser's back)
  const [hist, setHist] = useState<Array<{ s: Screen; p?: string }>>([]);
  const backRef = useRef<() => void>(() => {});
  // keyboard shortcuts: the listener calls the latest handler (set each render, below)
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => keysRef.current(e);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);
  const pendingG = useRef(0);
  useEffect(() => {
    const onPop = () => backRef.current();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [live, setLive] = useState<LiveState | null>(null);
  const [sim, setSim] = useState<string | null>(null);
  const [simMenu, setSimMenu] = useState(false);
  const stopSim = useRef<() => void>(() => {});

  if (loading) {
    return <main className="ng ng--loading"><img className="ng__crest" src={`${import.meta.env.BASE_URL}crest-512.png`} alt="Football Dynasty" /><p className="hm-note" role="status">Loading your career…</p></main>;
  }
  if (!g) {
    return <NewGame oldSave={oldSave} careers={careers} onLoad={(id) => { void loadCareer(id); setScreen('home'); }} onDelete={(id) => void deleteCareer(id)} onImport={async (t) => { const e = await importSave(t); if (!e) setScreen('home'); return e; }} onStart={({ clubId, name, currency, world, source, style }) => { setGame(newGame({ seed: Math.floor(Math.random() * 2 ** 31), userClubId: clubId, managerName: name, currency, world, source, style })); setScreen('home'); }} />;
  }

  const go = (s: Screen, id?: string) => {
    if (s !== screen || id !== param) {
      setHist((h) => [...h.slice(-40), { s: screen, p: param }]);
      try { window.history.pushState({ fd: true }, ''); } catch { /* not available */ }
    }
    setScreen(s); setParam(id);
    if (s === 'inbox' && id) update((d) => markRead(d, id));
    document.querySelector('.fd-main')?.scrollTo(0, 0);
  };

  const back = () => {
    setHist((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setScreen(last.s); setParam(last.p);
      document.querySelector('.fd-main')?.scrollTo(0, 0);
      return h.slice(0, -1);
    });
  };
  backRef.current = back;

  /** On your match day: starts your match live (nothing is saved until full time). Otherwise moves on one day. */
  const play = () => {
    if (live) { setScreen('match'); return; }
    const fx = todaysFixture(g);
    if (fx) {
      const lm = startUserMatch(g);
      if (lm) { setLive({ fixtureId: fx.id, lm }); setScreen('match'); setParam(fx.id); }
      return;
    }
    update((d) => advanceDay(d));
  };

  /** Simulates ahead without watching: your matches are played with your tactics. Runs in steps so the page stays responsive. */
  const simAhead = async (kind: 'next' | 'through' | 'week' | 'month' | 'season') => {
    setSimMenu(false);
    if (live) return;
    setSim('Simulating…');
    const run = simulate(g, { kind: 'ahead', until: kind }, setSim);
    stopSim.current = run.stop;
    let d: GameState;
    try { d = await run.result; } catch { setSim(null); return; }
    setGame(d);
    setSim(null);
    go(d.career?.sacked ? 'career' : 'home');
  };

  /** Season rollover, including any summer tournament, behind the progress box. */
  const startSeason = async () => {
    const t = summerTournaments(g.year).map(tournamentName);
    setSim(t.length ? `Playing the ${t.join(' and ')} ${g.year + 1}…` : 'Preparing the new season…');
    let d: GameState;
    try { d = await simulate(g, { kind: 'rollover' }, () => {}).result; } catch { setSim(null); return; }
    setGame(d);
    setSim(null);
    go(d.career?.sacked ? 'career' : t.length ? 'international' : 'home');
  };

  const over = seasonOver(g);
  const summerReq = g.summer ? summerStep(g)?.request : undefined;
  const hasMatch = !!todaysFixture(g);
  keysRef.current = (e: KeyboardEvent) => {
    if (help && e.key === 'Escape') { setHelp(false); e.preventDefault(); return; }
    const a = shortcutAction(e.key, { pendingG: Date.now() - pendingG.current < 1500, typing: isTyping(e.target), modifier: e.ctrlKey || e.metaKey || e.altKey });
    pendingG.current = 0;
    if (!a || sim || document.querySelector('.sheet, .sim-overlay, [role=dialog][aria-modal=true]:not(.kb-help)')) return;
    const playing = !!live && screen === 'match';
    if (a.kind === 'goPending') { pendingG.current = Date.now(); return; }
    if (a.kind === 'help') { setHelp((v) => !v); e.preventDefault(); return; }
    if (playing && a.kind !== 'go') return; // the match screen has its own controls
    e.preventDefault();
    if (a.kind === 'go') { if (!outOfWork || OPEN_WHEN_OUT.has(a.screen)) go(a.screen); return; }
    if (a.kind === 'back') { if (hist.length) window.history.back(); return; }
    if (outOfWork) return;
    if (a.kind === 'continue') { if (live) setScreen('match'); else if (!over) play(); return; }
    if (a.kind === 'sim') { if (!live && !over) void simAhead(hasMatch ? 'through' : 'next'); return; }
    if (a.kind === 'search') { go('transfers'); setTimeout(() => (document.querySelector('input[aria-label="Player name"]') as HTMLInputElement | null)?.focus(), 50); }
  };
  const toMatch = daysToNextMatch(g);
  /** Full time: store the user's match (with their substitutions) and play the rest of the slot. */
  const finishLive = () => {
    if (!live) return;
    const done = structuredClone(live.lm);
    runToEnd(done);
    update((d) => { playMatchday(d, { fixtureId: live.fixtureId, lm: done }); });
    setLive(null);
    go('home');
  };
  const outOfWork = !!g.career?.sacked;
  const primary = outOfWork ? <span style={{ color: 'var(--on-navy-muted)', fontSize: 13, fontWeight: 600 }}>Out of work</span>
    : live
    ? (screen === 'match' ? <span style={{ color: 'var(--on-navy-muted)', fontSize: 13, fontWeight: 600 }}>Match in progress</span>
      : <FD.Button icon="play" onClick={() => setScreen('match')}>Back to match</FD.Button>)
    : over && summerReq ? <FD.Button icon="play" onClick={() => go('nationalMatch')}>Play {NATION[summerReq.h]?.name} v {NATION[summerReq.a]?.name}</FD.Button>
    : over && !g.summer && summerTournamentFor(g) ? <FD.Button icon="trophy" onClick={() => { update((d) => beginSummer(d)); go('international'); }}>Go to the {summerLabel(g)}</FD.Button>
    : over ? <FD.Button icon="trophy" onClick={() => void startSeason()}>Start {seasonLabel(g.year + 1)}</FD.Button>
    : (
      <div className="sim-actions">
        <div className="sim-menu">
          <FD.Button variant="secondary" icon="sim" onClick={() => setSimMenu((v) => !v)} aria-expanded={simMenu}><span className="sim-label">Sim</span></FD.Button>
          {simMenu && (
            <div className="sim-menu__list" role="menu">
              {hasMatch ? <button role="menuitem" onClick={() => void simAhead('through')}>Sim this match</button>
                : <button role="menuitem" onClick={() => void simAhead('next')}>To my next match{toMatch ? ` (${toMatch} ${toMatch === 1 ? 'day' : 'days'})` : ''}</button>}
              <button role="menuitem" onClick={() => void simAhead('week')}>Sim a week</button>
              <button role="menuitem" onClick={() => void simAhead('month')}>Sim four weeks</button>
              <button role="menuitem" onClick={() => void simAhead('season')}>Sim to end of season</button>
            </div>
          )}
        </div>
        <FD.Button icon={hasMatch ? 'play' : 'sim'} onClick={play} title={hasMatch ? undefined : 'Move on one day'}>{hasMatch ? 'Play match' : 'Continue'}</FD.Button>
      </div>
    );

  const club = g.clubs[g.userClubId];
  const shownFx = liveFx0(g, live) ?? todaysFixture(g);
  const slotLabel = over ? (g.summer ? `Summer · ${summerLabel(g)}` : 'Season finished') : shownFx ? (shownFx.comp === 'friendly' ? `Pre-season · ${shownFx.round}` : `${compInfo(g, shownFx.comp).name}, ${shownFx.round}`) : currentSlot(g).week === 0 ? 'Pre-season' : `Week ${currentSlot(g).week}`;
  const liveFx = liveFx0(g, live);
  const unread = g.inbox.filter((m) => m.unread).length;
  const navActive = screen === 'nationalMatch' ? 'international' : screen === 'player' ? (param && g.players[param]?.clubId !== g.userClubId ? 'transfers' : 'squad') : screen === 'match' ? 'fixtures' : screen === 'offer' ? 'transfers' : screen === 'club' ? (param === g.userClubId ? 'history' : 'table') : screen === 'contract' ? 'squad' : screen;

  let body: JSX.Element;
  switch (screen) {
    case 'home': body = <Home g={g} go={go} onPlay={play} onSimNext={() => void simAhead('next')} update={update} />; break;
    case 'squad': body = <Squad g={g} go={go} update={update} />; break;
    case 'player': body = <PlayerScreen g={g} id={param} go={go} act={{
      promote: (id) => update((d) => promote(d, id)), scout: (id) => update((d) => { startScouting(d, id); }),
      shortlist: (id) => update((d) => toggleShortlist(d, id)), transferList: (id) => update((d) => toggleTransferList(d, id)) }} update={update} />; break;
    case 'transfers': body = <Transfers g={g} go={go} update={update} />; break;
    case 'scouting': body = <Scouting g={g} go={go} update={update} />; break;
    case 'offer': body = <Offer g={g} id={param} go={go} submit={(id: string, o: OfferTerms) => update((d) => { makeOffer(d, id, o); })} />; break;
    case 'training': body = <Training g={g} update={update} />; break;
    case 'finances': body = <Finances g={g} update={update} />; break;
    case 'contract': body = <Contract key={param} g={g} id={param} go={go} update={update} />; break;
    case 'tactics': body = <Tactics g={g} go={go} update={update} liveNote={!!live} onAutoRotate={(on) => update((d) => setAutoRotate(d, on))} onChange={(f: Formation, l: string[]) => update((d) => setTactics(d, f, l))} />; break;
    case 'fixtures': body = <Fixtures g={g} go={go} />; break;
    case 'table': body = <Table g={g} go={go} />; break;
    case 'nationalMatch': body = <NationalMatch key={`${g.summer?.results.length}`} g={g} go={go} update={update} />; break;
    case 'records': body = <Records g={g} go={go} />; break;
    case 'stats': body = <StatsHub key={param ?? ''} g={g} go={go} initialView={param === 'compare' ? 'compare' : undefined} />; break;
    case 'calendar': body = <Calendar g={g} go={go} notes={windowsFor(g.clubs[g.userClubId].country, g.year).flatMap((w) => [{ date: w.from, text: `${w.label.replace(/^./, (c) => c.toUpperCase())} opens`, tone: 'teal' as const }, { date: w.to, text: 'Deadline day', tone: 'gold' as const }])} />; break;
    case 'club': body = <ClubScreen key={param} g={g} id={param} go={go} />; break;
    case 'facilities': body = <FacilitiesScreen g={g} update={update} />; break;
    case 'staff': body = <Staff g={g} update={update} />; break;
    case 'medical': body = <Medical g={g} go={go} update={update} />; break;
    case 'review': body = <SeasonReview g={g} go={go} />; break;
    case 'press': body = <PressRoom g={g} go={go} update={update} />; break;
    case 'affiliates': body = <Affiliates g={g} go={go} update={update} />; break;
    case 'data': body = <DataHub g={g} go={go} />; break;
    case 'career': body = <Career g={g} go={go} update={update} />; break;
    case 'international': body = <International g={g} go={go} update={update} />; break;
    case 'match': body = <Match key={live?.fixtureId ?? param} g={g} id={live?.fixtureId ?? param} live={live} setLive={setLive} go={go} onFinish={finishLive} />; break;
    case 'youth': body = <Youth g={g} go={go} onPromote={(id) => update((d) => promote(d, id))} />; break;
    case 'history': body = <History g={g} />; break;
    case 'inbox': body = <InboxScreen g={g} selectedId={param} go={go} onOpen={(id) => { setParam(id); update((d) => markRead(d, id)); }} onBid={(bid, ok) => update((d) => respondToBid(d, bid, ok))} onAnswer={(mid, i) => update((d) => { answer(d, mid, i); })} />; break;
    case 'settings': body = <Settings g={g} theme={theme} setTheme={setTheme} setCurrency={(c) => update((d) => { d.currency = c; })} onNewCareer={() => { leave(); setScreen('home'); }} careers={careers} activeId={activeId} onLoad={(id) => { void loadCareer(id); setScreen('home'); }} onDelete={(id) => void deleteCareer(id)} onImport={async (t) => { const e = await importSave(t); if (!e) go('home'); return e; }} onRestore={(s) => { restore(s); setLive(null); }} />; break;
    default: body = <Placeholder id={screen} />;
  }
  // a first-visit tip above each main screen
  if (TIPS[screen] && !(screen === 'match' && !live)) body = <>{<Tip key={screen} id={screen} />}{body}</>;
  // out of work: only the career screen until you take a new job
  if (outOfWork && !live && !OPEN_WHEN_OUT.has(screen)) body = <Career g={g} go={go} update={update} />;

  return (
    <Frame
      crestSrc={`${import.meta.env.BASE_URL}crest-128.png`} club={outOfWork && !live ? g.managerName : club.name}
      season={outOfWork && !live ? `Unattached manager · ${currentDate(g)}` : `Season ${g.year - g.manager.since + 1} · ${slotLabel} · ${liveFx ? formatDate(liveFx.date) : currentDate(g)}`}
      budget={outOfWork && !live ? undefined : toCur(club.transferBudget, g.currency)} currency={g.currency}
      onCurrencyChange={(c: 'EUR' | 'USD' | 'GBP') => update((d) => { d.currency = c; })}
      active={outOfWork && !live && !OPEN_WHEN_OUT.has(screen) ? 'career' : navActive} nav={outOfWork && !live ? NAV(unread).filter((n) => OPEN_WHEN_OUT.has(n.id as Screen)) : NAV(unread)} onNavigate={(id) => go(id as Screen)} primaryAction={primary}
    >
      {hist.length && !(outOfWork && !live && !OPEN_WHEN_OUT.has(screen)) ? (
        <button type="button" className="nav-back" onClick={() => { try { window.history.back(); } catch { back(); } }} aria-label={`Back to ${NAV_LABEL[hist[hist.length - 1].s] ?? 'previous screen'}`}>
          <span aria-hidden="true">←</span> Back{NAV_LABEL[hist[hist.length - 1].s] ? ` to ${NAV_LABEL[hist[hist.length - 1].s]}` : ''}
        </button>
      ) : null}
      {body}
      {help ? (
        <div className="kb-help" role="dialog" aria-modal="true" aria-labelledby="kb-h" onClick={() => setHelp(false)}>
          <div className="kb-help__box pg-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="pg-h" id="kb-h">Keyboard shortcuts</h2>
            <dl className="kb-help__list">{SHORTCUT_HELP.map(([k, d]) => <div key={k}><dt><kbd>{k}</kbd></dt><dd>{d}</dd></div>)}</dl>
            <FD.Button variant="secondary" onClick={() => setHelp(false)}>Close</FD.Button>
          </div>
        </div>
      ) : null}
      {sim && (
        <div className="sim-overlay" role="status" aria-live="polite">
          <div className="sim-overlay__box pg-card">
            <strong>{sim}</strong>
            <span className="hm-note">Your matches are played with your current tactics. Bids and offers that arrive meanwhile wait in your inbox.</span>
            {!sim.startsWith('Playing') && !sim.startsWith('Preparing') && <FD.Button variant="secondary" onClick={() => stopSim.current()}>Stop</FD.Button>}
          </div>
        </div>
      )}
    </Frame>
  );
}
