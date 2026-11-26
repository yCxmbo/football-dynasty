import { c, type RCountry } from './types';

export const GERMANY: RCountry = {
  id: 'ger', name: 'Germany', superCup: 'DFL-Supercup',
  cups: [{ id: 'ger-cup', name: 'DFB-Pokal', tiers: [1], main: true }],
  leagues: [
    { id: 'ger1', name: 'Bundesliga', short: 'Bundesliga', tier: 1, promote: 0, relegate: 0, tv: 750_000, clubs: [
      c('augsburg', 'Augsburg Fuggerstädter', 'FCA', 58, ['#BA3733', '#46714D'], 'Augsburg Arena', 30660, [
        ['Finn Dahmen', 'GK', 27, 76, 'GER'], ['Jeffrey Gouweleeuw', 'CB', 34, 74, 'NED'], ['Cédric Zesiger', 'CB', 27, 74, 'SUI'], ['Kristijan Jakić', 'DM', 28, 74, 'CRO'],
        ['Alexis Claude-Maurice', 'AM', 27, 75, 'FRA'], ['Phillip Tietz', 'ST', 28, 73, 'GER']]),
      c('leverkusen', 'Leverkusen Werkself', 'B04', 84, ['#E32221', '#000000'], 'Bay Arena', 30210, [
        ['Mark Flekken', 'GK', 32, 79, 'NED'], ['Edmond Tapsoba', 'CB', 26, 81, 'BFA'], ['Piero Hincapié', 'CB', 23, 81, 'ECU'], ['Jarell Quansah', 'CB', 22, 77, 'ENG'],
        ['Loïc Badé', 'CB', 25, 78, 'FRA'], ['Alejandro Grimaldo', 'LB', 29, 83, 'ESP'], ['Arthur', 'RB', 22, 73, 'BRA'], ['Robert Andrich', 'DM', 30, 79, 'GER'],
        ['Exequiel Palacios', 'CM', 26, 80, 'ARG'], ['Malik Tillman', 'AM', 23, 79, 'USA'], ['Ibrahim Maza', 'AM', 19, 74, 'ALG', 84], ['Nathan Tella', 'RW', 26, 75, 'NGA'],
        ['Christian Kofane', 'ST', 19, 72, 'CMR', 83], ['Patrik Schick', 'ST', 29, 80, 'CZE']]),
      c('bayern', 'Munich Bavarians', 'FCB', 94, ['#DC052D', '#FFFFFF'], 'Allianz Park', 75024, [
        ['Manuel Neuer', 'GK', 39, 84, 'GER'], ['Jonas Urbig', 'GK', 22, 75, 'GER'], ['Dayot Upamecano', 'CB', 26, 84, 'FRA'], ['Jonathan Tah', 'CB', 29, 84, 'GER'],
        ['Kim Min-jae', 'CB', 28, 82, 'KOR'], ['Hiroki Ito', 'CB', 26, 78, 'JPN'], ['Alphonso Davies', 'LB', 24, 82, 'CAN'], ['Josip Stanišić', 'RB', 25, 79, 'CRO'],
        ['Konrad Laimer', 'RB', 28, 80, 'AUT'], ['Joshua Kimmich', 'DM', 30, 88, 'GER'], ['Leon Goretzka', 'CM', 30, 81, 'GER'], ['Aleksandar Pavlović', 'DM', 21, 80, 'GER', 87],
        ['Jamal Musiala', 'AM', 22, 89, 'GER', 93], ['Michael Olise', 'RW', 23, 87, 'FRA', 90], ['Serge Gnabry', 'RW', 30, 80, 'GER'], ['Luis Díaz', 'LW', 28, 85, 'COL'],
        ['Lennart Karl', 'AM', 17, 70, 'GER', 87], ['Nicolas Jackson', 'ST', 24, 79, 'SEN'], ['Harry Kane', 'ST', 32, 90, 'ENG']]),
      c('dortmund', 'Dortmund Black-Yellows', 'BVB', 86, ['#FDE100', '#000000'], 'Westfalen Park', 81365, [
        ['Gregor Kobel', 'GK', 27, 86, 'SUI'], ['Nico Schlotterbeck', 'CB', 25, 83, 'GER'], ['Waldemar Anton', 'CB', 29, 80, 'GER'], ['Niklas Süle', 'CB', 30, 77, 'GER'],
        ['Ramy Bensebaini', 'LB', 30, 77, 'ALG'], ['Julian Ryerson', 'RB', 27, 78, 'NOR'], ['Yan Couto', 'RB', 23, 77, 'BRA'], ['Emre Can', 'DM', 31, 78, 'GER'],
        ['Felix Nmecha', 'CM', 24, 80, 'GER'], ['Pascal Groß', 'CM', 34, 79, 'GER'], ['Jobe Bellingham', 'CM', 19, 76, 'ENG', 86], ['Marcel Sabitzer', 'CM', 31, 79, 'AUT'],
        ['Julian Brandt', 'AM', 29, 81, 'GER'], ['Karim Adeyemi', 'LW', 23, 80, 'GER'], ['Maximilian Beier', 'ST', 22, 79, 'GER'], ['Serhou Guirassy', 'ST', 29, 85, 'GUI']]),
      c('gladbach', 'Mönchengladbach Foals', 'BMG', 66, ['#000000', '#FFFFFF'], 'Borussia Park', 54042, [
        ['Moritz Nicolas', 'GK', 28, 76, 'GER'], ['Nico Elvedi', 'CB', 28, 77, 'SUI'], ['Ko Itakura', 'CB', 28, 77, 'JPN'], ['Joe Scally', 'RB', 22, 75, 'USA'],
        ['Rocco Reitz', 'CM', 23, 77, 'GER'], ['Julian Weigl', 'DM', 29, 77, 'GER'], ['Franck Honorat', 'RW', 28, 77, 'FRA'], ['Kevin Stöger', 'AM', 31, 76, 'AUT'], ['Tim Kleindienst', 'ST', 30, 79, 'GER']]),
      c('frankfurt', 'Frankfurt Eagles', 'SGE', 78, ['#E1000F', '#000000'], 'Forest Park', 58000, [
        ['Kevin Trapp', 'GK', 35, 80, 'GER'], ['Kauã Santos', 'GK', 22, 75, 'BRA'], ['Robin Koch', 'CB', 29, 80, 'GER'], ['Arthur Theate', 'CB', 25, 78, 'BEL'],
        ['Nathaniel Brown', 'LB', 22, 77, 'GER'], ['Rasmus Kristensen', 'RB', 28, 77, 'DEN'], ['Ellyes Skhiri', 'DM', 30, 79, 'TUN'], ['Hugo Larsson', 'CM', 21, 79, 'SWE', 85],
        ['Mario Götze', 'AM', 33, 77, 'GER'], ['Can Uzun', 'AM', 19, 76, 'TUR', 87], ['Ansgar Knauff', 'RW', 23, 76, 'GER'], ['Jonathan Burkardt', 'ST', 25, 79, 'GER'], ['Michy Batshuayi', 'ST', 31, 74, 'BEL']]),
      c('freiburg', 'Black Forest Breisgauer', 'SCF', 70, ['#000000', '#E2001A'], 'Europa Park Stadium', 34700, [
        ['Noah Atubolu', 'GK', 23, 79, 'GER'], ['Matthias Ginter', 'CB', 31, 79, 'GER'], ['Philipp Lienhart', 'CB', 29, 77, 'AUT'], ['Christian Günter', 'LB', 32, 76, 'GER'],
        ['Maximilian Eggestein', 'CM', 28, 77, 'GER'], ['Patrick Osterhage', 'CM', 25, 75, 'GER'], ['Vincenzo Grifo', 'LW', 32, 78, 'ITA'], ['Ritsu Dōan', 'RW', 27, 78, 'JPN'], ['Lucas Höler', 'ST', 31, 74, 'GER']]),
      c('hamburg', 'Hamburg Dinosaurs', 'HSV', 60, ['#0A3F86', '#FFFFFF'], 'Volkspark', 57000, [
        ['Daniel Heuer Fernandes', 'GK', 32, 73, 'POR'], ['Luka Vušković', 'CB', 18, 74, 'CRO', 86], ['Miro Muheim', 'LB', 27, 72, 'SUI'], ['Jonas Meffert', 'DM', 30, 72, 'GER'],
        ['Fábio Vieira', 'AM', 25, 76, 'POR'], ['Ransford Königsdörffer', 'ST', 23, 72, 'GHA']]),
      c('heidenheim', 'Heidenheim Brenzians', 'FCH', 52, ['#E2001A', '#003D7C'], 'Voith Park', 15000, [
        ['Kevin Müller', 'GK', 34, 73, 'GER'], ['Patrick Mainka', 'CB', 31, 72, 'GER'], ['Jan Schöppner', 'CM', 26, 72, 'GER'], ['Marvin Pieringer', 'ST', 26, 72, 'GER']]),
      c('hoffenheim', 'Kraichgau Hoffenheim', 'TSG', 64, ['#1961B5', '#FFFFFF'], 'Kraichgau Arena', 30150, [
        ['Oliver Baumann', 'GK', 35, 79, 'GER'], ['Ozan Kabak', 'CB', 25, 76, 'TUR'], ['Vladimír Coufal', 'RB', 33, 74, 'CZE'], ['Grischa Prömel', 'CM', 30, 75, 'GER'],
        ['Andrej Kramarić', 'ST', 34, 79, 'CRO'], ['Fisnik Asllani', 'ST', 23, 75, 'KOS'], ['Bazoumana Touré', 'LW', 19, 73, 'CIV', 84]]),
      c('koln', 'Cologne Billy Goats', 'KOE', 56, ['#ED1C24', '#FFFFFF'], 'Rhine Energy Park', 50000, [
        ['Marvin Schwäbe', 'GK', 30, 74, 'GER'], ['Timo Hübers', 'CB', 29, 73, 'GER'], ['Eric Martel', 'DM', 23, 74, 'GER'], ['Said El Mala', 'LW', 19, 74, 'GER', 85], ['Ragnar Ache', 'ST', 27, 73, 'GER']]),
      c('mainz', 'Mainz Carnival Club', 'M05', 64, ['#C3141E', '#FFFFFF'], 'Mainz Arena', 33305, [
        ['Robin Zentner', 'GK', 30, 77, 'GER'], ['Stefan Bell', 'CB', 34, 74, 'GER'], ['Danny da Costa', 'RB', 32, 73, 'GER'], ['Nadiem Amiri', 'CM', 29, 79, 'GER'],
        ['Kaishu Sano', 'DM', 24, 76, 'JPN'], ['Paul Nebel', 'AM', 22, 76, 'GER'], ['Jae-sung Lee', 'AM', 32, 76, 'KOR'], ['Arnaud Nordin', 'LW', 27, 74, 'FRA']]),
      c('leipzig', 'Leipzig Bulls', 'RBL', 82, ['#DD0741', '#FFFFFF'], 'Red Bull Ground', 47069, [
        ['Péter Gulácsi', 'GK', 35, 79, 'HUN'], ['Maarten Vandevoordt', 'GK', 23, 77, 'BEL'], ['Willi Orbán', 'CB', 32, 81, 'HUN'], ['Castello Lukeba', 'CB', 22, 81, 'FRA'],
        ['El Chadaille Bitshiabu', 'CB', 20, 74, 'FRA'], ['David Raum', 'LB', 27, 80, 'GER'], ['Ridle Baku', 'RB', 27, 76, 'GER'], ['Xaver Schlager', 'CM', 27, 80, 'AUT'],
        ['Christoph Baumgartner', 'AM', 26, 79, 'AUT'], ['Assan Ouédraogo', 'CM', 19, 75, 'GER', 86], ['Antonio Nusa', 'LW', 20, 76, 'NOR', 86], ['Yan Diomande', 'RW', 18, 72, 'CIV', 86],
        ['Rômulo', 'ST', 23, 74, 'BRA'], ['Conrad Harder', 'ST', 20, 74, 'DEN']]),
      c('stpauli', 'Hamburg Buccaneers', 'STP', 52, ['#6B3D2E', '#FFFFFF'], 'Millerntor Ground', 29546, [
        ['Nikola Vasilj', 'GK', 29, 76, 'BIH'], ['Hauke Wahl', 'CB', 31, 74, 'GER'], ['Eric Smith', 'DM', 28, 75, 'SWE'], ['Jackson Irvine', 'CM', 32, 74, 'AUS'], ['Andréas Hountondji', 'ST', 23, 72, 'BEN']]),
      c('stuttgart', 'Stuttgart Swabians', 'VFB', 78, ['#FFFFFF', '#E32219'], 'Neckar Park', 60449, [
        ['Alexander Nübel', 'GK', 28, 80, 'GER'], ['Jeff Chabot', 'CB', 27, 77, 'GER'], ['Ameen Al-Dakhil', 'CB', 23, 75, 'BEL'], ['Maximilian Mittelstädt', 'LB', 28, 78, 'GER'],
        ['Josha Vagnoman', 'RB', 24, 75, 'GER'], ['Angelo Stiller', 'DM', 24, 82, 'GER'], ['Atakan Karazor', 'DM', 28, 76, 'GER'], ['Chris Führich', 'LW', 27, 77, 'GER'],
        ['Jamie Leweling', 'RW', 24, 78, 'GER'], ['Bilal El Khannouss', 'AM', 21, 77, 'MAR'], ['Ermedin Demirović', 'ST', 27, 79, 'BIH'], ['Deniz Undav', 'ST', 29, 79, 'GER']]),
      c('union', 'Berlin Iron Union', 'FCU', 62, ['#EB1923', '#FFFFFF'], 'Old Forester Ground', 22012, [
        ['Frederik Rønnow', 'GK', 33, 76, 'DEN'], ['Diogo Leite', 'CB', 26, 76, 'POR'], ['Danilho Doekhi', 'CB', 27, 76, 'NED'], ['Rani Khedira', 'DM', 31, 75, 'GER'],
        ['Christopher Trimmel', 'RB', 38, 70, 'AUT'], ['Ilyas Ansah', 'ST', 20, 72, 'GER'], ['Andrej Ilić', 'ST', 25, 73, 'SRB']]),
      c('werder', 'Bremen River Club', 'SVW', 64, ['#1D9053', '#FFFFFF'], 'Weser Park', 42100, [
        ['Mio Backhaus', 'GK', 21, 72, 'GER'], ['Marco Friedl', 'CB', 27, 76, 'AUT'], ['Niklas Stark', 'CB', 30, 74, 'GER'], ['Mitchell Weiser', 'RB', 31, 77, 'GER'],
        ['Senne Lynen', 'DM', 26, 76, 'BEL'], ['Jens Stage', 'CM', 28, 77, 'DEN'], ['Romano Schmid', 'AM', 25, 77, 'AUT'], ['Marvin Ducksch', 'ST', 31, 75, 'GER']]),
      c('wolfsburg', 'Wolfsburg She-Wolves', 'WOB', 66, ['#65B32E', '#FFFFFF'], 'Wolfsburg Arena', 30000, [
        ['Kamil Grabara', 'GK', 26, 78, 'POL'], ['Konstantinos Koulierakis', 'CB', 21, 76, 'GRE'], ['Denis Vavro', 'CB', 29, 75, 'SVK'], ['Joakim Mæhle', 'LB', 28, 76, 'DEN'],
        ['Maximilian Arnold', 'CM', 31, 78, 'GER'], ['Mattias Svanberg', 'CM', 26, 76, 'SWE'], ['Christian Eriksen', 'AM', 33, 77, 'DEN'], ['Patrick Wimmer', 'RW', 24, 76, 'AUT'], ['Mohamed Amoura', 'ST', 25, 79, 'ALG']]),
    ] },
  ],
};
