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

The sidebar is grouped into sections: Team (squad, tactics, training, academy, staff), Matches (fixtures, calendar, competitions, international, stats), Club (transfers, scouting, finances, facilities, history, records) and You (career, settings). A Back button returns you to the previous screen.

- **New career:** pick a manager name, a currency (€ / $ / £) and a world, then a country, league and club.
  - **Real world (default):** 2025/26 in 15 countries: England (Premier League, Championship, League One), Spain (LaLiga, LaLiga Hypermotion), Italy (Serie A, Serie B), Germany (Bundesliga, 2. Bundesliga), France (Ligue 1, Ligue 2), Portugal (+ Liga Portugal 2), the Netherlands (+ Eerste Divisie), Belgium, Turkey (+ TFF 1. Lig), Scotland (+ Championship), Brazil (+ Série B), Argentina, the USA, Saudi Arabia and Mexico. 524 clubs, about 1,350 real players with estimated ratings, and generated players to complete each squad.
  - **Fictional world:** invented clubs and players in five countries.
  - **Load a world file:** your own leagues, clubs and players. See [WORLD_FILES.md](WORLD_FILES.md).
- **Real competition names:** leagues, cups, super cups and continental competitions use their real names (Premier League, LaLiga, FA Cup, Copa del Rey, UEFA Champions League, Copa Libertadores…).
- **Club names and badges:** clubs have names close to the real ones (for example *Merseyside Reds*, *Madrid Merengues*), and badges generated from each club's colours. Real club crests are protected designs, so the game doesn't copy them.
- **Leagues:** every league is a double round robin. Thirteen countries have promotion and relegation: England (three divisions), Spain, Italy, Germany, France, the Netherlands, Turkey and Saudi Arabia (two up, places 3–6 play off for a third, three down), Portugal (two up and down), Brazil (four up and down), and Scotland, Belgium and Argentina (one up, a play-off among 2nd–5th for another, two down; Argentina's Primera Nacional is one 20-club league). Second-tier clubs also enter their country's main cup. Reserve sides such as Jong Ajax, Benfica B or Club NXT play in the second divisions but can't be promoted. The USA and Mexico have one league each, as in reality.
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
- **Home dashboard:** your form, league position against the target, the dressing-room mood and how many decisions are waiting, then the next match with the opposition report, what's coming up (your next fixtures and the transfer-window dates), the last result, the table, cups, the board, unread mail, squad alerts and finances.
- **Transfer deals:** the terms of an offer count after the deal. Fees can be paid in instalments, in both directions. Add-ons are lump sums paid to the selling club once the player reaches 25 games or 15 goals for you. A sell-on clause pays its holder a share of the player's next sale, between any clubs; you get an inbox message when one pays you. Computer clubs' bids for your players sometimes pay part now and the rest over a year, include a sell-on share for you, or (for players aged 22 or under) a buy-back clause: re-sign him for a set fee within two seasons, from his profile. Every agent asks a fee (some are hard bargainers); paying it gets the player to accept up to 10% less in wages. You can include one of your players in an offer as part of the fee (a swap), valued by how well he'd fit the other club. Finances lists what you still owe, what's still to come in, and the clauses running.
- **Medical centre** (Team section): who is injured, with what (from a knock to a torn knee ligament, by how long he's out) and when he should be back; **rush back** halves the lay-off once, but he has about a one-in-five chance in each of his first two games back of breaking down again, for longer. Every first-teamer has an injury risk (how injury-prone he is, tiredness, age, natural fitness, your fitness coach and training facilities) with the physio's advice, and the season's injuries are logged.
- **Supporters** (Finances screen, and a tile on Home): their mood (0–100) moves after every competitive match with the result against the pundits' expectations (derbies count double, thrashings either way count extra), when you sign or sell one of your best five players, and with ticket prices (cheap: fuller ground, happier fans, less per ticket; expensive: the reverse). Moods drift back towards normal and reset halfway each summer. Happy fans (75+) fill more seats and give a small lift at home; the board's trust drifts with the stands. Below 30 the supporters' trust writes to the club; below 15 they protest and the board's confidence drops.
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
- **Squad:** first team, U21 and U18, with depth at every position (how many, how good the best is, a warning where it's thin) and who is unavailable, tired, unhappy or out of contract. The table has four views (overview with stars, fitness, morale, rating and value; the season's numbers; contracts; attribute averages, key attributes and each player's best role), sorts by any column, and filters by position, availability or name. It remembers the view when you come Back from a player. Full player profiles show attributes, positions, scout report and career.
- **Tactics:** 4-3-3, 4-4-2, 4-2-3-1 or 3-5-2; click two players to swap; out-of-position players perform worse.
- **Academy:** youth players have silver stars; promoting one to the first team gives a professional contract and gold stars.
- **Day by day:** the game moves on a day at a time. Continue advances one day (a day with fixtures plays them; on your match day it's Play match), and the Sim menu goes to your next match day, through a week or four weeks, or to the end of the season. A Calendar screen shows each month with your fixtures and results.
- **Season end:** player development (young players grow toward potential, veterans decline), retirements, a youth intake, the board's review, and club history (trophy cabinet, season-by-season record, records, hall of fame, your manager career).
- **Coaching style:** pick one when you start (changeable once a season on the Career screen): *Attacking* (more chances, a little more conceded), *Defensive* (the reverse), *Youth developer* (players 21 and under develop 15% faster, better intakes), *Motivator* (team talks count 50% more, unhappy players recover sooner) or *Balanced*. It applies to your national team too.
- **Manager career:**
  - The board's confidence carries over between seasons. Miss your target badly (or get relegated) and you're sacked at season end; a collapse mid-season can cost you the job before then.
  - Out of work, you choose your next club from offers (smaller clubs, any country) or apply for vacancies: clubs without a manager. Your chance depends on your reputation against the club's and the best rival candidate's (shown with each vacancy), and clubs fill their jobs within a few weeks.
  - **AI managers:** every other club has a named manager with a rating (a small edge in matches), a reputation (1–100), a record and trophies. Clubs far below target sack theirs, from a third of the way into the season and again in the summer; they appoint the best manager out of work, or poach one doing well at a clearly smaller club, which opens that job in turn. Old managers retire and new ones come through. The Career screen ranks the world's top managers with you among them, and the inbox reports sackings and appointments in your league and at the biggest clubs.
  - A good season brings offers from bigger clubs. You can also resign.
  - **Club vision:** the board sets a long-term league objective by the club's size and division (win the league, a top-four finish, the top half, promotion, within two or three seasons) and two style objectives (attacking football, young players getting games, the wage bill within budget). Each is judged at the end of the season, moving the board's trust; a settled league objective brings a new, tougher one. Once a season you can ask the board for more transfer funds, a bigger wage budget or investment in the academy; it weighs its trust in you and the finances. Now and then the club is taken over: ambitious owners bring money and higher targets, cost-cutters the opposite.
  - **Contract and interviews:** you're paid a weekly wage that rises steeply with the club's size (and a little with your reputation), on a three-season contract (two after an interview). An expiring contract is renewed with a raise if the board still trusts you; otherwise you leave in the summer. With high confidence and two seasons or fewer left you can ask for a new deal (once a season). Sacked, you get half the wages still owed; resigning gets nothing. Career earnings are on the Career screen. Applying for a vacancy means an interview: three questions on your ambitions, style of play and transfer plans, where what the board wants to hear depends on the club's size. Promise a higher finish than they expect and it becomes your target for that first season.
  - Moving abroad works too: the new club gets an academy, and your career record lists every club with its seasons, results and trophies (Career screen).
- **Training and development:** an individual focus can be an attribute or a role (working on that role's key attributes); any player can learn a new position, improving week by week from awkward up to accomplished (faster when young or with good Decisions and Anticipation); and your players' profiles chart their Technical (Goalkeeping for keepers), Mental and Physical averages season by season.
- **Player talks:** from a player's profile, talk to him one to one: praise or criticise his form, warn him about his discipline, reassure him, promise him more football, or ask how he is. Each player can be spoken to once every two weeks. How he takes it depends on whether it's fair (his average rating), his character (Determination, professionalism, Aggression) and his mood; it lifts or drops his morale. A promise lifts him now, but he expects three games in the next six weeks, and a broken one makes him go public.
- **Team meetings** (Squad screen, Dynamics tab), once every two weeks: praise the squad, demand more, take the pressure off, or talk about the season's targets. The squad's response depends on recent results, how strong your leaders are and whether the message fits (praise after a bad run sounds hollow; demands after a good run grate).
- **Squad dynamics** (Squad screen, Dynamics tab): a dressing-room hierarchy (team leaders, highly influential, influential) from Leadership, age, years at the club, quality and the armband; every player's mood with the reasons (playing time against his standing, morale, contract, transfer list, captaincy, results, mentoring); the overall atmosphere, which nudges performances (+1% when excellent, −2% when toxic); groups by nationality and age, where an unsettled group or an unhappy team leader spreads the mood; and up to three mentoring pairs, where a youngster develops faster and picks up his mentor's professionalism, determination and leadership.
- **Team talks, press and morale:**
  - Before kickoff and at half-time the match waits for your team talk: encourage, demand more, keep calm, or say nothing. What works depends on the moment (calm when on top, demands when behind, encouragement when even); the players' reaction appears in the commentary and nudges their performance a few percent.
  - After heavy wins and defeats (and some other games) the press want a word: answer in the inbox. Taking responsibility pleases the board; blaming the players hurts morale; praising a player lifts him.
  - Regulars who are unhappy and not playing ask to leave: promise more games (then keep it: three games in six weeks, or he goes public and onto the transfer list), transfer-list him, or tell him to fight for his place.
- **Stadium and facilities:** expand the stadium (2,500 to 10,000 seats at a time; the new stands open next season), and upgrade the training ground (faster development) and youth academy (better intakes) through five levels. Crowds are limited by the fan base, which grows with reputation, so seats only pay when the demand is there. Building work is paid from the balance and the transfer budget; facilities cost upkeep each week.
- **Derbies:** 62 real rivalries, from El Clásico, the Old Firm and the Superclásico to the Black Country derby and El Tráfico. Derbies are labelled on fixtures, sell out, are more heated (more fouls and cards), and matter more: a win lifts the squad and the board's trust, a defeat costs some. Every derby's head-to-head record is on the Records screen.
- **Achievements:** 24 milestones in four groups (results, trophies, club, career): from your first win to the treble, a World Cup with a national team, a dynasty of five titles, or managing in three countries. Each unlocks once with its season, arrives in the inbox, and shows on the Career screen.
- **Transfer windows on real dates** by country (approximately 2025/26): e.g. England 16 June to 1 September and 1 January to 2 February, Portugal's summer window to 22 September, the MLS primary (31 January to 23 April) and secondary (24 July to 21 August) windows, Mexico's winter window from mid-December. Your window follows your club's country, with news on opening, deadline day and closing, and dates on the calendar; each country's clubs do their winter business when their own window shuts.
- **Transfer market and rumours:** computer-run clubs trade real players with each other. In the summer the biggest clubs go first and sign players who'd improve them from clearly smaller clubs (fees from market value, contract length and any release clause), and a smaller market runs at the end of the January window. A few weeks before each window the rumour mill links about a dozen players with big clubs (early interest, talks under way, close to a deal); many come true, and a rumour about one of your players turns into a bid once the window opens. The Transfers screen's Transfer news view lists the rumours and every deal from 1M (biggest first, or only your league), and the inbox sums up each window.
- **Pundits:** before each season every league gets a predicted table (from each club's best eleven and its manager). Your inbox gets a preview of your league: title favourites, a dark horse, who's tipped to go down, your predicted finish and players to watch. The Competitions screen shows the prediction next to the current table (who's beating it), Home gives win/draw/loss odds for your next match, and your season review says where the pundits had you.
- **Tactics:** three saved tactics (switch between them before or during a match), each with:
  - **A formation** from twenty: 4-3-3, 4-3-3 with a holding midfielder, 4-2-3-1, 4-4-2, 4-4-1-1, 4-1-4-1, the 4-4-2 diamond, 4-3-2-1, 4-2-2-2, 4-2-4, 4-5-1, 3-5-2, 3-4-3, 3-4-2-1, 3-4-1-2, 3-5-1-1, 5-3-2, 5-4-1, 5-2-3 and 5-2-1-2.
  - **A role and duty for every player:** 47 roles such as sweeper keeper, libero, stopper and cover defender, ball-playing defender, inverted full-back, deep-lying playmaker, box-to-box midfielder, segundo volante, roaming playmaker, mezzala, enganche, trequartista, inside forward, wide target forward, target forward, channel forward, false nine and pressing forward, each with defend, support or attack duties. A role decides how much the player adds to the defence, midfield and attack, how often he gets into scoring positions and which attributes matter; his suitability (stars, from those attributes) is a small factor on his performance. **Pick best roles** gives every player the role he suits best. Some roles do more: a sweeper keeper covers a high line, a pressing forward unsettles their midfield, a target forward feeds on wide play and wins corner headers.
  - **A shape without the ball** (optional), e.g. attack in 4-2-3-1 and defend in 4-4-1-1: each player drops to the nearest position in the defensive shape (shown on the board's Out of possession view, with how well he fits there). A deeper defensive shape is more solid but threatens less on the break, and players who don't suit their defensive positions weaken it. The squad has to learn both shapes.
  - **Player instructions** on top of a role: shoot more or less, dribble more or less, safer or riskier passing, hold position or get forward, press more or less, tackle harder. Whether they help depends on his attributes (Long Shots and Finishing for shooting, Dribbling and Flair, Vision and Passing, Tackling and Aggression): the role panel says whether an instruction suits him. Pressing more tires him faster; tackling harder means more fouls.
  - **Instructions in three phases:** mentality (seven steps, from very defensive to very attacking); in possession (passing, tempo, width, where to attack, final third); in transition (counter-press or regroup when the ball is lost, counter or hold shape when it's won); out of possession (line of engagement, defensive line, pressing, tackling, offside trap). Each trades something and many react to the opponent: counters punish a high line, direct balls beat a high press, patient build-up struggles against a low block, flanks beat a narrow defence.
  - **A tactic overview:** how the work splits between defence, midfield and attack, the average role fit, and the assistant's notes on what stands out (no playmaker, nobody screening the defence, too many attack duties, a target man with short passing, players in the wrong role).
  - **Styles to start from:** high press, possession, counter-attack, wing play, direct, low block and balanced.
  - **Familiarity:** a shape the squad doesn't know, or several instructions changed at once, costs up to 2.5% until it's been played a few times; unused shapes fade slowly, and a new club starts from scratch.
  - Computer-run managers each have a favourite formation, pick roles that suit their players, set up by how they compare and react to the score (chasing the game from the hour and going all out late, shutting up shop when ahead late). During a match you can switch tactic (the players on the pitch move into the new shape) or change any instruction.
- **Captain and set pieces:** on the Tactics screen you choose the captain and your penalty, free-kick and corner takers. A captain with high Leadership lifts the side a little, and more when it's behind after half-time; giving the armband to a weak or very young leader upsets senior players, and stripping a respected one hurts him. Set pieces are played out in matches: penalties are awarded more to sides on top, and whether they, direct free kicks and corner headers go in depends on the taker's Penalties and Composure, Free Kicks or Corners (and the header's Heading). If a taker isn't playing, the best available steps up.
- **Match analysis:** under every match you play (live, and afterwards from Fixtures): an xG timeline for both sides with goals marked (hover for the score and xG at any minute), shots by source (open play, counter-attacks, penalties, free kicks, corners), and the assistant's notes on what decided it: wasteful or clinical finishing, counters exposing a high line, set pieces, a change after half-time, who controlled it. The xG is also available as a table.
- **Opposition report:** before each match (on Home, and in full on Tactics) your assistant reports on the opponent: form, the pundits' odds, where you have the edge unit by unit (your attack against their defence, midfield against midfield, your defence against their attack), danger men, absentees, their likely eleven and this season's meetings, with a suggested formation. Lining up in it gives a small edge on the day (+1.5%). **Match prep** (Tactics screen): pick a focus (attack their defence, win the midfield, shut out their attack): one where you have a real edge is worth +1.2%, one where they're stronger costs 0.5%. You can also man-mark one of their players, who then gets about half as many chances, at a 0.5% cost to your side. Their likely eleven is drawn on a pitch, with danger men marked. The prep applies to that match only.
- **Club pages:** click any club (league tables, cup ties, fixtures, records, the Career screen, or "View club" on a player) to see its manager, this season's results and position, first team (stars as far as your scouts know them), honours, recent seasons, money and rivals with head-to-head records.
- **Stats:** a Stats screen with this season's leaders in any league or all of them (goals, assists, goals and assists, average rating, clean sheets, player of the match awards) and a side-by-side comparison of any two players: season numbers and attributes, exact for your players and scouted ones, otherwise your scouts' range.
- **World records:** the Records screen keeps all-time records across the world since your career began: most top-flight and continental titles, all-time top scorers (retired players keep their place), most goals in a season, most points by a champion, and record transfers.
- **Season awards:** at the end of every season each top flight names its Player of the Season, Young Player of the Season (21 and under), top scorer and a Team of the Season (4-3-3), a Manager of the Season (the club that most beat its expected finish, with credit for titles and cups: you can win it), and the world names the Golden Ball (top three) and the Golden Boy. Winners carry their awards on their profiles, start the new season in high spirits and are worth more for it (up to a quarter more for the Golden Ball); the Golden Ball also lifts his club's reputation. Winning Manager of the Season raises the board's trust and your reputation. Your inbox highlights your own winners, and the Records screen shows the latest season and every past Golden Ball and Golden Boy.
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
- **Contracts with teeth:** every player at a Spanish club has a release clause (3–6 times his value), and some good young players elsewhere do too. Offer the clause in full, all up front, and his club can't refuse; but bigger clubs can trigger the clauses in your players' contracts too. Players in their final year who are unhappy, or far too good for your club, won't renew, and from the mid-season window other clubs can sign your expiring players on pre-contracts: they leave on a free in the summer. Profiles show clauses and pre-contracts.
- **Personalities:** players carry tags from their hidden character, shown on their profile once scouted: *Leader* (lifts the side when he plays), *Big-game player* / *Nervous* (better or worse in knockouts, finals and derbies), *Hothead* (more cards), *Model professional* / *Needs pushing* (development), *Injury-prone* / *Iron man*, and *Consistent* / *Inconsistent* (how much his form swings from match to match). All of them act in the match engine.
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
    traits.ts      personality tags and what they do
    contracts.ts   release clauses, refusals to renew, pre-contracts
    loans.ts       loans out and in, recalls, returns at season end
    friendlies.ts  pre-season friendlies and tours
    rivalries.ts   named derbies, their effects and head-to-head records
    style.ts       coaching styles and their effects
    records.ts     all-time world records
    awards.ts      end-of-season awards
    achievements.ts career milestones and when they unlock
    career.ts      board confidence, the sack, offers, vacancies, moving clubs
    managers.ts    AI managers: hiring, sacking, poaching, retirement
    market.ts      transfers between AI clubs, rumours
    preview.ts     predicted tables, season previews, match odds
    opposition.ts  the assistant's opposition report and plan
    leadership.ts  captain and set-piece takers
    analysis.ts    post-match analysis and notes
    dynamics.ts    hierarchy, moods, atmosphere, groups, mentoring
    stats.ts       league leaders and season numbers
    vision.ts      club vision, board requests, takeovers
    instructions.ts team instructions in three phases and their effects
    roles.ts       player roles, duties and suitability
    tactics.ts     saved tactics, style presets, familiarity
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
