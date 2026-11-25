// Football Dynasty design system, copied from the published system
// (components/bundle.js, components/bundle.css, tokens.json).
// Update by replacing bundle.js / bundle.css / tokens.json and regenerating tokens.css.
import './setup';
import './bundle.js';
import './tokens.css';
import './bundle.css';
import type { ComponentType } from 'react';

// Components are typed loosely here; their props are documented in the design
// system (components/index.d.ts and each component's README).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = ComponentType<any>;
export interface FDNamespace {
  AppFrame: C; Button: C; CurrencyToggle: C; Money: C; StarRating: C; AttributeRating: C; AttributePanel: C;
  SquadTable: C; FixtureCard: C; Icon: C; PlayerProfile: C; FormationBoard: C; LeagueTable: C; PositionChips: C;
  TransferOffer: C; Inbox: C; MoneyInput: C; Field: C; Select: C; NumberInput: C;
  MatchDay: C; MatchScoreboard: C; Commentary: C; MatchStats: C; MatchRatings: C;
  TrainingSchedule: C; DevelopmentCard: C; YouthAcademy: C;
  TrophyCabinet: C; SeasonHistory: C; HallOfFame: C; ClubRecords: C; ManagerCareer: C;
  formatMoney(amount: number, currency: string, opts?: { perWeek?: boolean; signed?: boolean; full?: boolean }): string;
  starScore(ability: number, scale?: { low: number; high: number }): number;
  isYouth(p: { squad?: string; contractType?: string; youth?: boolean }): boolean;
}

export const FD = (window as unknown as { FootballDynasty: FDNamespace }).FootballDynasty;
