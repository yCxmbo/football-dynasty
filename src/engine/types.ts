import type { Position } from './ratings';
import type { Formation } from './match';

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
}

export type SessionType = 'fitness' | 'technical' | 'tactical' | 'setpieces' | 'matchprep' | 'recovery' | 'rest' | 'match';
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type Intensity = 'low' | 'normal' | 'high';
export interface Training { week: Record<Day, SessionType[]>; intensity: Intensity; focus: Record<string, string> }

export interface Ledger {
  income: { gate: number; tv: number; sponsorship: number; merchandise: number; prize: number; sales: number };
  expenses: { wages: number; staff: number; transfers: number };
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
  nickname: string;
  founded: number;
  balance: number;
  transferBudget: number;
  wageBudget: number; // weekly
  /** 1 Premier Division, 2 Championship, 3 League One, 0 foreign (Continental Cup only). */
  division: 0 | 1 | 2 | 3;
  country?: string;
}

export type CompId = 'D1' | 'D2' | 'D3' | 'NC' | 'LC' | 'CC' | 'SC' | 'PO2' | 'PO3';

/** One dated slot in the season calendar; each "Continue" plays one slot. */
export interface Slot { index: number; date: string; week: number; day: 'Sat' | 'Sun' | 'Wed'; entries: Array<{ comp: CompId; round: string }> }

export interface CupState { round: number; alive: string[]; winner?: string; runnerUp?: string; exits: Record<string, string> }

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
export interface PlayerRating { playerId: string; rating: number; goals: number; assists: number; card?: 'yellow' | 'red'; subbedOff?: number; injured?: boolean; minutes: number }
export interface MatchStats { possession: [number, number]; shots: [number, number]; onTarget: [number, number]; xg: [number, number]; corners: [number, number]; fouls: [number, number]; yellow: [number, number]; red: [number, number]; passAcc: [number, number] }
export interface MatchResult { score: [number, number]; pens?: [number, number]; winnerId?: string; events: MatchEvent[]; stats: MatchStats; ratings: { home: PlayerRating[]; away: PlayerRating[] } }

export interface InboxMessage { id: string; category: 'board' | 'transfers' | 'scouting' | 'medical' | 'media' | 'training' | 'youth' | 'match' | 'finance'; from: string; role?: string; date: string; subject: string; body: string[]; unread: boolean; bidId?: string; playerId?: string }

/** An AI club's bid for one of the user's players. */
export interface Bid { id: string; playerId: string; fromClubId: string; fee: number; status: 'open' | 'accepted' | 'rejected' | 'expired' }
export interface Installment { clubId: string; perMatchday: number; remaining: number }
export interface Negotiation { attempts: number; lastResponse?: OfferResponse; blockedUntilWindow?: boolean }
export interface OfferResponse { status: 'accepted' | 'rejected' | 'counter'; message: string; counter?: number }

export interface SeasonRecord { season: string; division: string; pos: number; pts: number; champion: string; topScorer?: { name: string; goals: number }; manager: string; isYou: boolean; movement?: 'promoted' | 'relegated'; cup?: string; leagueCup?: string; europe?: string }
export interface Trophy { name: string; tier: 'league' | 'cup' | 'continental' | 'super'; seasons: string[] }

export interface GameState {
  version: 2;
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
  cups: Partial<Record<CompId, CupState>>;
  /** Continental Cup groups (club ids). */
  ccGroups: string[][];
  /** Clubs qualified for next season's Continental Cup and Super Cup, decided at season end. */
  qualified: { cc: string[]; superCup: [string, string] };
  inbox: InboxMessage[];
  history: Record<string, SeasonRecord[]>; // by club id
  trophies: Record<string, Trophy[]>; // by club id
  lineup: string[]; // user XI in slot order of `formation`
  formation: Formation;
  manager: { since: number; w: number; d: number; l: number; trophies: string[] };
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
