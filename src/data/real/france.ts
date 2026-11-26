import { c, type RCountry } from './types';
import { FRA2 } from './second';

export const FRANCE: RCountry = {
  id: 'fra', name: 'France', superCup: 'Trophée des Champions',
  cups: [{ id: 'fra-cup', name: 'Coupe de France', tiers: [1, 2], main: true }],
  leagues: [
    { id: 'fra1', name: 'Ligue 1', short: 'Ligue 1', tier: 1, promote: 0, relegate: 3, tv: 550_000, clubs: [
      c('angers', 'Angers Scoïstes', 'ANG', 48, ['#000000', '#FFFFFF'], 'Raymond Kopa Park', 18752, [
        ['Yahia Fofana', 'GK', 24, 74, 'CIV'], ['Jordan Lefort', 'CB', 31, 70, 'FRA'], ['Haris Belkebla', 'DM', 31, 70, 'ALG'], ['Esteban Lepaul', 'ST', 25, 71, 'FRA']]),
      c('auxerre', 'Burgundy Auxerrois', 'AUX', 50, ['#FFFFFF', '#0055A4'], 'Abbé-Deschamps Park', 18541, [
        ['Donovan Léon', 'GK', 33, 73, 'GUF'], ['Gabriel Osho', 'CB', 26, 72, 'NGA'], ['Elisha Owusu', 'DM', 28, 73, 'GHA'], ['Lassine Sinayoko', 'ST', 25, 74, 'MLI']]),
      c('brest', 'Brittany Pirates', 'BRE', 60, ['#E30613', '#FFFFFF'], 'Francis-Le Blé Park', 15931, [
        ['Marco Bizot', 'GK', 34, 76, 'NED'], ['Brendan Chardonnet', 'CB', 30, 74, 'FRA'], ['Kenny Lala', 'RB', 34, 73, 'FRA'], ['Hugo Magnetti', 'CM', 27, 74, 'FRA'],
        ['Romain Del Castillo', 'RW', 29, 76, 'FRA'], ['Ludovic Ajorque', 'ST', 31, 74, 'FRA']]),
      c('lehavre', 'Normandy Ciel et Marine', 'HAC', 46, ['#6CABDD', '#1D3557'], 'Océane Park', 25178, [
        ['Arthur Desmas', 'GK', 31, 71, 'FRA'], ['Gautier Lloris', 'CB', 30, 71, 'FRA'], ['Abdoulaye Touré', 'DM', 31, 72, 'GUI'], ['Issa Soumaré', 'ST', 25, 70, 'SEN']]),
      c('lens', 'Artois Sang et Or', 'RCL', 68, ['#FFD100', '#E30613'], 'Bollaert Park', 38223, [
        ['Robin Risser', 'GK', 20, 74, 'FRA'], ['Jonathan Gradit', 'CB', 32, 75, 'FRA'], ['Malang Sarr', 'CB', 26, 74, 'FRA'], ['Ruben Aguilar', 'RB', 32, 74, 'FRA'],
        ['Adrien Thomasson', 'CM', 31, 76, 'FRA'], ['Florian Thauvin', 'RW', 32, 77, 'FRA'], ['Wesley Saïd', 'LW', 30, 74, 'FRA'], ['Odsonne Édouard', 'ST', 27, 75, 'FRA']]),
      c('lille', 'Lille Dogues', 'LIL', 76, ['#E01E13', '#20325F'], 'Pierre-Mauroy Park', 50186, [
        ['Berke Özer', 'GK', 25, 77, 'TUR'], ['Nathan Ngoy', 'CB', 22, 75, 'BEL'], ['Aïssa Mandi', 'CB', 33, 75, 'ALG'], ['Thomas Meunier', 'RB', 33, 76, 'BEL'],
        ['Romain Perraud', 'LB', 28, 76, 'FRA'], ['Benjamin André', 'DM', 35, 78, 'FRA'], ['Ayyoub Bouaddi', 'CM', 17, 75, 'FRA', 88], ['Hákon Arnar Haraldsson', 'AM', 22, 78, 'ISL'],
        ['Osame Sahraoui', 'LW', 24, 75, 'NOR'], ['Hamza Igamane', 'ST', 22, 75, 'MAR'], ['Olivier Giroud', 'ST', 38, 74, 'FRA']]),
      c('lorient', 'Brittany Merlus', 'FCL', 46, ['#F58220', '#000000'], 'Moustoir Park', 18110, [
        ['Yvon Mvogo', 'GK', 31, 74, 'SUI'], ['Laurent Abergel', 'DM', 32, 72, 'FRA'], ['Pablo Pagis', 'RW', 22, 71, 'FRA'], ['Tosin Aiyegun', 'ST', 27, 71, 'BEN']]),
      c('lyon', 'Lyon Gones', 'OL', 76, ['#FFFFFF', '#1E3C8C'], 'Groupama Park', 59186, [
        ['Lucas Perri', 'GK', 27, 79, 'BRA'], ['Moussa Niakhaté', 'CB', 29, 78, 'SEN'], ['Clinton Mata', 'CB', 32, 75, 'ANG'], ['Nicolás Tagliafico', 'LB', 32, 78, 'ARG'],
        ['Ainsley Maitland-Niles', 'RB', 27, 74, 'ENG'], ['Corentin Tolisso', 'CM', 31, 78, 'FRA'], ['Tanner Tessmann', 'DM', 23, 75, 'USA'], ['Pavel Šulc', 'AM', 24, 76, 'CZE'],
        ['Ernest Nuamah', 'RW', 21, 74, 'GHA'], ['Malick Fofana', 'LW', 20, 79, 'BEL', 87], ['Afonso Moreira', 'LW', 20, 72, 'POR']]),
      c('marseille', 'Marseille Phocéens', 'OM', 82, ['#FFFFFF', '#2FAEE0'], 'Vélodrome Park', 67394, [
        ['Gerónimo Rulli', 'GK', 33, 81, 'ARG'], ['Leonardo Balerdi', 'CB', 26, 80, 'ARG'], ['Nayef Aguerd', 'CB', 29, 78, 'MAR'], ['Benjamin Pavard', 'CB', 29, 0, 'FRA'],
        ['CJ Egan-Riley', 'CB', 22, 74, 'ENG'], ['Facundo Medina', 'LB', 26, 78, 'ARG'], ['Pierre-Emile Højbjerg', 'DM', 30, 81, 'DEN'], ['Geoffrey Kondogbia', 'DM', 32, 76, 'CTA'],
        ['Angel Gomes', 'CM', 24, 77, 'ENG'], ['Matt O\'Riley', 'AM', 24, 78, 'DEN'], ['Mason Greenwood', 'RW', 23, 83, 'JAM'], ['Amine Gouiri', 'ST', 25, 80, 'ALG'],
        ['Igor Paixão', 'LW', 25, 78, 'BRA'], ['Pierre-Emerick Aubameyang', 'ST', 36, 79, 'GAB']]),
      c('metz', 'Lorraine Grenats', 'MET', 44, ['#7A1631', '#FFFFFF'], 'Saint-Symphorien Park', 25636, [
        ['Jonathan Fischer', 'GK', 32, 70, 'DEN'], ['Koffi Kouao', 'RB', 27, 70, 'CIV'], ['Gauthier Hein', 'AM', 29, 72, 'FRA'], ['Habib Diallo', 'ST', 30, 72, 'SEN']]),
      c('monaco', 'Monte Carlo Monégasques', 'ASM', 80, ['#E7212C', '#FFFFFF'], 'Louis II Park', 18523, [
        ['Philipp Köhn', 'GK', 27, 78, 'SUI'], ['Thilo Kehrer', 'CB', 28, 77, 'GER'], ['Mohammed Salisu', 'CB', 26, 78, 'GHA'], ['Eric Dier', 'CB', 31, 77, 'ENG'],
        ['Vanderson', 'RB', 24, 79, 'BRA'], ['Caio Henrique', 'LB', 28, 78, 'BRA'], ['Denis Zakaria', 'DM', 28, 81, 'SUI'], ['Lamine Camara', 'CM', 21, 78, 'SEN', 85],
        ['Aleksandr Golovin', 'AM', 29, 79, 'RUS'], ['Paul Pogba', 'CM', 32, 75, 'FRA'], ['Maghnes Akliouche', 'RW', 23, 80, 'FRA', 86], ['Takumi Minamino', 'AM', 30, 77, 'JPN'],
        ['Ansu Fati', 'LW', 22, 74, 'ESP'], ['Folarin Balogun', 'ST', 24, 78, 'USA']]),
      c('nantes', 'Nantes Canaries', 'FCN', 52, ['#FCD405', '#1B8B3E'], 'Beaujoire Park', 35322, [
        ['Anthony Lopes', 'GK', 34, 76, 'POR'], ['Nicolas Pallois', 'CB', 37, 71, 'FRA'], ['Francis Coquelin', 'DM', 34, 72, 'FRA'], ['Matthis Abline', 'ST', 22, 74, 'FRA']]),
      c('nice', 'Riviera Aiglons', 'OGC', 70, ['#C8102E', '#000000'], 'Riviera Park', 36178, [
        ['Yehvann Diouf', 'GK', 26, 75, 'SEN'], ['Dante', 'CB', 41, 72, 'BRA'], ['Jonathan Clauss', 'RB', 32, 77, 'FRA'], ['Melvin Bard', 'LB', 24, 74, 'FRA'],
        ['Hicham Boudaoui', 'CM', 25, 76, 'ALG'], ['Morgan Sanson', 'CM', 31, 74, 'FRA'], ['Sofiane Diop', 'AM', 25, 77, 'MAR'], ['Jérémie Boga', 'LW', 28, 75, 'CIV'], ['Terem Moffi', 'ST', 26, 75, 'NGA']]),
      c('parisfc', 'Paris Club', 'PFC', 50, ['#002F6C', '#FFFFFF'], 'Jean-Bouin Park', 19904, [
        ['Obed Nkambadio', 'GK', 22, 70, 'FRA'], ['Moustapha Mbow', 'CB', 25, 70, 'SEN'], ['Ilan Kebbal', 'AM', 27, 74, 'ALG'], ['Willem Geubbels', 'ST', 23, 70, 'FRA']]),
      c('psg', 'Paris Saint-Germanois', 'PSG', 95, ['#004170', '#DA291C'], 'Princes Park', 47929, [
        ['Lucas Chevalier', 'GK', 23, 82, 'FRA'], ['Gianluigi Donnarumma', 'GK', 26, 87, 'ITA'], ['Marquinhos', 'CB', 31, 85, 'BRA'], ['Willian Pacho', 'CB', 23, 84, 'ECU'],
        ['Lucas Beraldo', 'CB', 21, 78, 'BRA'], ['Illia Zabarnyi', 'CB', 22, 80, 'UKR'], ['Achraf Hakimi', 'RB', 26, 88, 'MAR'], ['Nuno Mendes', 'LB', 23, 87, 'POR'],
        ['Lucas Hernández', 'LB', 29, 80, 'FRA'], ['Vitinha', 'CM', 25, 88, 'POR'], ['João Neves', 'CM', 20, 86, 'POR', 91], ['Fabián Ruiz', 'CM', 29, 84, 'ESP'],
        ['Warren Zaïre-Emery', 'CM', 19, 80, 'FRA', 88], ['Senny Mayulu', 'CM', 19, 74, 'FRA', 85], ['Désiré Doué', 'RW', 20, 84, 'FRA', 91], ['Khvicha Kvaratskhelia', 'LW', 24, 87, 'GEO'],
        ['Bradley Barcola', 'LW', 23, 83, 'FRA'], ['Ousmane Dembélé', 'ST', 28, 90, 'FRA'], ['Gonçalo Ramos', 'ST', 24, 80, 'POR'], ['Lee Kang-in', 'AM', 24, 79, 'KOR']]),
      c('rennes', 'Rennes Rouge et Noir', 'SRF', 70, ['#E13327', '#000000'], 'Roazhon Park', 29778, [
        ['Brice Samba', 'GK', 31, 79, 'FRA'], ['Jérémy Jacquet', 'CB', 20, 75, 'FRA'], ['Przemysław Frankowski', 'RB', 30, 75, 'POL'], ['Seko Fofana', 'CM', 30, 77, 'CIV'],
        ['Valentin Rongier', 'CM', 30, 76, 'FRA'], ['Ludovic Blas', 'AM', 27, 76, 'FRA'], ['Arnaud Kalimuendo', 'ST', 23, 77, 'FRA'], ['Breel Embolo', 'ST', 28, 76, 'SUI']]),
      c('strasbourg', 'Alsace Racing', 'RCS', 64, ['#009FE3', '#FFFFFF'], 'Meinau Park', 26109, [
        ['Mike Penders', 'GK', 20, 72, 'BEL'], ['Mamadou Sarr', 'CB', 20, 75, 'FRA'], ['Guéla Doué', 'RB', 23, 76, 'CIV'], ['Andrey Santos', 'CM', 21, 78, 'BRA', 85],
        ['Valentín Barco', 'LB', 21, 75, 'ARG'], ['Diego Moreira', 'LW', 21, 75, 'BEL'], ['Sebastian Nanasi', 'RW', 23, 74, 'SWE'], ['Emanuel Emegha', 'ST', 22, 75, 'NED']]),
      c('toulouse', 'Toulouse Violets', 'TFC', 56, ['#5B2C83', '#FFFFFF'], 'Municipal Park', 33150, [
        ['Guillaume Restes', 'GK', 20, 75, 'FRA'], ['Charlie Cresswell', 'CB', 22, 73, 'ENG'], ['Rasmus Nicolaisen', 'CB', 28, 73, 'DEN'], ['Cristian Cásseres', 'CM', 25, 74, 'VEN'],
        ['Aron Dønnum', 'RW', 27, 73, 'NOR'], ['Yann Gboho', 'LW', 24, 73, 'FRA'], ['Frank Magri', 'ST', 26, 72, 'CMR']]),
    ] },
    FRA2,
  ],
};
