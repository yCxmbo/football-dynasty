import { c, type RCountry } from './types';

export const ENGLAND: RCountry = {
  id: 'eng', name: 'England', superCup: 'Community Shield',
  cups: [{ id: 'eng-fa', name: 'FA Cup', tiers: [1, 2, 3], main: true }, { id: 'eng-lc', name: 'EFL Cup', tiers: [1, 2, 3] }],
  leagues: [
    { id: 'eng1', name: 'Premier League', short: 'Premier League', tier: 1, promote: 0, relegate: 3, tv: 1_400_000, clubs: [
      c('arsenal', 'London Gunners', 'LGU', 90, ['#EF0107', '#FFFFFF'], 'Gunners Stadium', 60704, [
        ['David Raya', 'GK', 29, 87, 'ESP'], ['William Saliba', 'CB', 24, 88, 'FRA'], ['Gabriel Magalhães', 'CB', 27, 87, 'BRA'], ['Jurriën Timber', 'RB', 24, 84, 'NED'],
        ['Riccardo Calafiori', 'LB', 23, 81, 'ITA'], ['Ben White', 'RB', 27, 82, 'ENG'], ['Declan Rice', 'CM', 26, 87, 'ENG'], ['Martin Zubimendi', 'DM', 26, 85, 'ESP'],
        ['Martin Ødegaard', 'AM', 26, 87, 'NOR'], ['Mikel Merino', 'CM', 29, 83, 'ESP'], ['Bukayo Saka', 'RW', 23, 88, 'ENG'], ['Gabriel Martinelli', 'LW', 24, 82, 'BRA'],
        ['Kai Havertz', 'ST', 26, 83, 'GER'], ['Viktor Gyökeres', 'ST', 27, 86, 'SWE'], ['Noni Madueke', 'RW', 23, 80, 'ENG'], ['Leandro Trossard', 'LW', 30, 81, 'BEL'],
        ['Myles Lewis-Skelly', 'LB', 18, 76, 'ENG', 86], ['Ethan Nwaneri', 'AM', 18, 76, 'ENG', 88], ['Kepa Arrizabalaga', 'GK', 30, 79, 'ESP']]),
      c('astonvilla', 'Birmingham Villans', 'BVI', 82, ['#670E36', '#95BFE5'], 'Villans Park', 42785, [
        ['Emiliano Martínez', 'GK', 32, 85, 'ARG'], ['Ezri Konsa', 'CB', 27, 81, 'ENG'], ['Pau Torres', 'CB', 28, 81, 'ESP'], ['Tyrone Mings', 'CB', 32, 77, 'ENG'],
        ['Matty Cash', 'RB', 28, 78, 'POL'], ['Lucas Digne', 'LB', 32, 78, 'FRA'], ['Youri Tielemans', 'CM', 28, 82, 'BEL'], ['Boubacar Kamara', 'DM', 25, 81, 'FRA'],
        ['Amadou Onana', 'DM', 24, 79, 'BEL'], ['John McGinn', 'CM', 30, 79, 'SCO'], ['Morgan Rogers', 'AM', 22, 81, 'ENG', 87], ['Leon Bailey', 'RW', 28, 78, 'JAM'],
        ['Ollie Watkins', 'ST', 29, 83, 'ENG']]),
      c('bournemouth', 'Dorset Cherries', 'DCH', 72, ['#DA291C', '#000000'], 'Cherries Court', 11307, [
        ['Đorđe Petrović', 'GK', 25, 78, 'SRB'], ['Marcos Senesi', 'CB', 28, 77, 'ARG'], ['Adam Smith', 'RB', 34, 74, 'ENG'], ['Tyler Adams', 'DM', 26, 77, 'USA'],
        ['Ryan Christie', 'CM', 30, 76, 'SCO'], ['Alex Scott', 'CM', 21, 76, 'ENG', 84], ['Marcus Tavernier', 'RW', 26, 79, 'ENG'], ['Justin Kluivert', 'AM', 26, 79, 'NED'],
        ['Antoine Semenyo', 'RW', 25, 80, 'GHA'], ['Evanilson', 'ST', 25, 78, 'BRA']]),
      c('brentford', 'West London Bees', 'WLB', 70, ['#E30613', '#FFFFFF'], 'Bees Stadium', 17250, [
        ['Caoimhín Kelleher', 'GK', 26, 79, 'IRL'], ['Nathan Collins', 'CB', 24, 77, 'IRL'], ['Sepp van den Berg', 'CB', 23, 76, 'NED'], ['Kristoffer Ajer', 'CB', 27, 75, 'NOR'],
        ['Aaron Hickey', 'RB', 23, 76, 'SCO'], ['Michael Kayode', 'RB', 21, 75, 'ITA'], ['Mathias Jensen', 'CM', 29, 75, 'DEN'], ['Mikkel Damsgaard', 'AM', 25, 77, 'DEN'],
        ['Kevin Schade', 'LW', 23, 76, 'GER'], ['Keane Lewis-Potter', 'LB', 24, 75, 'ENG'], ['Igor Thiago', 'ST', 24, 76, 'BRA']]),
      c('brighton', 'Sussex Seagulls', 'SSG', 76, ['#0057B8', '#FFFFFF'], 'Seagulls Arena', 31876, [
        ['Bart Verbruggen', 'GK', 23, 79, 'NED'], ['Lewis Dunk', 'CB', 33, 77, 'ENG'], ['Jan Paul van Hecke', 'CB', 25, 78, 'NED'], ['Ferdi Kadıoğlu', 'LB', 25, 77, 'TUR'],
        ['Mats Wieffer', 'RB', 26, 76, 'NED'], ['Carlos Baleba', 'DM', 21, 80, 'CMR', 86], ['Yasin Ayari', 'CM', 21, 76, 'SWE'], ['Kaoru Mitoma', 'LW', 28, 80, 'JPN'],
        ['Yankuba Minteh', 'RW', 21, 77, 'GAM', 85], ['Georginio Rutter', 'AM', 23, 78, 'FRA'], ['Danny Welbeck', 'ST', 34, 76, 'ENG'], ['James Milner', 'CM', 39, 72, 'ENG']]),
      c('burnley', 'Lancashire Clarets', 'LCL', 62, ['#6C1D45', '#99D6EA'], 'Turf End', 21944, [
        ['Martin Dúbravka', 'GK', 36, 75, 'SVK'], ['Kyle Walker', 'RB', 35, 77, 'ENG'], ['Maxime Estève', 'CB', 23, 74, 'FRA'], ['Hannibal Mejbri', 'CM', 22, 74, 'TUN'],
        ['Josh Cullen', 'CM', 29, 74, 'IRL'], ['Lesley Ugochukwu', 'DM', 21, 73, 'FRA'], ['Jaidon Anthony', 'LW', 25, 74, 'ENG'], ['Zian Flemming', 'ST', 26, 74, 'NED'], ['Lyle Foster', 'ST', 24, 73, 'RSA']]),
      c('chelsea', 'London Blues', 'LBL', 89, ['#034694', '#FFFFFF'], 'Blues Bridge', 40341, [
        ['Robert Sánchez', 'GK', 27, 79, 'ESP'], ['Filip Jørgensen', 'GK', 23, 76, 'DEN'], ['Reece James', 'RB', 25, 83, 'ENG'], ['Malo Gusto', 'RB', 22, 79, 'FRA'],
        ['Levi Colwill', 'CB', 22, 81, 'ENG'], ['Wesley Fofana', 'CB', 24, 79, 'FRA'], ['Trevoh Chalobah', 'CB', 26, 78, 'ENG'], ['Marc Cucurella', 'LB', 27, 82, 'ESP'],
        ['Moisés Caicedo', 'DM', 23, 86, 'ECU'], ['Enzo Fernández', 'CM', 24, 85, 'ARG'], ['Roméo Lavia', 'DM', 21, 79, 'BEL'], ['Cole Palmer', 'AM', 23, 87, 'ENG'],
        ['Pedro Neto', 'RW', 25, 82, 'POR'], ['João Pedro', 'ST', 23, 81, 'BRA'], ['Liam Delap', 'ST', 22, 78, 'ENG'], ['Jamie Gittens', 'LW', 21, 77, 'ENG'], ['Estêvão', 'RW', 18, 77, 'BRA', 89]]),
      c('crystalpalace', 'South London Eagles', 'SLE', 74, ['#1B458F', '#C4122E'], 'Eagles Park', 25486, [
        ['Dean Henderson', 'GK', 28, 81, 'ENG'], ['Marc Guéhi', 'CB', 25, 82, 'ENG'], ['Maxence Lacroix', 'CB', 25, 79, 'FRA'], ['Chris Richards', 'CB', 25, 76, 'USA'],
        ['Daniel Muñoz', 'RB', 29, 80, 'COL'], ['Tyrick Mitchell', 'LB', 26, 77, 'ENG'], ['Adam Wharton', 'CM', 21, 79, 'ENG', 86], ['Jefferson Lerma', 'DM', 30, 77, 'COL'],
        ['Daichi Kamada', 'AM', 29, 78, 'JPN'], ['Ismaïla Sarr', 'RW', 27, 78, 'SEN'], ['Jean-Philippe Mateta', 'ST', 28, 80, 'FRA']]),
      c('everton', 'Merseyside Toffees', 'MTO', 74, ['#003399', '#FFFFFF'], 'Toffees Dock', 52888, [
        ['Jordan Pickford', 'GK', 31, 83, 'ENG'], ['James Tarkowski', 'CB', 32, 79, 'ENG'], ['Jarrad Branthwaite', 'CB', 23, 79, 'ENG'], ['Jake O\'Brien', 'CB', 24, 76, 'IRL'],
        ['Vitaliy Mykolenko', 'LB', 26, 77, 'UKR'], ['Idrissa Gueye', 'DM', 35, 75, 'SEN'], ['James Garner', 'CM', 24, 77, 'ENG'], ['Kiernan Dewsbury-Hall', 'CM', 26, 77, 'ENG'],
        ['Iliman Ndiaye', 'LW', 25, 79, 'SEN'], ['Jack Grealish', 'LW', 29, 80, 'ENG'], ['Beto', 'ST', 27, 76, 'POR'], ['Thierno Barry', 'ST', 22, 74, 'FRA']]),
      c('fulham', 'Thames Cottagers', 'TCO', 72, ['#FFFFFF', '#000000'], 'Riverside Cottage', 29589, [
        ['Bernd Leno', 'GK', 33, 80, 'GER'], ['Joachim Andersen', 'CB', 29, 79, 'DEN'], ['Calvin Bassey', 'CB', 25, 76, 'NGA'], ['Antonee Robinson', 'LB', 27, 79, 'USA'],
        ['Kenny Tete', 'RB', 29, 76, 'NED'], ['Sander Berge', 'DM', 27, 78, 'NOR'], ['Saša Lukić', 'CM', 28, 77, 'SRB'], ['Andreas Pereira', 'AM', 29, 79, 'BRA'],
        ['Emile Smith Rowe', 'AM', 25, 78, 'ENG'], ['Alex Iwobi', 'RW', 29, 78, 'NGA'], ['Raúl Jiménez', 'ST', 34, 76, 'MEX'], ['Rodrigo Muniz', 'ST', 24, 76, 'BRA']]),
      c('leeds', 'Yorkshire Whites', 'YWH', 66, ['#FFFFFF', '#1D428A'], 'Elland Lane', 37792, [
        ['Illan Meslier', 'GK', 25, 75, 'FRA'], ['Joe Rodon', 'CB', 27, 76, 'WAL'], ['Jaka Bijol', 'CB', 26, 77, 'SVN'], ['Pascal Struijk', 'CB', 26, 75, 'NED'],
        ['Jayden Bogle', 'RB', 25, 74, 'ENG'], ['Ethan Ampadu', 'DM', 24, 76, 'WAL'], ['Ao Tanaka', 'CM', 26, 76, 'JPN'], ['Anton Stach', 'CM', 26, 77, 'GER'],
        ['Willy Gnonto', 'LW', 21, 75, 'ITA'], ['Daniel James', 'RW', 27, 75, 'WAL'], ['Lukas Nmecha', 'ST', 26, 75, 'GER'], ['Joël Piroe', 'ST', 25, 74, 'NED']]),
      c('liverpool', 'Merseyside Reds', 'MRE', 93, ['#C8102E', '#FFFFFF'], 'Anfield Road Ground', 61276, [
        ['Alisson', 'GK', 32, 88, 'BRA'], ['Giorgi Mamardashvili', 'GK', 24, 81, 'GEO'], ['Virgil van Dijk', 'CB', 34, 88, 'NED'], ['Ibrahima Konaté', 'CB', 26, 84, 'FRA'],
        ['Jeremie Frimpong', 'RB', 24, 83, 'NED'], ['Conor Bradley', 'RB', 22, 77, 'NIR'], ['Milos Kerkez', 'LB', 21, 80, 'HUN', 85], ['Andrew Robertson', 'LB', 31, 81, 'SCO'],
        ['Ryan Gravenberch', 'DM', 23, 85, 'NED'], ['Alexis Mac Allister', 'CM', 26, 86, 'ARG'], ['Dominik Szoboszlai', 'CM', 24, 83, 'HUN'], ['Curtis Jones', 'CM', 24, 80, 'ENG'],
        ['Wataru Endo', 'DM', 32, 77, 'JPN'], ['Florian Wirtz', 'AM', 22, 88, 'GER', 92], ['Mohamed Salah', 'RW', 33, 89, 'EGY'], ['Cody Gakpo', 'LW', 26, 83, 'NED'],
        ['Hugo Ekitiké', 'ST', 23, 82, 'FRA', 87], ['Federico Chiesa', 'RW', 27, 76, 'ITA']]),
      c('mancity', 'Manchester Sky Blues', 'MSB', 92, ['#6CABDD', '#FFFFFF'], 'Etihad Way', 53400, [
        ['Stefan Ortega', 'GK', 32, 79, 'GER'], ['James Trafford', 'GK', 22, 78, 'ENG'], ['Rúben Dias', 'CB', 28, 87, 'POR'], ['Joško Gvardiol', 'CB', 23, 85, 'CRO'],
        ['John Stones', 'CB', 31, 81, 'ENG'], ['Nathan Aké', 'CB', 30, 80, 'NED'], ['Abdukodir Khusanov', 'CB', 21, 76, 'UZB'], ['Rayan Aït-Nouri', 'LB', 24, 82, 'ALG'],
        ['Rico Lewis', 'RB', 20, 77, 'ENG'], ['Rodri', 'DM', 29, 89, 'ESP'], ['Tijjani Reijnders', 'CM', 27, 85, 'NED'], ['Bernardo Silva', 'CM', 31, 85, 'POR'],
        ['Mateo Kovačić', 'CM', 31, 81, 'CRO'], ['Nico González', 'DM', 23, 79, 'ESP'], ['Phil Foden', 'AM', 25, 85, 'ENG'], ['Rayan Cherki', 'AM', 21, 82, 'FRA', 88],
        ['Jérémy Doku', 'LW', 23, 82, 'BEL'], ['Savinho', 'RW', 21, 80, 'BRA', 87], ['Omar Marmoush', 'ST', 26, 82, 'EGY'], ['Erling Haaland', 'ST', 25, 90, 'NOR']]),
      c('manutd', 'Manchester Reds', 'MRD', 88, ['#DA291C', '#000000'], 'Theatre Lane', 74310, [
        ['André Onana', 'GK', 29, 80, 'CMR'], ['Altay Bayındır', 'GK', 27, 74, 'TUR'], ['Matthijs de Ligt', 'CB', 25, 81, 'NED'], ['Lisandro Martínez', 'CB', 27, 82, 'ARG'],
        ['Leny Yoro', 'CB', 19, 77, 'FRA', 87], ['Harry Maguire', 'CB', 32, 77, 'ENG'], ['Diogo Dalot', 'RB', 26, 79, 'POR'], ['Noussair Mazraoui', 'RB', 27, 79, 'MAR'],
        ['Luke Shaw', 'LB', 30, 78, 'ENG'], ['Patrick Dorgu', 'LB', 20, 76, 'DEN'], ['Casemiro', 'DM', 33, 79, 'BRA'], ['Manuel Ugarte', 'DM', 24, 78, 'URU'],
        ['Kobbie Mainoo', 'CM', 20, 79, 'ENG', 87], ['Bruno Fernandes', 'AM', 30, 86, 'POR'], ['Matheus Cunha', 'AM', 26, 82, 'BRA'], ['Mason Mount', 'AM', 26, 77, 'ENG'],
        ['Bryan Mbeumo', 'RW', 25, 83, 'CMR'], ['Amad Diallo', 'RW', 23, 79, 'CIV'], ['Benjamin Šeško', 'ST', 22, 81, 'SVN', 87], ['Joshua Zirkzee', 'ST', 24, 76, 'NED']]),
      c('newcastle', 'Tyneside Magpies', 'TMA', 86, ['#000000', '#FFFFFF'], 'Gallowgate Park', 52305, [
        ['Nick Pope', 'GK', 33, 82, 'ENG'], ['Kieran Trippier', 'RB', 34, 78, 'ENG'], ['Tino Livramento', 'RB', 22, 79, 'ENG'], ['Sven Botman', 'CB', 25, 80, 'NED'],
        ['Fabian Schär', 'CB', 33, 79, 'SUI'], ['Dan Burn', 'CB', 33, 78, 'ENG'], ['Lewis Hall', 'LB', 20, 78, 'ENG', 85], ['Bruno Guimarães', 'CM', 27, 86, 'BRA'],
        ['Sandro Tonali', 'CM', 25, 84, 'ITA'], ['Joelinton', 'CM', 29, 81, 'BRA'], ['Anthony Gordon', 'LW', 24, 83, 'ENG'], ['Harvey Barnes', 'LW', 27, 77, 'ENG'],
        ['Jacob Murphy', 'RW', 30, 78, 'ENG'], ['Anthony Elanga', 'RW', 23, 79, 'SWE'], ['Alexander Isak', 'ST', 25, 87, 'SWE']]),
      c('forest', 'Trent Foresters', 'TFO', 76, ['#DD0000', '#FFFFFF'], 'Trentside', 30404, [
        ['Matz Sels', 'GK', 33, 80, 'BEL'], ['Murillo', 'CB', 23, 81, 'BRA'], ['Nikola Milenković', 'CB', 27, 80, 'SRB'], ['Ola Aina', 'RB', 28, 77, 'NGA'],
        ['Neco Williams', 'LB', 24, 76, 'WAL'], ['Elliot Anderson', 'CM', 23, 81, 'ENG', 85], ['Ibrahim Sangaré', 'DM', 27, 77, 'CIV'], ['Morgan Gibbs-White', 'AM', 25, 82, 'ENG'],
        ['Callum Hudson-Odoi', 'LW', 24, 78, 'ENG'], ['Dan Ndoye', 'RW', 24, 79, 'SUI'], ['Chris Wood', 'ST', 33, 79, 'NZL']]),
      c('sunderland', 'Wearside Black Cats', 'WBC', 64, ['#EB172B', '#FFFFFF'], 'Light Stadium', 49000, [
        ['Robin Roefs', 'GK', 22, 75, 'NED'], ['Jordan Mukiele', 'RB', 27, 77, 'FRA'], ['Reinildo Mandava', 'LB', 31, 76, 'MOZ'], ['Dan Ballard', 'CB', 25, 72, 'NIR'],
        ['Granit Xhaka', 'CM', 32, 81, 'SUI'], ['Noah Sadiki', 'DM', 20, 76, 'COD'], ['Enzo Le Fée', 'CM', 25, 76, 'FRA'], ['Chris Rigg', 'CM', 18, 70, 'ENG', 82],
        ['Simon Adingra', 'LW', 23, 77, 'CIV'], ['Chemsdine Talbi', 'RW', 20, 76, 'MAR'], ['Wilson Isidor', 'ST', 25, 75, 'FRA']]),
      c('tottenham', 'North London Lilywhites', 'NLL', 85, ['#FFFFFF', '#132257'], 'Lilywhite Lane', 62850, [
        ['Guglielmo Vicario', 'GK', 28, 82, 'ITA'], ['Cristian Romero', 'CB', 27, 85, 'ARG'], ['Micky van de Ven', 'CB', 24, 83, 'NED'], ['Kevin Danso', 'CB', 26, 78, 'AUT'],
        ['Pedro Porro', 'RB', 25, 81, 'ESP'], ['Destiny Udogie', 'LB', 22, 79, 'ITA'], ['Djed Spence', 'LB', 25, 76, 'ENG'], ['Rodrigo Bentancur', 'CM', 28, 79, 'URU'],
        ['Yves Bissouma', 'DM', 28, 78, 'MLI'], ['Pape Matar Sarr', 'CM', 22, 78, 'SEN'], ['Lucas Bergvall', 'CM', 19, 76, 'SWE', 86], ['Archie Gray', 'CM', 19, 75, 'ENG', 85],
        ['James Maddison', 'AM', 28, 82, 'ENG'], ['Dejan Kulusevski', 'RW', 25, 81, 'SWE'], ['Mohammed Kudus', 'RW', 25, 82, 'GHA'], ['Brennan Johnson', 'RW', 24, 80, 'WAL'],
        ['Dominic Solanke', 'ST', 27, 80, 'ENG'], ['Richarlison', 'ST', 28, 77, 'BRA']]),
      c('westham', 'East London Hammers', 'ELH', 76, ['#7A263A', '#1BB1E7'], 'Hammers Stadium', 62500, [
        ['Alphonse Areola', 'GK', 32, 79, 'FRA'], ['Mads Hermansen', 'GK', 25, 76, 'DEN'], ['Max Kilman', 'CB', 28, 78, 'UKR'], ['Jean-Clair Todibo', 'CB', 25, 78, 'FRA'],
        ['Konstantinos Mavropanos', 'CB', 27, 77, 'GRE'], ['Aaron Wan-Bissaka', 'RB', 27, 79, 'ENG'], ['Tomáš Souček', 'CM', 30, 78, 'CZE'], ['James Ward-Prowse', 'CM', 30, 77, 'ENG'],
        ['Lucas Paquetá', 'AM', 27, 82, 'BRA'], ['Jarrod Bowen', 'RW', 28, 82, 'ENG'], ['Crysencio Summerville', 'LW', 23, 77, 'NED'], ['Niclas Füllkrug', 'ST', 32, 77, 'GER'], ['Callum Wilson', 'ST', 33, 75, 'ENG']]),
      c('wolves', 'Black Country Wolves', 'BCW', 70, ['#FDB913', '#231F20'], 'Molineux Road', 31750, [
        ['José Sá', 'GK', 32, 79, 'POR'], ['Toti Gomes', 'CB', 26, 76, 'POR'], ['Emmanuel Agbadou', 'CB', 28, 76, 'CIV'], ['Santiago Bueno', 'CB', 26, 74, 'URU'],
        ['Matt Doherty', 'RB', 33, 74, 'IRL'], ['André', 'CM', 24, 77, 'BRA'], ['João Gomes', 'DM', 24, 79, 'BRA'], ['Jean-Ricner Bellegarde', 'AM', 27, 76, 'FRA'],
        ['Marshall Munetsi', 'CM', 29, 74, 'ZIM'], ['Jhon Arias', 'RW', 27, 76, 'COL'], ['Hwang Hee-chan', 'ST', 29, 76, 'KOR'], ['Jørgen Strand Larsen', 'ST', 25, 78, 'NOR']]),
    ] },
    { id: 'eng2', name: 'EFL Championship', short: 'Championship', tier: 2, promote: 2, playoff: [3, 6], relegate: 3, tv: 500_000, clubs: [
      c('birmingham', 'Birmingham Blues', 'BIR', 58, ['#0000FF', '#FFFFFF'], 'St Andrew\'s Road', 29409), c('blackburn', 'Lancashire Rovers', 'BLR', 55, ['#009EE0', '#FFFFFF'], 'Ewood Lane', 31367),
      c('bristolcity', 'Bristol Reds', 'BRC', 54, ['#E21B23', '#FFFFFF'], 'Ashton Park', 27000), c('charlton', 'Charlton Addicks', 'CHA', 52, ['#D4021D', '#FFFFFF'], 'The Valley Road', 27111),
      c('coventry', 'Coventry Sky Blues', 'COV', 56, ['#6CABDD', '#FFFFFF'], 'Sky Blue Arena', 32609), c('derby', 'Derby Rams', 'DER', 55, ['#FFFFFF', '#000000'], 'Pride Park Road', 33597),
      c('hull', 'Humber Tigers', 'HUL', 53, ['#F5A12D', '#000000'], 'Humber Stadium', 25586), c('ipswich', 'Suffolk Tractors', 'IPS', 60, ['#3A64A3', '#FFFFFF'], 'Portman Lane', 29673),
      c('leicester', 'Leicester Foxes', 'LEI', 62, ['#003090', '#FDBE11'], 'Fox Stadium', 32259), c('middlesbrough', 'Teesside Boro', 'MID', 56, ['#E11B22', '#FFFFFF'], 'Riverside Teesside', 34742),
      c('millwall', 'South Bermondsey Lions', 'MIL', 52, ['#001D5E', '#FFFFFF'], 'The Den Road', 20146), c('norwich', 'Norfolk Canaries', 'NOR', 55, ['#FFF200', '#00A650'], 'Carrow Lane', 27359),
      c('oxford', 'Oxford Yellows', 'OXF', 48, ['#FFDD00', '#002147'], 'Kassam Road', 12500), c('portsmouth', 'Pompey Blues', 'POM', 50, ['#001489', '#FFFFFF'], 'Fratton Lane', 20899),
      c('preston', 'Preston Lilywhites', 'PNE', 50, ['#FFFFFF', '#001D5E'], 'Deepdale Road', 23404), c('qpr', 'Shepherd\'s Bush Hoops', 'QPR', 50, ['#1D5BA4', '#FFFFFF'], 'Loftus Lane', 18439),
      c('sheffutd', 'Sheffield Blades', 'SHU', 58, ['#EE2737', '#FFFFFF'], 'Bramall Road', 32050), c('sheffwed', 'Sheffield Owls', 'SHW', 52, ['#0E00F7', '#FFFFFF'], 'Hillsborough Road', 39732),
      c('southampton', 'Hampshire Saints', 'SOU', 62, ['#D71920', '#FFFFFF'], 'St Mary\'s Road', 32384), c('stoke', 'Potteries Stoke', 'STK', 52, ['#E03A3E', '#FFFFFF'], 'Potteries Stadium', 30089),
      c('swansea', 'Swansea Swans', 'SWA', 52, ['#FFFFFF', '#000000'], 'Swansea Bay Stadium', 21088), c('watford', 'Hertfordshire Hornets', 'WAT', 53, ['#FBEE23', '#ED2127'], 'Vicarage Lane', 22200),
      c('westbrom', 'West Bromwich Throstles', 'WBA', 56, ['#122F67', '#FFFFFF'], 'Hawthorns Road', 26850), c('wrexham', 'Wrexham Red Dragons', 'WRE', 54, ['#D71920', '#FFFFFF'], 'Racecourse Road', 12600),
    ] },
    { id: 'eng3', name: 'EFL League One', short: 'League One', tier: 3, promote: 2, playoff: [3, 6], relegate: 0, tv: 220_000, clubs: [
      c('wimbledon', 'Wimbledon Dons', 'WIM', 38, ['#00008B', '#FFD700'], 'Plough Road', 9215), c('barnsley', 'Barnsley Tykes', 'BAR', 42, ['#D71920', '#FFFFFF'], 'Oakwell Road', 23287),
      c('blackpool', 'Blackpool Seasiders', 'BLP', 42, ['#F68712', '#FFFFFF'], 'Bloomfield Lane', 16616), c('bolton', 'Bolton Trotters', 'BOL', 46, ['#FFFFFF', '#263C7E'], 'Trotters Stadium', 28723),
      c('bradford', 'Bradford Bantams', 'BRA', 40, ['#8B0000', '#FFB81C'], 'Valley Parade Road', 25136), c('burton', 'Burton Brewers', 'BUR', 34, ['#FFD200', '#000000'], 'Brewers Ground', 6912),
      c('cardiff', 'Cardiff Bluebirds', 'CDF', 48, ['#0070B5', '#FFFFFF'], 'Bluebird Stadium', 33280), c('doncaster', 'Donny Rovers', 'DON', 38, ['#E30613', '#FFFFFF'], 'Eco-Power Road', 15231),
      c('exeter', 'Exeter Grecians', 'EXE', 34, ['#D71920', '#FFFFFF'], 'St James Lane', 8696), c('huddersfield', 'Huddersfield Terriers', 'HUD', 46, ['#0E63AD', '#FFFFFF'], 'Terriers Stadium', 24121),
      c('orient', 'East London Orient', 'LEY', 38, ['#D71920', '#FFFFFF'], 'Brisbane Lane', 9271), c('lincoln', 'Lincoln Imps', 'LIN', 38, ['#D71920', '#FFFFFF'], 'Sincil Lane', 10120),
      c('luton', 'Luton Hatters', 'LUT', 50, ['#F78F1E', '#002D62'], 'Kenilworth Lane', 11500), c('mansfield', 'Mansfield Stags', 'MAN', 34, ['#FFD200', '#003C8C'], 'Field Mill Road', 9186),
      c('northampton', 'Northampton Cobblers', 'NTH', 33, ['#800000', '#FFFFFF'], 'Sixfields Road', 7798), c('peterborough', 'Peterborough Posh', 'PET', 40, ['#0055A5', '#FFFFFF'], 'London Road Ground', 15314),
      c('plymouth', 'Plymouth Pilgrims', 'PLY', 44, ['#00553F', '#FFFFFF'], 'Home Park Road', 17900), c('portvale', 'Port Vale Valiants', 'PVA', 33, ['#FFFFFF', '#000000'], 'Vale Park Road', 15036),
      c('reading', 'Reading Royals', 'REA', 42, ['#004494', '#FFFFFF'], 'Royals Stadium', 24161), c('rotherham', 'Rotherham Millers', 'ROT', 38, ['#D71920', '#FFFFFF'], 'Millers Stadium', 12021),
      c('stevenage', 'Stevenage Boro', 'STE', 34, ['#D71920', '#FFFFFF'], 'Broadhall Lane', 7800), c('stockport', 'Stockport Hatters', 'STP', 40, ['#003D99', '#FFFFFF'], 'Edgeley Road', 10800),
      c('wigan', 'Wigan Latics', 'WIG', 40, ['#1D59AF', '#FFFFFF'], 'Brick Community Stadium', 25138), c('wycombe', 'Wycombe Chairboys', 'WYC', 36, ['#6CABDD', '#00205B'], 'Adams Lane', 10137),
    ] },
  ],
};
