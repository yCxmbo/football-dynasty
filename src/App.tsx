import { useState } from 'react';
import { FD } from './ds';
import { currentDate, markRead, newGame, playMatchday, promote, seasonOver, setTactics, startNewSeason, userFixture } from './engine/game';
import type { Formation } from './engine/match';
import { formatDate } from './engine/fixtures';
import { seasonLabel } from './engine/types';
import { toCur, useGame, useTheme } from './store';
import { makeOffer, respondToBid, startScouting, toggleShortlist, toggleTransferList, type OfferTerms } from './engine/transfers';
import Contract from './screens/Contract';
import Offer from './screens/Offer';
import Scouting from './screens/Scouting';
import Transfers from './screens/Transfers';
import Fixtures from './screens/Fixtures';
import History from './screens/History';
import Home from './screens/Home';
import InboxScreen from './screens/InboxScreen';
import Match from './screens/Match';
import NewGame from './screens/NewGame';
import Placeholder from './screens/Placeholder';
import PlayerScreen from './screens/PlayerScreen';
import Settings from './screens/Settings';
import Squad from './screens/Squad';
import Table from './screens/Table';
import Tactics from './screens/Tactics';
import Youth from './screens/Youth';
import { NAV, type Screen } from './screens/shared';

export default function App() {
  const { game: g, setGame, update } = useGame();
  const [theme, setTheme] = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [param, setParam] = useState<string | undefined>();
  const [live, setLive] = useState(false);

  if (!g) {
    return <NewGame onStart={({ clubId, name, currency }) => { setGame(newGame({ seed: Math.floor(Math.random() * 2 ** 31), userClubId: clubId, managerName: name, currency })); setScreen('home'); }} />;
  }

  const go = (s: Screen, id?: string) => {
    setScreen(s); setParam(id); setLive(false);
    if (s === 'inbox' && id) update((d) => markRead(d, id));
    document.querySelector('.fd-main')?.scrollTo(0, 0);
  };

  /** Plays the current matchday; if the user has a match, replay it live. */
  const play = () => {
    const fx = userFixture(g);
    update((d) => { playMatchday(d); });
    if (fx) { setScreen('match'); setParam(fx.id); setLive(true); } else go('home');
  };

  const over = seasonOver(g);
  const hasMatch = !!userFixture(g);
  const primary = screen === 'match' && live
    ? <span style={{ color: 'var(--on-navy-muted)', fontSize: 13, fontWeight: 600 }}>Match in progress</span>
    : over ? <FD.Button icon="trophy" onClick={() => { update((d) => startNewSeason(d)); go('home'); }}>Start {seasonLabel(g.year + 1)}</FD.Button>
    : <FD.Button icon="play" onClick={play}>{hasMatch ? 'Play match' : 'Continue'}</FD.Button>;

  const club = g.clubs[g.userClubId];
  const liveFx = screen === 'match' && live ? g.fixtures.find((f) => f.id === param) : undefined;
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
    case 'contract': body = <Contract key={param} g={g} id={param} go={go} update={update} />; break;
    case 'tactics': body = <Tactics g={g} onChange={(f: Formation, l: string[]) => update((d) => setTactics(d, f, l))} />; break;
    case 'fixtures': body = <Fixtures g={g} go={go} />; break;
    case 'table': body = <Table g={g} />; break;
    case 'match': body = <Match key={param} g={g} id={param} live={live} go={go} onFinish={() => go('home')} />; break;
    case 'youth': body = <Youth g={g} go={go} onPromote={(id) => update((d) => promote(d, id))} />; break;
    case 'history': body = <History g={g} />; break;
    case 'inbox': body = <InboxScreen g={g} selectedId={param} go={go} onOpen={(id) => { setParam(id); update((d) => markRead(d, id)); }} onBid={(bid, ok) => update((d) => respondToBid(d, bid, ok))} />; break;
    case 'settings': body = <Settings g={g} theme={theme} setTheme={setTheme} setCurrency={(c) => update((d) => { d.currency = c; })} onNewCareer={() => { setGame(null); setScreen('home'); }} />; break;
    default: body = <Placeholder id={screen} />;
  }

  return (
    <FD.AppFrame
      crestSrc="/crest-128.png" club={club.name}
      season={`Season ${g.year - g.manager.since + 1} · ${liveFx ? `Matchday ${liveFx.matchday} · ${formatDate(liveFx.date)}` : `${over ? 'Season finished' : `Matchday ${g.matchday}`} · ${currentDate(g)}`}`}
      budget={toCur(club.transferBudget, g.currency)} currency={g.currency}
      onCurrencyChange={(c: 'EUR' | 'USD' | 'GBP') => update((d) => { d.currency = c; })}
      active={navActive} nav={NAV(unread)} onNavigate={(id: Screen) => go(id)} primaryAction={primary}
    >
      {body}
    </FD.AppFrame>
  );
}
