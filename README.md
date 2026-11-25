# Football Dynasty

A browser soccer management game: run a club season after season, develop youth players, and build a dynasty. The look and the rating rules come from the **Football Dynasty design system** (published as a Design System artifact); this repo uses its components directly.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (Vitest)
npm run build      # type-check + production build into dist/
```

The game saves automatically in the browser (localStorage). Settings → *Start a new career* deletes the save.

## What's playable (v0.1)

- **New career:** pick a manager name, a currency (€ / $ / £) and one of 12 fictional clubs.
- **Season:** a 12-club Premier Division, double round robin (22 matchdays), with a live league table and top scorers.
- **Match day:** watch your match play out minute by minute (pause, 1×, 2×, 4×, sim to end) with commentary, stats and player ratings; other matches are simulated.
- **Squad:** first team, U21 and U18 with ability and potential stars, plus full player profiles (attributes, positions, scout report, career).
- **Tactics:** 4-3-3, 4-4-2, 4-2-3-1 or 3-5-2; click two players to swap; out-of-position players perform worse.
- **Academy:** youth players have silver stars; promoting one to the first team gives a professional contract and gold stars.
- **Season end:** player development (young players grow toward potential, veterans decline), retirements, a youth intake, the board's review, and club history (trophy cabinet, season-by-season record, records, hall of fame, your manager career).
- **Inbox:** board, media, medical, youth, league and transfer messages; bids can be accepted or rejected from the inbox.
- **Transfers:**
  - Two windows: pre-season through matchday 4, and January (matchdays 11–13).
  - Search other clubs' players and free agents by position, age, asking price and name.
  - The selling club accepts, counters or rejects your fee. They value money paid now above instalments and add-ons, and end talks after four poor offers.
  - The player then decides on your contract: wage, length, squad role and contract type.
  - The board blocks deals over the transfer or wage budget. Fees paid in instalments come out of your balance each matchday.
- **Scouting:** other clubs' players are 25% known at first, so their attributes show as ranges and their stars as estimates. Scout up to 5 players at a time (+25% knowledge per matchday). At 100% you get a full report.
- **Selling:** transfer-list players to attract bids, and other clubs sometimes bid for unlisted players too. Accepting a bid sends 60% of the fee to your transfer budget.
- **Contracts:** contracts run out at season end. Renew players from their profile (they ask for a raise, and players over 32 sign for 2 years at most). Players who aren't renewed leave as free agents, whom any club can sign without a fee. You get a reminder about expiring contracts when the January window opens.

- **Training:**
  - Pick a weekly plan (Balanced, Development, Match focus, Light week) or click sessions to change them, and set the intensity.
  - Harder, technical-heavy weeks develop players faster; the high-intensity Development plan runs at about 135% of normal.
  - The workload decides the injury risk in matches and in training.
  - Match prep, tactics and set-piece sessions add a little match sharpness.
  - A week without days off hurts morale.
  - Give young players an individual focus to steer their growth into one attribute. Every club's players develop every 4 matchdays, with a smaller step in the summer.
- **Finances:**
  - Each matchday brings gate receipts (home games), TV money, sponsorship and merchandise. It costs wages and staff for that share of the year.
  - Prize money depends on your final position.
  - At season end the board sets new transfer and wage budgets from your balance and income. Reputation rises or falls with results against expectations.
  - Clubs roughly break even, so finishing well and selling players decide whether you can spend. In debt, the transfer budget is cut.

## Rating system

As in the design system's brand book:
- Visible attributes run from 1 to 20 (Technical, Mental, Physical, Goalkeeping).
- Hidden **Current Ability** and **Potential Ability** run from 1 to 200. Current Ability is the position-weighted average of the attributes: a position's 6 key attributes count ×3, the next 6 ×2, and the rest ×1.
- Stars show ability and potential from 0.5 to 5, compared with the league's first-team players. Youth players are compared with youth level.
- Stars are **gold** for senior players and **silver** for youth players (U18 or U21 squad, or a youth contract).
- Hidden traits (consistency, big matches, injury proneness, professionalism) only appear as words in scout reports.

## Code map

```
src/
  engine/          pure TypeScript, no React — testable on its own
    rng.ts         seeded random numbers (saves and tests are reproducible)
    ratings.ts     attributes, position weights, ability formula
    world.ts       clubs, squads, youth, wages and values
    fixtures.ts    double round-robin schedule
    match.ts       formations, lineup picking, match simulation
    game.ts        game state: matchdays, table, season end, development, youth, promotion
    transfers.ts   windows, scouting, asking prices, offers, bids, contracts, free agents
    training.ts    weekly plans, workload, injury risk, in-season development, focus
    finance.ts     weekly income and costs, prize money, budgets, reputation
    *.test.ts      engine tests
  ds/              the design system (bundle.js, bundle.css, tokens) + a typed wrapper
  screens/         one file per screen, built from design-system components
  App.tsx          navigation and game flow
  store.ts         autosave, theme, currency conversion
public/            the crest at several sizes
```

### Updating the design system

`src/ds/bundle.js`, `bundle.css` and `tokens.json` are copied from the published design system. Replace them with newer versions, then regenerate `tokens.css` from `tokens.json`. Don't edit them by hand here: change the design system and copy them again.

## Naming

Clubs and players are fictional. Using real player names in a commercial game generally needs a licence from the players' representatives; check before release.
