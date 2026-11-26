# World files

A world file is a JSON file that describes everything a career is played in: countries, leagues, cups, continental competitions, clubs and players. The game ships with two worlds (real and fictional). You can play your own from the start screen: **Load a world file**.

The start screen has two downloads to begin from:

- **Download template:** a small, complete world with two countries, three leagues, cups and a continental competition.
- **Download real world to edit:** the built-in real world as a file, ready to change. Use it to rename clubs, move players or update ratings.

Only import names and data you have the right to use.

## Shape

```json
{
  "format": "football-dynasty-world",
  "version": 1,
  "name": "My world",
  "startYear": 2026,
  "countries": [ { "id": "eng", "name": "England", "superCup": "Community Shield" } ],
  "leagues": [ … ],
  "cups": [ … ],
  "continental": [ … ],
  "clubs": [ … ],
  "players": [ … ]
}
```

A country's optional `superCup` names its season opener: the league champions against the main cup winners (or the runners-up if the country has no main cup). Without a name, countries with a main cup get a "Super Cup"; `false` means none.

Ids are short strings you choose. They must be unique and are how everything refers to everything else.

### Leagues

| Field | Meaning |
| --- | --- |
| `id`, `name`, `short` | `short` is the tab label (optional). |
| `country` | A country id. |
| `tier` | 1 for the top league, 2 for the one below, and so on. One league per tier. |
| `promote` | Automatic promotion places (0 for a top league). |
| `playoff` | Four places just below promotion that play off for one more place, e.g. `[3, 6]`. Optional. |
| `relegate` | Relegation places (0 for the bottom league). Must equal the promotion places of the league below (+1 if it has play-offs). |
| `tv` | League TV money per matchday, in euros. |
| `titlePlayoff` | Optional `{ "name": "MLS Cup Playoffs", "trophy": "MLS Cup", "shield": "Supporters' Shield" }`: the top eight play off for the title (1 v 8, 4 v 5, 2 v 7, 3 v 6, at the better seed's ground). The winner is champion and gets `trophy`; `shield`, if set, goes to the club top of the table. Needs at least 8 clubs. |
| `split` | Optional `true`: Scottish-style split. Everyone plays everyone three times, then the top and bottom halves play each other once more, and clubs stay in their half of the table. |

A league needs an even number of clubs, at least 4.

### Cups

`{ "id", "name", "country", "tiers": [1, 2], "main": true }`. `tiers` lists which leagues' clubs enter. The `main` cup's winner plays in the Super Cup and, if the continental competition takes `cupWinners`, qualifies for it. Any number of entrants works: the lowest-ranked clubs play a first round and the rest get byes. A cup needs at least 4 clubs.

### Continental competitions

| Field | Meaning |
| --- | --- |
| `rank` | 1 for the top competition, 2 for the next. Rank 2 takes the league places after rank 1's. |
| `size` | 16 or 32: groups of four, then knockouts. 36 with `"format": "league"`: a league phase where each club plays eight different opponents in one table; the top eight reach the round of 16 and 9th–24th play a knockout play-off. With too few clubs it falls back to 32, then 16; below 16 it doesn't run that season. |
| `format` | `"groups"` (default) or `"league"` (needs size 36). |
| `places` | Places per country from its top league, e.g. `{ "eng": 4, "esp": 4 }`. |
| `cupWinners` | Main cup winners qualify too, if not already in a higher competition. |
| `fillers` | Club ids, usually clubs without a league, that fill empty places, best first. |

### Clubs

`{ "id", "name", "short", "country", "league", "reputation", "stadium", "capacity", "colours" }`

- `reputation` is 1–100. It sets the squad strength of generated players, the budget and the board's expectations.
- Leave out `league` for a club that only plays continental football (a filler).
- `"reserve": true` marks a reserve side (Jong Ajax, Benfica B): it plays in its league but can't be promoted; the next club takes the place.
- `colours` is two hex colours, e.g. `["#c8102e", "#ffffff"]`, used for the generated badge.

### Players (optional)

`{ "name", "club", "pos", "age", "nationality", "overall", "potential", "number", "wage", "contractEnd" }`

- `pos`: GK, CB, LB, RB, DM, CM, AM, LW, RW or ST (common aliases such as CDM, CAM, LM, CF are accepted).
- Give one of `overall` (1–100), `ability` (the game's hidden 1–200 scale) or `attributes` (1–20 per attribute; missing ones are generated).
- `potential` uses the same scale as the rating you gave. If left out, the game estimates it from age.

Clubs with fewer than 22 first-team players get generated players to fill their squads. The clubs in the country you choose to play in also get U21 and U18 squads.

## Checking a file

When you load a file, the start screen lists problems that stop it loading (for example promotion and relegation that don't balance) and notes on what will be filled in. Fix the file and load it again.
