import { useState } from 'react';
import { FD } from './ds';
import { currentDate, markRead, newGame, playMatchday, promote, seasonOver, setAutoRotate, setTactics, startNewSeason, startUserMatch, userFixture } from './engine/game';
import type { Formation } from './engine/match';
import { formatDate } from './engine/fixtures';
import { seasonLabel } from './engine/types';
import { hasOldSave, toCur, useGame, useTheme } from './store';
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
import NewGame from './screens/NewGame';
import International from './screens/International';
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
  const { game: g, setGame, update } = useGame();
  const [theme, setTheme] = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [param, setParam] = useState<string | undefined>();
  const [live, setLive] = useState<LiveState | null>(null);

  if (!g) {
    return <NewGame oldSave={hasOldSave()} onStart={({ clubId, name, currency, world, source }) => { setGame(newGame({ seed: Math.floor(Math.random() * 2 ** 31), userClubId: clubId, managerName: name, currency, world, source })); setScreen('home'); }} />;
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
    update((d) => { do { playMatchday(d); } while (!seasonOver(d) && !userFixture(d)); });
    go('home');
  };

  const over = seasonOver(g);
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
  const primary = live
    ? (screen === 'match' ? <span style={{ color: 'var(--on-navy-muted)', fontSize: 13, fontWeight: 600 }}>Match in progress</span>
      : <FD.Button icon="play" onClick={() => setScreen('match')}>Back to match</FD.Button>)
    : over ? <FD.Button icon="trophy" onClick={() => { update((d) => startNewSeason(d)); go('home'); }}>Start {seasonLabel(g.year + 1)}</FD.Button>
    : <FD.Button icon={hasMatch ? 'play' : 'sim'} onClick={play}>{hasMatch ? 'Play match' : 'Continue'}</FD.Button>;

  const club = g.clubs[g.userClubId];
  const shownFx = liveFx0(g, live) ?? userFixture(g);
  const slotLabel = over ? 'Season finished' : shownFx ? `${compInfo(g, shownFx.comp).name}, ${shownFx.round}` : currentSlot(g).week === 0 ? 'Pre-season' : `Week ${currentSlot(g).week}`;
  const liveFx = liveFx0(g, live);
  const unread = g.inbox.filter((m) => m.unread).length;
  const navActive = screen === 'player' ? (param && g.players[param]?.clubId !== g.userClubId ? 'transfers' : 'squad') : screen === 'match' ? 'fixtures' : screen === 'offer' ? 'transfers' : screen === 'contract' ? 'squad' : screen;

  let body: JSX.Element;
  switch (screen) {
    case 'home': body = <Home g={g} go={go} onPlay={play} />; break;
    case 'squad': body = <Squad g={g} go={go} />; break;
    case 'player': body = <PlayerScreen g={g} id={param} go={go} act={{
      promote: (id) => update((d) => promote(d, id)), scout: (id) => update((d) => { startScouting(d, id); }),
      shortlist: (id) => update((d) => toggleShortlist(d, id)), transferList: (id) => update((d) => toggleTransferList(d, id)) }} />; break;
    case 'transfers': body = <Transfers g={g} go={go} update={update} />; break;
    case 'scouting': body = <Scouting g={g} go={go} update={update} />; break;
    case 'offer': body = <Offer g={g} id={param} go={go} submit={(id: string, o: OfferTerms) => update((d) => { makeOffer(d, id, o); })} />; break;
    case 'training': body = <Training g={g} update={update} />; break;
    case 'finances': body = <Finances g={g} />; break;
    case 'contract': body = <Contract key={param} g={g} id={param} go={go} update={update} />; break;
    case 'tactics': body = <Tactics g={g} liveNote={!!live} onAutoRotate={(on) => update((d) => setAutoRotate(d, on))} onChange={(f: Formation, l: string[]) => update((d) => setTactics(d, f, l))} />; break;
    case 'fixtures': body = <Fixtures g={g} go={go} />; break;
    case 'table': body = <Table g={g} go={go} />; break;
    case 'international': body = <International g={g} go={go} />; break;
    case 'match': body = <Match key={live?.fixtureId ?? param} g={g} id={live?.fixtureId ?? param} live={live} setLive={setLive} go={go} onFinish={finishLive} />; break;
    case 'youth': body = <Youth g={g} go={go} onPromote={(id) => update((d) => promote(d, id))} />; break;
    case 'history': body = <History g={g} />; break;
    case 'inbox': body = <InboxScreen g={g} selectedId={param} go={go} onOpen={(id) => { setParam(id); update((d) => markRead(d, id)); }} onBid={(bid, ok) => update((d) => respondToBid(d, bid, ok))} />; break;
    case 'settings': body = <Settings g={g} theme={theme} setTheme={setTheme} setCurrency={(c) => update((d) => { d.currency = c; })} onNewCareer={() => { setGame(null); setScreen('home'); }} />; break;
    default: body = <Placeholder id={screen} />;
  }

  return (
    <FD.AppFrame
      crestSrc={`${import.meta.env.BASE_URL}crest-128.png`} club={club.name}
      season={`Season ${g.year - g.manager.since + 1} · ${slotLabel} · ${liveFx ? formatDate(liveFx.date) : currentDate(g)}`}
      budget={toCur(club.transferBudget, g.currency)} currency={g.currency}
      onCurrencyChange={(c: 'EUR' | 'USD' | 'GBP') => update((d) => { d.currency = c; })}
      active={navActive} nav={NAV(unread)} onNavigate={(id: Screen) => go(id)} primaryAction={primary}
    >
      {body}
    </FD.AppFrame>
  );
}
