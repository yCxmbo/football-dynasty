import { c, type RCountry } from './types';

export const ITALY: RCountry = {
  id: 'ita', name: 'Italy', superCup: 'Supercoppa Italiana',
  cups: [{ id: 'ita-cup', name: 'Coppa Italia', tiers: [1], main: true }],
  leagues: [
    { id: 'ita1', name: 'Serie A', short: 'Serie A', tier: 1, promote: 0, relegate: 0, tv: 850_000, clubs: [
      c('atalanta', 'Bergamo Nerazzurri', 'ATA', 80, ['#1E71B8', '#000000'], 'Bergamo Arena', 24950, [
        ['Marco Carnesecchi', 'GK', 25, 82, 'ITA'], ['Isak Hien', 'CB', 26, 79, 'SWE'], ['Berat Djimsiti', 'CB', 32, 78, 'ALB'], ['Sead Kolašinac', 'CB', 32, 76, 'BIH'],
        ['Raoul Bellanova', 'RB', 25, 78, 'ITA'], ['Davide Zappacosta', 'RB', 33, 76, 'ITA'], ['Éderson', 'CM', 26, 82, 'BRA'], ['Marten de Roon', 'DM', 34, 79, 'NED'],
        ['Charles De Ketelaere', 'AM', 24, 81, 'BEL'], ['Ademola Lookman', 'LW', 27, 83, 'NGA'], ['Kamaldeen Sulemana', 'LW', 23, 74, 'GHA'], ['Gianluca Scamacca', 'ST', 26, 79, 'ITA'], ['Nikola Krstović', 'ST', 25, 77, 'MNE']]),
      c('bologna', 'Bologna Rossoblù', 'BOL', 72, ['#A21C26', '#1A2F48'], 'Dall\'Ara Park', 38279, [
        ['Łukasz Skorupski', 'GK', 34, 79, 'POL'], ['Jhon Lucumí', 'CB', 27, 79, 'COL'], ['Sam Beukema', 'CB', 26, 79, 'NED'], ['Juan Miranda', 'LB', 25, 76, 'ESP'],
        ['Remo Freuler', 'DM', 33, 78, 'SUI'], ['Lewis Ferguson', 'CM', 26, 79, 'SCO'], ['Riccardo Orsolini', 'RW', 28, 80, 'ITA'],
        ['Santiago Castro', 'ST', 20, 76, 'ARG', 84], ['Thijs Dallinga', 'ST', 24, 74, 'NED']]),
      c('cagliari', 'Sardinia Rossoblù', 'CAG', 56, ['#A51E36', '#002350'], 'Unipol Domus Park', 16416, [
        ['Elia Caprile', 'GK', 24, 76, 'ITA'], ['Yerry Mina', 'CB', 30, 74, 'COL'], ['Gianluca Gaetano', 'AM', 25, 74, 'ITA'], ['Andrea Belotti', 'ST', 31, 72, 'ITA'], ['Leonardo Pavoletti', 'ST', 36, 70, 'ITA']]),
      c('como', 'Lake Como Lariani', 'COM', 64, ['#0F3D7C', '#FFFFFF'], 'Sinigaglia Lakeside', 13602, [
        ['Jean Butez', 'GK', 30, 76, 'FRA'], ['Marc-Oliver Kempf', 'CB', 30, 75, 'GER'], ['Álex Valle', 'LB', 21, 75, 'ESP'], ['Maximo Perrone', 'CM', 22, 77, 'ARG'],
        ['Sergi Roberto', 'CM', 33, 74, 'ESP'], ['Nico Paz', 'AM', 20, 80, 'ARG', 88], ['Jesús Rodríguez', 'LW', 19, 74, 'ESP', 85], ['Assane Diao', 'RW', 20, 75, 'SEN'], ['Álvaro Morata', 'ST', 32, 77, 'ESP']]),
      c('cremonese', 'Cremona Grigiorossi', 'CRE', 50, ['#C8102E', '#8C8C8C'], 'Zini Park', 16003, [
        ['Emil Audero', 'GK', 28, 73, 'ITA'], ['Federico Baschirotto', 'CB', 28, 72, 'ITA'], ['Jamie Vardy', 'ST', 38, 74, 'ENG'], ['Federico Bonazzoli', 'ST', 28, 72, 'ITA']]),
      c('fiorentina', 'Florence Viola', 'FIO', 74, ['#482E92', '#FFFFFF'], 'Franchi Park', 43147, [
        ['David de Gea', 'GK', 34, 82, 'ESP'], ['Pietro Comuzzo', 'CB', 20, 76, 'ITA'], ['Luca Ranieri', 'CB', 26, 76, 'ITA'], ['Dodô', 'RB', 26, 78, 'BRA'],
        ['Robin Gosens', 'LB', 31, 77, 'GER'], ['Rolando Mandragora', 'CM', 28, 76, 'ITA'], ['Nicolò Fagioli', 'CM', 24, 76, 'ITA'], ['Albert Guðmundsson', 'AM', 28, 78, 'ISL'],
        ['Moise Kean', 'ST', 25, 81, 'ITA'], ['Edin Džeko', 'ST', 39, 75, 'BIH']]),
      c('genoa', 'Genoa Grifone', 'GEN', 58, ['#A8132F', '#002350'], 'Ferraris Park', 36599, [
        ['Nicola Leali', 'GK', 32, 73, 'ITA'], ['Johan Vásquez', 'CB', 26, 77, 'MEX'], ['Morten Frendrup', 'CM', 24, 77, 'DEN'], ['Ruslan Malinovskyi', 'AM', 32, 75, 'UKR'],
        ['Junior Messias', 'RW', 34, 72, 'BRA'], ['Vitinha', 'ST', 25, 73, 'POR']]),
      c('verona', 'Verona Gialloblù', 'VER', 54, ['#FFD200', '#002D72'], 'Bentegodi Park', 39211, [
        ['Lorenzo Montipò', 'GK', 29, 74, 'ITA'], ['Diego Coppola', 'CB', 21, 73, 'ITA'], ['Suat Serdar', 'CM', 28, 72, 'GER'], ['Giovane', 'ST', 21, 72, 'BRA']]),
      c('inter', 'Milan Nerazzurri', 'INT', 91, ['#0068A8', '#000000'], 'San Siro Park', 75817, [
        ['Yann Sommer', 'GK', 36, 85, 'SUI'], ['Josep Martínez', 'GK', 27, 77, 'ESP'], ['Alessandro Bastoni', 'CB', 26, 87, 'ITA'], ['Francesco Acerbi', 'CB', 37, 80, 'ITA'],
        ['Stefan de Vrij', 'CB', 33, 80, 'NED'], ['Benjamin Pavard', 'CB', 29, 81, 'FRA'], ['Yann Bisseck', 'CB', 24, 79, 'GER'], ['Denzel Dumfries', 'RB', 29, 83, 'NED'],
        ['Federico Dimarco', 'LB', 27, 85, 'ITA'], ['Carlos Augusto', 'LB', 26, 78, 'BRA'], ['Hakan Çalhanoğlu', 'DM', 31, 85, 'TUR'], ['Nicolò Barella', 'CM', 28, 87, 'ITA'],
        ['Henrikh Mkhitaryan', 'CM', 36, 80, 'ARM'], ['Davide Frattesi', 'CM', 25, 80, 'ITA'], ['Petar Sučić', 'CM', 22, 76, 'CRO'], ['Piotr Zieliński', 'CM', 31, 80, 'POL'],
        ['Lautaro Martínez', 'ST', 28, 88, 'ARG'], ['Marcus Thuram', 'ST', 28, 85, 'FRA'], ['Ange-Yoan Bonny', 'ST', 21, 75, 'FRA'], ['Pio Esposito', 'ST', 20, 72, 'ITA', 84]]),
      c('juventus', 'Turin Bianconeri', 'JUV', 88, ['#FFFFFF', '#000000'], 'Turin Arena', 41507, [
        ['Michele Di Gregorio', 'GK', 28, 82, 'ITA'], ['Mattia Perin', 'GK', 32, 77, 'ITA'], ['Gleison Bremer', 'CB', 28, 85, 'BRA'], ['Federico Gatti', 'CB', 27, 79, 'ITA'],
        ['Pierre Kalulu', 'CB', 25, 79, 'FRA'], ['Lloyd Kelly', 'CB', 26, 76, 'ENG'], ['Andrea Cambiaso', 'LB', 25, 82, 'ITA'], ['Juan Cabal', 'LB', 24, 75, 'COL'],
        ['Manuel Locatelli', 'DM', 27, 81, 'ITA'], ['Khéphren Thuram', 'CM', 24, 80, 'FRA'], ['Teun Koopmeiners', 'CM', 27, 81, 'NED'], ['Weston McKennie', 'CM', 27, 78, 'USA'],
        ['Kenan Yıldız', 'LW', 20, 82, 'TUR', 89], ['Francisco Conceição', 'RW', 22, 80, 'POR'], ['Nico González', 'RW', 27, 78, 'ARG'], ['Dušan Vlahović', 'ST', 25, 81, 'SRB'],
        ['Jonathan David', 'ST', 25, 83, 'CAN'], ['Loïs Openda', 'ST', 25, 80, 'BEL']]),
      c('lazio', 'Rome Biancocelesti', 'LAZ', 76, ['#87D8F7', '#FFFFFF'], 'Olympic Park', 70634, [
        ['Ivan Provedel', 'GK', 31, 80, 'ITA'], ['Alessio Romagnoli', 'CB', 30, 79, 'ITA'], ['Mario Gila', 'CB', 24, 79, 'ESP'], ['Adam Marušić', 'RB', 33, 76, 'MNE'],
        ['Nuno Tavares', 'LB', 25, 77, 'POR'], ['Nicolò Rovella', 'DM', 23, 79, 'ITA'], ['Matteo Guendouzi', 'CM', 26, 79, 'FRA'], ['Mattia Zaccagni', 'LW', 30, 80, 'ITA'],
        ['Gustav Isaksen', 'RW', 24, 77, 'DEN'], ['Mattéo Cancellieri', 'RW', 23, 75, 'ITA'], ['Taty Castellanos', 'ST', 26, 78, 'ARG'], ['Boulaye Dia', 'ST', 28, 76, 'SEN']]),
      c('lecce', 'Salento Giallorossi', 'LEC', 50, ['#FFD200', '#D2001F'], 'Via del Mare Park', 31533, [
        ['Wladimiro Falcone', 'GK', 30, 78, 'ITA'], ['Kialonda Gaspar', 'CB', 28, 73, 'ANG'], ['Antonino Gallo', 'LB', 25, 73, 'ITA'], ['Lameck Banda', 'LW', 24, 72, 'ZAM']]),
      c('milan', 'Milan Rossoneri', 'MIL', 86, ['#FB090B', '#000000'], 'San Siro Park', 75817, [
        ['Mike Maignan', 'GK', 30, 86, 'FRA'], ['Fikayo Tomori', 'CB', 27, 79, 'ENG'], ['Strahinja Pavlović', 'CB', 24, 77, 'SRB'], ['Matteo Gabbia', 'CB', 25, 77, 'ITA'],
        ['Koni De Winter', 'CB', 23, 76, 'BEL'], ['Pervis Estupiñán', 'LB', 27, 78, 'ECU'], ['Alexis Saelemaekers', 'RB', 26, 78, 'BEL'], ['Luka Modrić', 'CM', 39, 82, 'CRO'],
        ['Youssouf Fofana', 'DM', 26, 79, 'FRA'], ['Ruben Loftus-Cheek', 'CM', 29, 77, 'ENG'], ['Samuele Ricci', 'DM', 24, 79, 'ITA'], ['Ardon Jashari', 'CM', 22, 77, 'SUI'],
        ['Christian Pulisic', 'RW', 26, 84, 'USA'], ['Rafael Leão', 'LW', 26, 84, 'POR'], ['Santiago Giménez', 'ST', 24, 79, 'MEX'], ['Christopher Nkunku', 'ST', 27, 80, 'FRA']]),
      c('napoli', 'Naples Azzurri', 'NAP', 88, ['#12A0D7', '#FFFFFF'], 'Maradona Park', 54726, [
        ['Alex Meret', 'GK', 28, 80, 'ITA'], ['Vanja Milinković-Savić', 'GK', 28, 79, 'SRB'], ['Alessandro Buongiorno', 'CB', 26, 81, 'ITA'], ['Amir Rrahmani', 'CB', 31, 80, 'KOS'],
        ['Sam Beukema', 'CB', 26, 79, 'NED'], ['Giovanni Di Lorenzo', 'RB', 32, 82, 'ITA'], ['Leonardo Spinazzola', 'LB', 32, 76, 'ITA'], ['Mathías Olivera', 'LB', 27, 78, 'URU'],
        ['Stanislav Lobotka', 'DM', 30, 83, 'SVK'], ['Frank Anguissa', 'CM', 29, 82, 'CMR'], ['Scott McTominay', 'CM', 28, 85, 'SCO'], ['Kevin De Bruyne', 'AM', 34, 85, 'BEL'],
        ['Matteo Politano', 'RW', 32, 79, 'ITA'], ['David Neres', 'RW', 28, 78, 'BRA'], ['Noa Lang', 'LW', 26, 79, 'NED'], ['Romelu Lukaku', 'ST', 32, 81, 'BEL'], ['Rasmus Højlund', 'ST', 22, 78, 'DEN']]),
      c('parma', 'Parma Crociati', 'PAR', 54, ['#FFFFFF', '#FFD200'], 'Tardini Park', 22352, [
        ['Zion Suzuki', 'GK', 23, 77, 'JPN'], ['Alessandro Circati', 'CB', 21, 73, 'AUS'], ['Adrián Bernabé', 'CM', 24, 75, 'ESP'], ['Mandela Keita', 'DM', 23, 74, 'BEL'], ['Mateo Pellegrino', 'ST', 24, 73, 'ARG']]),
      c('pisa', 'Pisa Nerazzurri', 'PIS', 48, ['#00205B', '#000000'], 'Arena Garibaldi Park', 14000, [
        ['Adrian Šemper', 'GK', 27, 70, 'CRO'], ['Juan Cuadrado', 'RW', 37, 71, 'COL'], ['M\'Bala Nzola', 'ST', 29, 72, 'ANG']]),
      c('roma', 'Rome Giallorossi', 'ROM', 82, ['#8E1F2F', '#F0BC42'], 'Olympic Park', 70634, [
        ['Mile Svilar', 'GK', 25, 84, 'SRB'], ['Gianluca Mancini', 'CB', 29, 80, 'ITA'], ['Evan Ndicka', 'CB', 26, 80, 'CIV'], ['Mario Hermoso', 'CB', 30, 77, 'ESP'],
        ['Zeki Çelik', 'RB', 28, 76, 'TUR'], ['Angeliño', 'LB', 28, 78, 'ESP'], ['Wesley', 'RB', 21, 76, 'BRA'], ['Bryan Cristante', 'CM', 30, 78, 'ITA'],
        ['Manu Koné', 'CM', 24, 81, 'FRA'], ['Lorenzo Pellegrini', 'AM', 29, 78, 'ITA'], ['Paulo Dybala', 'AM', 31, 81, 'ARG'], ['Matías Soulé', 'RW', 22, 79, 'ARG'],
        ['Stephan El Shaarawy', 'LW', 32, 75, 'ITA'], ['Artem Dovbyk', 'ST', 28, 80, 'UKR'], ['Evan Ferguson', 'ST', 20, 74, 'IRL']]),
      c('sassuolo', 'Sassuolo Neroverdi', 'SAS', 54, ['#00A752', '#000000'], 'Mapei Park', 21525, [
        ['Arijanet Muric', 'GK', 26, 74, 'KOS'], ['Tarik Muharemović', 'CB', 22, 73, 'BIH'], ['Kristian Thorstvedt', 'CM', 26, 73, 'NOR'], ['Domenico Berardi', 'RW', 31, 78, 'ITA'], ['Andrea Pinamonti', 'ST', 26, 74, 'ITA']]),
      c('torino', 'Turin Granata', 'TOR', 62, ['#8A1E03', '#FFFFFF'], 'Grande Torino Park', 28177, [
        ['Alberto Paleari', 'GK', 33, 72, 'ITA'], ['Saúl Coco', 'CB', 26, 75, 'EQG'], ['Guillermo Maripán', 'CB', 31, 75, 'CHI'], ['Marcus Pedersen', 'RB', 25, 73, 'NOR'],
        ['Kristjan Asllani', 'CM', 23, 74, 'ALB'], ['Nikola Vlašić', 'AM', 27, 77, 'CRO'], ['Ché Adams', 'ST', 29, 75, 'SCO'], ['Giovanni Simeone', 'ST', 30, 74, 'ARG'], ['Duván Zapata', 'ST', 34, 74, 'COL']]),
      c('udinese', 'Udine Bianconeri', 'UDI', 58, ['#FFFFFF', '#000000'], 'Friuli Park', 25144, [
        ['Maduka Okoye', 'GK', 25, 76, 'NGA'], ['Thomas Kristensen', 'CB', 23, 75, 'DEN'], ['Jordan Zemura', 'LB', 25, 74, 'ZIM'], ['Jesper Karlström', 'DM', 30, 74, 'SWE'],
        ['Jakub Piotrowski', 'CM', 28, 74, 'POL'], ['Keinan Davis', 'ST', 27, 74, 'ENG'], ['Nicolò Zaniolo', 'AM', 26, 74, 'ITA']]),
    ] },
  ],
};
