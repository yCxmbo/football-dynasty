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
- **Inbox:** board, media, medical, youth and league messages.

Not built yet (shown as "coming soon"): transfers and scouting, training schedules, and detailed finances. Contracts don't expire yet.

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
    game.test.ts   engine tests
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
