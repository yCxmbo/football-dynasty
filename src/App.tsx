import { useRef, useState } from 'react';
import { FD } from './ds';
import { currentDate, markRead, newGame, playMatchday, promote, seasonOver, setAutoRotate, setTactics, startUserMatch, userFixture } from './engine/game';
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
import { NAV, type Screen } from './screens/shared';

function liveFx0(g: NonNullable<ReturnType<typeof useGame>['game']>, live: LiveState | null) {
  return live ? g.fixtures.find((f) => f.id === live.fixtureId) : undefined;
}

export default function App() {
  const { game: g, setGame, update, loading, oldSave, careers, activeId, leave, loadCareer, deleteCareer, importSave } = useGame();
  const [theme, setTheme] = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [param, setParam] = useState<string | undefined>();
  const [live, setLive] = useState<LiveState | null>(null);
  const [sim, setSim] = useState<string | null>(null);
  const [simMenu, setSimMenu] = useState(false);
  const stopSim = useRef<() => void>(() => {});

  if (loading) {
    return <main className="ng ng--loading"><img className="ng__crest" src={`${import.meta.env.BASE_URL}crest-512.png`} alt="Football Dynasty" /><p className="hm-note" role="status">Loading your career…</p></main>;
  }
  if (!g) {
    return <NewGame oldSave={oldSave} careers={careers} onLoad={(id) => { void loadCareer(id); setScreen('home'); }} onDelete={(id) => void deleteCareer(id)} onImport={async (t) => { const e = await importSave(t); if (!e) setScreen('home'); return e; }} onStart={({ clubId, name, currency, world, source }) => { setGame(newGame({ seed: Math.floor(Math.random() * 2 ** 31), userClubId: clubId, managerName: name, currency, world, source })); setScreen('home'); }} />;
  }

  const go = (s: Screen, id?: string) => {
    setScreen(s); setParam(id);
    if (s === 'inbox' && id) update((d) => markRead(d, id));
    document.querySelector('.fd-main')?.scrollTo(0, 0);
  };

  /** Starts the user's match live (nothing is saved until full time). Otherwise skips ahead to the next match. */
  const play = () => {
    if (live) { setScreen('match'); return; }
    const fx = userFixture(g);
    if (fx) {
      const lm = startUserMatch(g);
      if (lm) { setLive({ fixtureId: fx.id, lm }); setScreen('match'); setParam(fx.id); }
      return;
    }
    update((d) => { do { playMatchday(d); } while (!seasonOver(d) && !userFixture(d) && !d.career?.sacked); });
    go('home');
  };

  /** Simulates ahead without watching: your matches are played with your tactics. Runs in steps so the page stays responsive. */
  const simAhead = async (kind: 'match' | 'month' | 'season') => {
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
  const hasMatch = !!userFixture(g);
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
              <button role="menuitem" onClick={() => void simAhead('match')}>{hasMatch ? 'Sim this match' : 'Sim to after my next match'}</button>
              <button role="menuitem" onClick={() => void simAhead('month')}>Sim four weeks</button>
              <button role="menuitem" onClick={() => void simAhead('season')}>Sim to end of season</button>
            </div>
          )}
        </div>
        <FD.Button icon={hasMatch ? 'play' : 'sim'} onClick={play}>{hasMatch ? 'Play match' : 'Continue'}</FD.Button>
      </div>
    );

  const club = g.clubs[g.userClubId];
  const shownFx = liveFx0(g, live) ?? userFixture(g);
  const slotLabel = over ? (g.summer ? `Summer · ${summerLabel(g)}` : 'Season finished') : shownFx ? `${compInfo(g, shownFx.comp).name}, ${shownFx.round}` : currentSlot(g).week === 0 ? 'Pre-season' : `Week ${currentSlot(g).week}`;
  const liveFx = liveFx0(g, live);
  const unread = g.inbox.filter((m) => m.unread).length;
  const navActive = screen === 'nationalMatch' ? 'international' : screen === 'player' ? (param && g.players[param]?.clubId !== g.userClubId ? 'transfers' : 'squad') : screen === 'match' ? 'fixtures' : screen === 'offer' ? 'transfers' : screen === 'contract' ? 'squad' : screen;

  let body: JSX.Element;
  switch (screen) {
    case 'home': body = <Home g={g} go={go} onPlay={play} />; break;
    case 'squad': body = <Squad g={g} go={go} />; break;
    case 'player': body = <PlayerScreen g={g} id={param} go={go} act={{
      promote: (id) => update((d) => promote(d, id)), scout: (id) => update((d) => { startScouting(d, id); }),
      shortlist: (id) => update((d) => toggleShortlist(d, id)), transferList: (id) => update((d) => toggleTransferList(d, id)) }} update={update} />; break;
    case 'transfers': body = <Transfers g={g} go={go} update={update} />; break;
    case 'scouting': body = <Scouting g={g} go={go} update={update} />; break;
    case 'offer': body = <Offer g={g} id={param} go={go} submit={(id: string, o: OfferTerms) => update((d) => { makeOffer(d, id, o); })} />; break;
    case 'training': body = <Training g={g} update={update} />; break;
    case 'finances': body = <Finances g={g} />; break;
    case 'contract': body = <Contract key={param} g={g} id={param} go={go} update={update} />; break;
    case 'tactics': body = <Tactics g={g} liveNote={!!live} onAutoRotate={(on) => update((d) => setAutoRotate(d, on))} onChange={(f: Formation, l: string[]) => update((d) => setTactics(d, f, l))} />; break;
    case 'fixtures': body = <Fixtures g={g} go={go} />; break;
    case 'table': body = <Table g={g} go={go} />; break;
    case 'nationalMatch': body = <NationalMatch key={`${g.summer?.results.length}`} g={g} go={go} update={update} />; break;
    case 'facilities': body = <FacilitiesScreen g={g} update={update} />; break;
    case 'staff': body = <Staff g={g} update={update} />; break;
    case 'career': body = <Career g={g} go={go} update={update} />; break;
    case 'international': body = <International g={g} go={go} update={update} />; break;
    case 'match': body = <Match key={live?.fixtureId ?? param} g={g} id={live?.fixtureId ?? param} live={live} setLive={setLive} go={go} onFinish={finishLive} />; break;
    case 'youth': body = <Youth g={g} go={go} onPromote={(id) => update((d) => promote(d, id))} />; break;
    case 'history': body = <History g={g} />; break;
    case 'inbox': body = <InboxScreen g={g} selectedId={param} go={go} onOpen={(id) => { setParam(id); update((d) => markRead(d, id)); }} onBid={(bid, ok) => update((d) => respondToBid(d, bid, ok))} onAnswer={(mid, i) => update((d) => { answer(d, mid, i); })} />; break;
    case 'settings': body = <Settings g={g} theme={theme} setTheme={setTheme} setCurrency={(c) => update((d) => { d.currency = c; })} onNewCareer={() => { leave(); setScreen('home'); }} careers={careers} activeId={activeId} onLoad={(id) => { void loadCareer(id); setScreen('home'); }} onDelete={(id) => void deleteCareer(id)} onImport={async (t) => { const e = await importSave(t); if (!e) go('home'); return e; }} />; break;
    default: body = <Placeholder id={screen} />;
  }
  // out of work: only the career screen until you take a new job
  if (outOfWork && !live) body = <Career g={g} go={go} update={update} />;

  return (
    <FD.AppFrame
      crestSrc={`${import.meta.env.BASE_URL}crest-128.png`} club={club.name}
      season={`Season ${g.year - g.manager.since + 1} · ${slotLabel} · ${liveFx ? formatDate(liveFx.date) : currentDate(g)}`}
      budget={toCur(club.transferBudget, g.currency)} currency={g.currency}
      onCurrencyChange={(c: 'EUR' | 'USD' | 'GBP') => update((d) => { d.currency = c; })}
      active={navActive} nav={NAV(unread)} onNavigate={(id: Screen) => go(id)} primaryAction={primary}
    >
      {body}
      {sim && (
        <div className="sim-overlay" role="status" aria-live="polite">
          <div className="sim-overlay__box pg-card">
            <strong>{sim}</strong>
            <span className="hm-note">Your matches are played with your current tactics. Bids and offers that arrive meanwhile wait in your inbox.</span>
            {!sim.startsWith('Playing') && !sim.startsWith('Preparing') && <FD.Button variant="secondary" onClick={() => stopSim.current()}>Stop</FD.Button>}
          </div>
        </div>
      )}
    </FD.AppFrame>
  );
}
