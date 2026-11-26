import { useState } from 'react';
import { FD } from '../ds';

/* First-visit tips. Remembered per browser (not per save), so they don't come back with every new career. */
const KEY = 'football-dynasty:tips';
type Seen = { off?: boolean; seen: string[] };
function read(): Seen { try { return JSON.parse(localStorage.getItem(KEY) ?? '') as Seen; } catch { return { seen: [] }; } }
function write(v: Seen) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode: tips just reappear */ } }
export function resetTips() { write({ seen: [] }); }
export function tipsOff() { return !!read().off; }

export const TIPS: Record<string, { title: string; text: string }> = {
  home: { title: 'Welcome, boss', text: 'Play match plays your next game live; Continue skips days without one. Sim (next to it) plays ahead without watching: one match, four weeks or the whole season. The board\'s target and confidence are below the table.' },
  squad: { title: 'Your squad', text: 'Gold stars are ability, compared with your league; the outline stars are potential. Click a player for his attributes, contract, loans and transfer list. U21 and U18 are your academy squads.' },
  tactics: { title: 'Tactics', text: 'Pick a formation and click two players to swap them. Players out of position perform worse. Rotate tired players (on by default) rests starters under 70% condition for one match.' },
  training: { title: 'Training', text: 'Harder, technical weeks develop players faster but raise the injury risk. Give young players an individual focus to steer their growth. Staff and the training ground add to all of this.' },
  transfers: { title: 'Transfers', text: 'Windows: pre-season and mid-season. Search, scout (attributes show as ranges until you know a player), then make an offer: fee, instalments and add-ons to the club, wage and role to the player. You can also ask to loan fringe players.' },
  scouting: { title: 'Scouting', text: 'Follow up to five players; each matchday adds knowledge until you get a full report. Bids for your players arrive here and in the inbox.' },
  finances: { title: 'Finances', text: 'Every matchday brings gates, TV, sponsorship and merchandise, and costs wages, staff and upkeep. Prize money arrives at season end, when the board sets new budgets.' },
  table: { title: 'Competitions', text: 'Every league and cup in the world, by country, plus the continental competitions. Pick a country at the top right.' },
  international: { title: 'International football', text: 'National teams pick the best of their nationality worldwide. Tournaments are played in the summer between seasons. Manage a nation alongside your club on the National team tab.' },
  career: { title: 'Your career', text: 'The board\'s confidence carries over between seasons: miss targets badly and you\'re sacked. Good seasons bring offers; vacancies open every summer. Achievements are at the bottom.' },
  staff: { title: 'Staff', text: 'Six roles rated 1–20 (10 is average). Better staff speed up development, recovery and scouting and shorten injuries. New candidates every summer.' },
  facilities: { title: 'Stadium and facilities', text: 'Expand the ground when demand is higher than capacity, and upgrade the training ground and academy. Work is paid from the balance and the transfer budget.' },
  youth: { title: 'Academy', text: 'Silver stars mark youth players. Promote the best to the first team (they get a professional contract), or loan them out to play. A new intake arrives each summer.' },
  match: { title: 'Match day', text: 'Choose a team talk before kickoff and at half-time. Change speed, make up to five substitutions (the match pauses), or sim to the end. Nothing is saved until full time.' },
};

export default function Tip({ id }: { id: keyof typeof TIPS | string }) {
  const [state, setState] = useState(read);
  const tip = TIPS[id];
  if (!tip || state.off || state.seen.includes(id)) return null;
  const save = (v: Seen) => { write(v); setState(v); };
  return (
    <aside className="tip pg-card" role="note">
      <div className="tip__body"><strong>{tip.title}</strong><span>{tip.text}</span></div>
      <div className="tip__actions">
        <FD.Button size="sm" onClick={() => save({ ...state, seen: [...state.seen, id] })}>Got it</FD.Button>
        <FD.Button size="sm" variant="ghost" onClick={() => save({ ...state, off: true })}>Hide all tips</FD.Button>
      </div>
    </aside>
  );
}
