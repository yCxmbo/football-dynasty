# Football Dynasty

A browser soccer management game: run a club season after season, develop youth players, and build a dynasty. The look and the rating rules come from the **Football Dynasty design system** (published as a Design System artifact); this repo uses its components directly.

## Play online

**https://ycxmbo.github.io/football-dynasty/**

Every push to `main` runs the tests, builds the game and redeploys it with GitHub Actions (`.github/workflows/deploy.yml`). Saves live in your browser, so each browser or device has its own career.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (Vitest)
npm run build      # type-check + production build into dist/
```

The game saves automatically in the browser (IndexedDB), and you can keep several careers: Settings → *Start a new career* keeps the current one, and *Your careers* loads or deletes them. *Export save file* downloads a compact backup (`.fdsave`, about 2 MB) that *Import a save file* opens on any device. Saves from the older single-slot version are moved over automatically. Saves are written a moment after you stop clicking and whenever the tab is hidden. Saves from before the multi-country worlds can't be converted; the game says so.

## What's playable (v0.1)

- **New career:** pick a manager name, a currency (€ / $ / £) and a world, then a country, league and club.
  - **Real world (default):** 2025/26 in 15 countries: England (Premier League, Championship, League One), Spain (LaLiga, LaLiga Hypermotion), Italy (Serie A, Serie B), Germany (Bundesliga, 2. Bundesliga), France (Ligue 1, Ligue 2), Portugal (+ Liga Portugal 2), the Netherlands (+ Eerste Divisie), Belgium, Turkey (+ TFF 1. Lig), Scotland (+ Championship), Brazil (+ Série B), Argentina, the USA, Saudi Arabia and Mexico. 524 clubs, about 1,350 real players with estimated ratings, and generated players to complete each squad.
  - **Fictional world:** invented clubs and players in five countries.
  - **Load a world file:** your own leagues, clubs and players. See [WORLD_FILES.md](WORLD_FILES.md).
- **Real competition names:** leagues, cups, super cups and continental competitions use their real names (Premier League, LaLiga, FA Cup, Copa del Rey, UEFA Champions League, Copa Libertadores…).
- **Club names and badges:** clubs have names close to the real ones (for example *Merseyside Reds*, *Madrid Merengues*), and badges generated from each club's colours. Real club crests are protected designs, so the game doesn't copy them.
- **Leagues:** every league is a double round robin. Ten countries have promotion and relegation: England (three divisions), Spain, Italy, Germany, France, the Netherlands and Turkey (two up, places 3–6 play off for a third, three down), Portugal (two up and down), Brazil (four up and down) and Scotland (one up, a play-off among 2nd–5th for another, two down). Reserve sides such as Jong Ajax or Benfica B play in the second divisions but can't be promoted. The other countries have one league each.
- **League formats:** most leagues are a double round robin. MLS and Liga MX decide their champions in title play-offs among the top eight (MLS Cup, with the Supporters' Shield for the table winner; the Liguilla). The Scottish Premiership splits after 33 rounds into top and bottom six for five more rounds.
- **Competitions:**

  | Competition | Format |
  | --- | --- |
  | Domestic cups (FA Cup, Copa del Rey, Coppa Italia, DFB-Pokal, Coupe de France…) | Knockout. With an awkward number of clubs, the lowest-ranked play a first round and the rest get byes. Neutral semi-finals (main cups) and final. |
  | EFL Cup and Scottish League Cup | Knockout, neutral final. |
  | Super cups (Community Shield, Supercopa de España, Supercoppa Italiana, DFL-Supercup, Trophée des Champions…) | League champions against the main cup winners (Mexico: against the runners-up), before the season. Only countries that really have one. |
  | UEFA Champions League | 36 clubs in a league phase, as since 2024/25: eight matches each against eight different opponents in one table. The top eight go to the round of 16, 9th–24th play a knockout play-off (9th v 24th …), the bottom twelve are out. Then quarter-finals, semi-finals and a neutral final. |
  | UEFA Europa League | The same format with the next places in each league plus cup winners. |
  | Copa Libertadores | 16 clubs from Brazil, Argentina and the rest of South America. |
  | CONCACAF Champions Cup | 16 clubs from Mexico and the USA. |
  | AFC Champions League Elite | 16 clubs from Saudi Arabia and the rest of Asia. |

- **International football:** every player has a nationality, and generated players mostly come from their club's country, with names that fit it.
  - In the summer between seasons the game plays the **FIFA World Cup** (2026, 2030, …: 48 teams, 12 groups, round of 32), the **UEFA Euro** (2028, 2032, …: 24 teams), the **Copa América** (16 teams, with six CONCACAF guests), and the **Africa Cup of Nations** and **AFC Asian Cup** (2027, 2031, …: 24 teams each). Real hosts where known (USA/Mexico/Canada 2026, Kenya/Uganda/Tanzania and Saudi Arabia 2027, UK and Ireland 2028, Spain/Portugal/Morocco 2030).
  - National teams pick the best 26 of their nationality anywhere in the world, so your players get called up. Nations with few players in the world get depth players at their usual level. Qualifying follows confederation places, with some luck.
  - Players win caps, goals and titles (shown on their profile); winners come back with high morale. Your inbox reports who went and how far they got.
  - The **International** screen has the world ranking, your internationals, every tournament's groups and knockout rounds, and a roll of honour.
  - **National team job:** manage a nation alongside your club. Federations hire on your reputation (club reputation plus trophies): the top five nations want 88, the top twelve 78, the top 25 66. Pick your 26 and a formation on International → National team; the tournament uses them. Your record, results and trophies count toward your career, and a top-16 nation that fails to qualify or goes out in the group stage dismisses you. Each new season your inbox lists the nations that would appoint you.
  - **Live tournaments:** when the season ends and your nation has a tournament, *Go to the World Cup* (or Euro, Copa América…) opens it. Your matches are played live with team talks and substitutions (*Play match*), or *Sim my matches*; every other game is simulated around them. Your results are saved as you go, so a reload carries on where you left off. Start the new season once your nation is out or the final is played.
- **Pre-season friendlies and tours:** before the first game, arrange up to three from the offers on Home: home friendlies against lower-league clubs (gate money) or tours to the USA, the Middle East and Asia, or Europe against big clubs (a big fee and a little reputation). They're played on the weekends before the season, don't count for stats, records or the board, and each one sharpens your team for the first five league weeks.
- **Calendar:** dated slots for the whole season (league weekends, cup and continental midweeks, play-offs, finals). Shorter leagues are spread over the same season. Every match in the world is played, not just your league.
  - *Play match* plays your next game.
  - *Continue* skips days when you don't play.
  - *Sim* plays ahead without watching: this match, four weeks, or the rest of the season (about 8 seconds for a whole season in the real world). Simulation runs in a background worker, so the page stays responsive; your matches use your current tactics, and a Stop button halts it.
- **Prize money** for every competition, gate receipts for cup ties (split at neutral venues) and Continental Cup TV money.
- Computer-run clubs spend surplus money on better players and sell their stars abroad when deep in debt.
- **Match day:** your match is simulated minute by minute as you watch (pause, 1×, 2×, 4×, sim to end), with commentary, stats, live ratings and each player's condition.
  - **Make substitution** pauses the match and lets you swap any player on the pitch for one on the bench (5 subs).
  - Substitutions change the rest of the match. Injured players are replaced automatically, and computer-run sides make their own changes.
  - Nothing is saved until full time. You can leave to check tactics and come back with *Back to match*.
- **Fitness and rotation:**
  - Every player has a condition score. It drops during matches (stamina decides how fast) and recovers each day (natural fitness, age and training intensity decide how fast).
  - Tired players play worse and get injured more, so congested weeks with league, cup and Continental games force you to rotate.
  - *Rotate tired players*, on by default, rests starters under 70% condition for that match only, if a fresh player can cover the position. Your chosen XI is kept.
  - Computer-run clubs rotate too.
  - The Tactics screen shows everyone's condition and days until fully fit.
- **Squad:** first team, U21 and U18 with ability and potential stars, plus full player profiles (attributes, positions, scout report, career).
- **Tactics:** 4-3-3, 4-4-2, 4-2-3-1 or 3-5-2; click two players to swap; out-of-position players perform worse.
- **Academy:** youth players have silver stars; promoting one to the first team gives a professional contract and gold stars.
- **Season end:** player development (young players grow toward potential, veterans decline), retirements, a youth intake, the board's review, and club history (trophy cabinet, season-by-season record, records, hall of fame, your manager career).
- **Coaching style:** pick one when you start (changeable once a season on the Career screen): *Attacking* (more chances, a little more conceded), *Defensive* (the reverse), *Youth developer* (players 21 and under develop 15% faster, better intakes), *Motivator* (team talks count 50% more, unhappy players recover sooner) or *Balanced*. It applies to your national team too.
- **Manager career:**
  - The board's confidence carries over between seasons. Miss your target badly (or get relegated) and you're sacked at season end; a collapse mid-season can cost you the job before then.
  - Out of work, you choose your next club from offers (smaller clubs, any country) or apply for vacancies: clubs that changed manager after their own poor season. Your chance depends on your reputation against the club's.
  - A good season brings offers from bigger clubs. You can also resign.
  - Moving abroad works too: the new club gets an academy, and your career record lists every club with its seasons, results and trophies (Career screen).
- **Team talks, press and morale:**
  - Before kickoff and at half-time the match waits for your team talk: encourage, demand more, keep calm, or say nothing. What works depends on the moment (calm when on top, demands when behind, encouragement when even); the players' reaction appears in the commentary and nudges their performance a few percent.
  - After heavy wins and defeats (and some other games) the press want a word: answer in the inbox. Taking responsibility pleases the board; blaming the players hurts morale; praising a player lifts him.
  - Regulars who are unhappy and not playing ask to leave: promise more games (then keep it: three games in six weeks, or he goes public and onto the transfer list), transfer-list him, or tell him to fight for his place.
- **Stadium and facilities:** expand the stadium (2,500 to 10,000 seats at a time; the new stands open next season), and upgrade the training ground (faster development) and youth academy (better intakes) through five levels. Crowds are limited by the fan base, which grows with reputation, so seats only pay when the demand is there. Building work is paid from the balance and the transfer budget; facilities cost upkeep each week.
- **Derbies:** 62 real rivalries, from El Clásico, the Old Firm and the Superclásico to the Black Country derby and El Tráfico. Derbies are labelled on fixtures, sell out, are more heated (more fouls and cards), and matter more: a win lifts the squad and the board's trust, a defeat costs some. Every derby's head-to-head record is on the Records screen.
- **Achievements:** 24 milestones in four groups (results, trophies, club, career): from your first win to the treble, a World Cup with a national team, a dynasty of five titles, or managing in three countries. Each unlocks once with its season, arrives in the inbox, and shows on the Career screen.
- **World records:** the Records screen keeps all-time records across the world since your career began: most top-flight and continental titles, all-time top scorers (retired players keep their place), most goals in a season, most points by a champion, and record transfers.
- **Tips for new players:** the first time you open each main screen, a short tip explains what it's for and what to try. Dismiss each with *Got it*, or *Hide all tips*; Settings → *Show tips again* brings them back. Remembered per browser.
- **Inbox:** board, media, medical, youth, league and transfer messages; bids can be accepted or rejected from the inbox.
- **Transfers:**
  - Two windows: pre-season through league week 4, and three weeks in mid-season.
  - Search other clubs' players and free agents by position, age, asking price and name.
  - The selling club accepts, counters or rejects your fee. They value money paid now above instalments and add-ons, and end talks after four poor offers.
  - The player then decides on your contract: wage, length, squad role and contract type.
  - The board blocks deals over the transfer or wage budget. Fees paid in instalments come out of your balance each matchday.
- **Loans:** while a window is open, send young or fringe players to a club where they'd start in their position (the profile lists who would take them; the borrowing club pays the wages, and the games help them develop), recall them, or ask to borrow other clubs' fringe players who would play for you. Loans end in the summer. Your loanees are listed under the squad.
- **Staff:** an assistant manager, first-team coach, fitness coach, physio, chief scout and youth coach, each rated 1–20 (10 is average). Better staff speed up development, recovery and scouting, shorten injuries, improve the youth intake and lift low morale; the Staff screen shows what each one does now. Hire from a pool of candidates that refreshes each summer (the best won't join small clubs; the outgoing holder is paid eight weeks' wages). Staff belong to the club: change clubs and you inherit theirs.
- **Scouting:** other clubs' players are 25% known at first, so their attributes show as ranges and their stars as estimates. Scout up to 5 players at a time (+25% knowledge per matchday). At 100% you get a full report.
- **Selling:** transfer-list players to attract bids, and other clubs sometimes bid for unlisted players too. Accepting a bid sends 60% of the fee to your transfer budget.
- **Contracts:** contracts run out at season end. Renew players from their profile (they ask for a raise, and players over 32 sign for 2 years at most). Players who aren't renewed leave as free agents, whom any club can sign without a fee. You get a reminder about expiring contracts when the January window opens.

- **Training:**
  - Pick a weekly plan (Balanced, Development, Match focus, Light week) or click sessions to change them, and set the intensity.
  - Harder, technical-heavy weeks develop players faster; the high-intensity Development plan runs at about 135% of normal.
  - The workload decides the injury risk in matches and in training.
  - Match prep, tactics and set-piece sessions add a little match sharpness.
  - A week without days off hurts morale.
  - Give young players an individual focus to steer their growth into one attribute. Every club's players develop about five times a season, with a smaller step in the summer.
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
    match.ts       formations, positional fit, condition-aware lineup picking
    live.ts        minute-by-minute match engine: goals, cards, injuries, fatigue, substitutions, ratings
    worlddef.ts    world file format: types, validation, building clubs and squads from a world
    builtin.ts     the fictional world and the template world file
    nations.ts     national teams: confederations, strength, colours, nationalities for generated players
    namepools.ts   invented names that fit each nationality
    facilities.ts  stadium expansion, training ground and academy levels
    media.ts       press conferences, transfer requests, promises
    staff.ts       backroom staff, their effects, hiring
    loans.ts       loans out and in, recalls, returns at season end
    friendlies.ts  pre-season friendlies and tours
    rivalries.ts   named derbies, their effects and head-to-head records
    style.ts       coaching styles and their effects
    records.ts     all-time world records
    achievements.ts career milestones and when they unlock
    career.ts      board confidence, the sack, offers, vacancies, moving clubs
    summer.ts      the live tournament summer: pausing at your matches, resuming after a reload
    nationaljob.ts managing a national team: reputation, offers, squad selection
    international.ts national squads, World Cup / Euro / Copa América: qualification, draw, groups, knockouts
    competitions.ts data-driven calendar, leagues, cups, continental groups, knockouts, play-offs, promotion/relegation, qualification
    game.ts        game state: playing calendar slots, season end, development, youth, promotion
    transfers.ts   windows, scouting, asking prices, offers, bids, contracts, free agents
    training.ts    weekly plans, workload, injury risk, in-season development, focus
    finance.ts     weekly income and costs, prize money, budgets, reputation
    *.test.ts      engine tests
  ds/              the design system (bundle.js, bundle.css, tokens) + a typed wrapper
  data/real/       the real-world database, one file per country (compact format, see types.ts)
  screens/         one file per screen, built from design-system components; badge.ts draws club badges
  App.tsx          navigation and game flow
  sim/             simulation jobs, run in a Web Worker (main-thread fallback)
  store.ts         careers and autosave (IndexedDB via idb.ts), save export/import, theme, currency conversion
public/            the game crest at several sizes and the title-screen background
```

### Updating the design system

`src/ds/bundle.js`, `bundle.css` and `tokens.json` are copied from the published design system. Replace them with newer versions, then regenerate `tokens.css` from `tokens.json`. Don't edit them by hand here: change the design system and copy them again.

## Naming

The real world uses real player names with estimated ratings, real competition names, and club names that are close to, but not the same as, the real ones. Badges are generated from club colours rather than copied. Using real player names in a commercial game generally needs a licence from the players' representatives (in many countries through their players' union); check before any commercial release. The same goes for competition names, which are trademarks of their organisers. The fictional world has no real names at all.
