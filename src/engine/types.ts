import type { Position } from './ratings';
import type { Formation } from './match';
import type { ContinentalDef, CountryDef, CupDef, LeagueDef } from './worlddef';

export interface WorldMeta { name: string; source: 'builtin' | 'real' | 'import'; userCountry: string; countries: CountryDef[]; leagues: LeagueDef[]; cups: CupDef[]; continental: ContinentalDef[]; /** Named derbies. */ rivalries?: import('./rivalries').Rivalry[] }

export type Currency = 'EUR' | 'USD' | 'GBP';
export type Squad = 'First team' | 'U21' | 'U18';
export type ContractType = 'full-time' | 'youth';
export type Morale = 'high' | 'ok' | 'low';
export type Familiarity = 'natural' | 'accomplished' | 'competent' | 'unconvincing' | 'awkward';

export interface Player {
  id: string;
  clubId: string;
  name: string;
  nationality: string;
  pos: Position;
  positions: Record<string, Familiarity>;
  age: number;
  attributes: Record<string, number>;
  /** Hidden Current Ability 1–200, derived from attributes. */
  ability: number;
  /** Hidden Potential Ability 1–200. */
  potential: number;
  /** Hidden attributes 1–20 (never shown as numbers). */
  hidden: { professionalism: number; injuryProneness: number; consistency: number; bigMatches: number };
  squad: Squad;
  contractType: ContractType;
  number: number;
  wage: number; // weekly, base currency (EUR)
  value: number; // base currency
  contractEnd: number; // season year the contract ends
  morale: Morale;
  injuredFor: number; // matchdays
  /** Fitness 0–100: drops in matches, recovers between them. */
  condition?: number;
  suspendedFor: number; // matchdays
  yellowCards: number;
  captain?: boolean;
  career: SeasonLine[];
  current: { apps: number; goals: number; assists: number; ratingSum: number };
  releaseClause?: number;
  /** Attribute changes this season (shown on development cards). */
  progress?: Record<string, number>;
  /** Current Ability at the start of the season. */
  caStart?: number;
  /** Season the player joined the current club. */
  joined?: number;
  /** Generated at the start to complete a squad of named players: never above his nation's usual level for international selection. */
  filler?: boolean;
  /** Season awards won, newest first, e.g. "Golden Ball 2025/26". */
  awards?: string[];
  /** Agreed to join this club on a free when his contract ends. */
  preContract?: string;
  /** On loan: the owning club, the season it ends, and the squad he returns to. */
  loan?: import('./loans').Loan;
  /** International career: caps, goals and tournaments won. */
  intl?: { caps: number; goals: number; titles: string[] };
}

export type SessionType = 'fitness' | 'technical' | 'tactical' | 'setpieces' | 'matchprep' | 'recovery' | 'rest' | 'match';
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type Intensity = 'low' | 'normal' | 'high';
export interface Training { week: Record<Day, SessionType[]>; intensity: Intensity; focus: Record<string, string> }

export interface Ledger {
  income: { gate: number; tv: number; sponsorship: number; merchandise: number; prize: number; sales: number };
  expenses: { wages: number; staff: number; transfers: number; facilities?: number };
  balanceHistory: number[];
}

/** clubId for players without a club. */
export const FREE_AGENT = 'free';

export interface SeasonLine { season: string; club: string; apps: number; goals: number; rating?: number; honour?: string }

export interface Club {
  id: string;
  name: string;
  short: string;
  reputation: number; // 1–100
  stadium: string;
  capacity: number;
  /** A reserve side: can't be promoted. */
  reserve?: boolean;
  /** Training ground and academy levels, and building work (your club; others use defaults). */
  facilities?: import('./facilities').Facilities;
  nickname: string;
  founded: number;
  balance: number;
  transferBudget: number;
  wageBudget: number; // weekly
  /** Tier of the club's league (1 = top), 0 for clubs that only play continental football. */
  division: number;
  /** League id from the world definition, if the club plays in a league. */
  league?: string;
  country: string;
  /** Badge colours [primary, secondary] (hex). */
  colours?: [string, string];
}

export type CompId = string;
export interface CompInfo {
  id: string; name: string; short: string; kind: 'league' | 'cup' | 'continental' | 'super' | 'playoff' | 'title' | 'friendly';
  country?: string; tier?: number; rounds?: string[]; leagueId?: string; rank?: number; size?: number; main?: boolean;
}

/** One dated slot in the season calendar; each "Continue" plays one slot. */
export interface Slot { index: number; date: string; week: number; day: 'Sat' | 'Sun' | 'Tue' | 'Wed' | 'Thu'; entries: Array<{ comp: CompId; round: string }> }

export interface CupState { round: number; alive: string[]; winner?: string; runnerUp?: string; exits: Record<string, string>; /** League phase: the top eight, who wait for the play-off winners. */ seeds?: string[] }

export interface Fixture {
  id: string;
  /** Calendar slot (1-based). */
  matchday: number;
  date: string;
  homeId: string;
  awayId: string;
  comp: CompId;
  round: string;
  /** Knockout: a draw goes to penalties. */
  ko?: boolean;
  neutral?: boolean;
  group?: number;
  result?: MatchResult;
}

export type EventType = 'goal' | 'penalty' | 'owngoal' | 'yellow' | 'red' | 'sub' | 'injury' | 'chance' | 'save' | 'whistle';
export interface MatchEvent { minute: number; order: number; type: EventType; side?: 'home' | 'away'; playerId?: string; player?: string; score?: [number, number]; text: string }
export interface PlayerRating { playerId: string; rating: number; goals: number; assists: number; card?: 'yellow' | 'red'; subbedOff?: number; subbedOn?: number; injured?: boolean; minutes: number }
export interface MatchStats { possession: [number, number]; shots: [number, number]; onTarget: [number, number]; xg: [number, number]; corners: [number, number]; fouls: [number, number]; yellow: [number, number]; red: [number, number]; passAcc: [number, number] }
export interface MatchResult { score: [number, number]; pens?: [number, number]; winnerId?: string; events: MatchEvent[]; stats: MatchStats; ratings: { home: PlayerRating[]; away: PlayerRating[] } }

export interface InboxMessage { id: string; category: 'board' | 'transfers' | 'scouting' | 'medical' | 'media' | 'training' | 'youth' | 'match' | 'finance'; from: string; role?: string; date: string; subject: string; body: string[]; unread: boolean; bidId?: string; playerId?: string; /** A question to answer (press conference, player request). */ choice?: import('./media').Choice }

/** An AI club's bid for one of the user's players. */
export interface Bid { id: string; playerId: string; fromClubId: string; fee: number; status: 'open' | 'accepted' | 'rejected' | 'expired' }
export interface Installment { clubId: string; perMatchday: number; remaining: number }
export interface Negotiation { attempts: number; lastResponse?: OfferResponse; blockedUntilWindow?: boolean }
export interface OfferResponse { status: 'accepted' | 'rejected' | 'counter'; message: string; counter?: number }

export interface SeasonRecord { season: string; division: string; pos: number; pts: number; champion: string; topScorer?: { name: string; goals: number }; manager: string; isYou: boolean; movement?: 'promoted' | 'relegated'; cup?: string; leagueCup?: string; europe?: string }
export interface Trophy { name: string; tier: 'league' | 'cup' | 'continental' | 'super'; seasons: string[] }

export interface GameState {
  version: 3;
  seed: number;
  rngState: number;
  year: number; // season starts in this year
  matchday: number; // next matchday to play (1-based)
  userClubId: string;
  managerName: string;
  currency: Currency;
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  fixtures: Fixture[];
  calendar: Slot[];
  /** League weeks this season (rounds of the longest league). */
  leagueWeeks: number;
  /** The world: countries, leagues, cups and continental competitions (clubs live in `clubs`). */
  world: WorldMeta;
  /** This season's competitions, including play-offs and super cups. */
  comps: Record<string, CompInfo>;
  cups: Record<string, CupState>;
  /** Continental group draws (club ids) per competition. */
  groups: Record<string, string[][]>;
  /** Qualified clubs per competition for the coming season (continental, super cups). */
  qualified: Record<string, string[]>;
  /** Summer tournaments played so far (World Cup, Euro, Copa América). */
  internationals?: import('./international').Tournament[];
  /** The national team you manage alongside your club, if any. */
  nationalJob?: import('./nationaljob').NationalJob;
  /** Your coaching style, and the season you last changed it. */
  managerStyle?: import('./style').ManagerStyle;
  styleChanged?: number;
  /** Pre-season: friendly offers, friendlies played this summer, and what each arranged one pays. */
  friendlyOffers?: import('./friendlies').FriendlyOffer[];
  preseason?: number;
  friendlyFees?: Record<string, number>;
  /** Head-to-head records of every derby, and derbies you have won. */
  derbies?: Record<string, import('./rivalries').DerbyRecord>;
  derbyWins?: number;
  /** End-of-season awards: the latest season in full, and every Golden Ball and Golden Boy. */
  awards?: import('./awards').Awards;
  /** AI managers: every other club's, and those out of work. */
  managers?: import('./managers').ManagersState;
  /** Transfer rumours before the next window. */
  rumours?: import('./market').Rumour[];
  /** The pundits' predicted tables for this season. */
  predictions?: import('./preview').Predictions;
  /** Your team instructions. */
  instructions?: import('./instructions').Instructions;
  /** Your chosen set-piece takers. */
  setPieces?: import('./live').SetPieceTakers;
  /** All-time records across the world. */
  records?: import('./records').Records;
  /** Achievements unlocked, with the season. */
  achievements?: Record<string, string>;
  /** The summer tournament you're managing live, if any (your results so far). */
  summer?: import('./summer').SummerState;
  /** Promises of more games made to unhappy players. */
  promises?: import('./media').PlayerPromise[];
  /** Your backroom staff by role, and candidates on the market. */
  staff?: Partial<Record<import('./staff').StaffRole, import('./staff').StaffMember>>;
  staffPool?: import('./staff').StaffMember[];
  /** Your career across clubs: board trust, offers, vacancies, past clubs. */
  career?: import('./career').CareerState;
  inbox: InboxMessage[];
  history: Record<string, SeasonRecord[]>; // by club id
  trophies: Record<string, Trophy[]>; // by club id
  lineup: string[]; // user XI in slot order of `formation`
  /** Swap starters under 70% condition for fresh players before each match. */
  autoRotate?: boolean;
  formation: Formation;
  manager: { since: number; w: number; d: number; l: number; trophies: string[]; /** Manager of the Season awards. */ awards?: string[] };
  /** Scouting knowledge 0–100 per player at other clubs (own players are always 100). */
  knowledge: Record<string, number>;
  scouting: string[]; // players being scouted (max 5)
  shortlist: string[];
  transferListed: string[]; // user's players offered for sale
  bids: Bid[];
  negotiations: Record<string, Negotiation>;
  installments: Installment[];
  training: Training;
  ledger: Ledger;
  lastLedger?: Ledger;
  /** AI clubs' players available for less (unused for now; reserved). */
  transferListedAI?: string[];
  lastUserFixtureId?: string;
  nextId: number;
}

export function seasonLabel(year: number) { return `${year}/${String((year + 1) % 100).padStart(2, '0')}`; }
