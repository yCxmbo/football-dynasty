import { c, type RCountry } from './types';

export const PORTUGAL: RCountry = {
  id: 'por', name: 'Portugal', superCup: 'Supertaça Cândido de Oliveira',
  cups: [{ id: 'por-cup', name: 'Taça de Portugal', tiers: [1], main: true }],
  leagues: [{ id: 'por1', name: 'Liga Portugal', short: 'Liga Portugal', tier: 1, promote: 0, relegate: 0, tv: 260_000, clubs: [
    c('avs', 'Vila das Aves Futebol', 'AVS', 40, ['#D71920', '#FFFFFF'], 'Aves Park', 6230), c('alverca', 'Alverca Ribatejo', 'ALV', 38, ['#D71920', '#FFFFFF'], 'Alverca Park', 7700),
    c('arouca', 'Arouca Lobos', 'ARO', 44, ['#FFD200', '#0055A4'], 'Arouca Municipal', 5600),
    c('benfica', 'Lisbon Eagles', 'SLB', 84, ['#E83030', '#FFFFFF'], 'Stadium of Light', 64642, [
      ['Anatoliy Trubin', 'GK', 24, 82, 'UKR'], ['António Silva', 'CB', 21, 80, 'POR', 86], ['Nicolás Otamendi', 'CB', 37, 79, 'ARG'], ['Tomás Araújo', 'CB', 23, 78, 'POR'],
      ['Samuel Dahl', 'LB', 22, 75, 'SWE'], ['Amar Dedić', 'RB', 22, 78, 'BIH'], ['Florentino Luís', 'DM', 26, 79, 'POR'], ['Fredrik Aursnes', 'CM', 29, 80, 'NOR'],
      ['Richard Ríos', 'CM', 25, 79, 'COL'], ['Enzo Barrenechea', 'DM', 24, 77, 'ARG'], ['Georgiy Sudakov', 'AM', 22, 79, 'UKR'], ['Andreas Schjelderup', 'LW', 21, 76, 'NOR'],
      ['Ángel Di María', 'RW', 37, 79, 'ARG'], ['Vangelis Pavlidis', 'ST', 26, 80, 'GRE'], ['Franjo Ivanović', 'ST', 21, 75, 'CRO']]),
    c('braga', 'Minho Warriors', 'SCB', 70, ['#E30613', '#FFFFFF'], 'Quarry Stadium', 30286, [
      ['Lukáš Horníček', 'GK', 23, 75, 'CZE'], ['Paulo Oliveira', 'CB', 33, 74, 'POR'], ['Ricardo Horta', 'LW', 30, 79, 'POR'], ['João Moutinho', 'CM', 38, 74, 'POR'],
      ['Rodrigo Zalazar', 'AM', 26, 78, 'URU'], ['Amine El Ouazzani', 'ST', 24, 74, 'MAR']]),
    c('casapia', 'Lisbon Gansos', 'CPI', 40, ['#000000', '#FFFFFF'], 'Pina Manique Park', 4000), c('estoril', 'Estoril Canarinhos', 'EST', 46, ['#FFD200', '#0055A4'], 'Coimbra da Mota Park', 5100),
    c('estrela', 'Amadora Tricolores', 'EAM', 38, ['#D71920', '#00843D'], 'Reboleira Park', 9288), c('famalicao', 'Famalicão Famalicenses', 'FAM', 50, ['#002F6C', '#FFFFFF'], 'Famalicão Municipal', 5307),
    c('gilvicente', 'Barcelos Galos', 'GIL', 46, ['#D71920', '#003D7C'], 'Cidade de Barcelos Park', 12046), c('moreirense', 'Moreira Cónegos', 'MOR', 40, ['#00843D', '#FFFFFF'], 'Comendador Park', 6153),
    c('nacional', 'Madeira Alvinegros', 'NAC', 40, ['#000000', '#FFFFFF'], 'Madeira Park', 5132),
    c('porto', 'Porto Dragons', 'FCP', 84, ['#003893', '#FFFFFF'], 'Dragon Stadium', 50033, [
      ['Diogo Costa', 'GK', 25, 84, 'POR'], ['Jan Bednarek', 'CB', 29, 76, 'POL'], ['Nehuén Pérez', 'CB', 25, 77, 'ARG'], ['Jakub Kiwior', 'CB', 25, 77, 'POL'],
      ['Alberto Costa', 'RB', 21, 76, 'POR'], ['Francisco Moura', 'LB', 26, 75, 'POR'], ['Alan Varela', 'DM', 24, 80, 'ARG'], ['Victor Froholdt', 'CM', 19, 75, 'DEN', 86],
      ['Gabri Veiga', 'AM', 23, 78, 'ESP'], ['Rodrigo Mora', 'AM', 18, 78, 'POR', 89], ['Pepê', 'RW', 28, 78, 'BRA'], ['William Gomes', 'LW', 19, 75, 'BRA'],
      ['Samu Aghehowa', 'ST', 21, 80, 'ESP', 87], ['Luuk de Jong', 'ST', 34, 76, 'NED']]),
    c('rioave', 'Vila do Conde Rioavistas', 'RAV', 44, ['#00843D', '#FFFFFF'], 'Rio Ave Park', 9065), c('santaclara', 'Azores Açorianos', 'SCL', 46, ['#D71920', '#FFFFFF'], 'São Miguel Park', 12500),
    c('sporting', 'Lisbon Lions', 'SCP', 86, ['#008057', '#FFFFFF'], 'Alvalade Park', 50095, [
      ['Rui Silva', 'GK', 31, 81, 'POR'], ['Gonçalo Inácio', 'CB', 24, 82, 'POR'], ['Ousmane Diomande', 'CB', 21, 81, 'CIV', 86], ['Zeno Debast', 'CB', 21, 78, 'BEL'],
      ['Ivan Fresneda', 'RB', 20, 75, 'ESP'], ['Maximiliano Araújo', 'LB', 25, 79, 'URU'], ['Morten Hjulmand', 'DM', 26, 83, 'DEN'], ['Hidemasa Morita', 'CM', 30, 79, 'JPN'],
      ['Pedro Gonçalves', 'AM', 27, 81, 'POR'], ['Francisco Trincão', 'RW', 25, 82, 'POR'], ['Geovany Quenda', 'RW', 18, 77, 'POR', 88], ['Geny Catamo', 'RW', 24, 76, 'MOZ'],
      ['Luis Suárez', 'ST', 28, 79, 'COL'], ['Fotis Ioannidis', 'ST', 25, 77, 'GRE']]),
    c('tondela', 'Viseu Auriverdes', 'TON', 36, ['#FFD200', '#00843D'], 'João Cardoso Park', 5000), c('vitoria', 'Guimarães Conquerors', 'VSC', 56, ['#FFFFFF', '#000000'], 'Afonso Henriques Park', 30000, [
      ['Charles', 'GK', 31, 74, 'BRA'], ['Tiago Silva', 'CM', 32, 74, 'POR'], ['Nélson Oliveira', 'ST', 34, 72, 'POR']]),
  ] }],
};

export const NETHERLANDS: RCountry = {
  id: 'ned', name: 'Netherlands', superCup: 'Johan Cruyff Shield',
  cups: [{ id: 'ned-cup', name: 'KNVB Cup', tiers: [1], main: true }],
  leagues: [{ id: 'ned1', name: 'Eredivisie', short: 'Eredivisie', tier: 1, promote: 0, relegate: 0, tv: 230_000, clubs: [
    c('ajax', 'Amsterdam Sons of Gods', 'AJA', 80, ['#D2122E', '#FFFFFF'], 'Amsterdam Arena', 55865, [
      ['Vítězslav Jaroš', 'GK', 24, 76, 'CZE'], ['Josip Šutalo', 'CB', 25, 78, 'CRO'], ['Youri Baas', 'CB', 22, 77, 'NED'], ['Lucas Rosa', 'RB', 24, 74, 'BRA'],
      ['Jorrel Hato', 'LB', 19, 80, 'NED', 0], ['Kenneth Taylor', 'CM', 23, 79, 'NED'], ['Davy Klaassen', 'CM', 32, 75, 'NED'], ['Youri Regeer', 'CM', 22, 74, 'NED'],
      ['Steven Berghuis', 'RW', 33, 76, 'NED'], ['Mika Godts', 'LW', 20, 76, 'BEL', 85], ['Oliver Edvardsen', 'AM', 25, 74, 'NOR'], ['Wout Weghorst', 'ST', 32, 76, 'NED']]),
    c('az', 'Alkmaar Cheeseheads', 'AZ', 68, ['#E30613', '#FFFFFF'], 'Alkmaar Stadium', 19500, [
      ['Rome-Jayden Owusu-Oduro', 'GK', 21, 74, 'NED'], ['Wouter Goes', 'CB', 21, 74, 'NED'], ['Peer Koopmeiners', 'CM', 25, 75, 'NED'], ['Sven Mijnans', 'AM', 25, 76, 'NED'], ['Troy Parrott', 'ST', 23, 76, 'IRL']]),
    c('excelsior', 'Rotterdam Kralingers', 'EXC', 36, ['#E30613', '#000000'], 'Woudestein Park', 4500), c('feyenoord', 'Rotterdam Stadium Club', 'FEY', 80, ['#E30613', '#FFFFFF'], 'De Kuip Park', 51117, [
      ['Timon Wellenreuther', 'GK', 29, 77, 'GER'], ['Dávid Hancko', 'CB', 27, 0, 'SVK'], ['Gernot Trauner', 'CB', 33, 76, 'AUT'], ['Thomas Beelen', 'CB', 23, 75, 'NED'],
      ['Gijs Smal', 'LB', 28, 74, 'NED'], ['Quinten Timber', 'CM', 24, 79, 'NED'], ['In-beom Hwang', 'CM', 28, 78, 'KOR'], ['Sem Steijn', 'AM', 23, 77, 'NED'],
      ['Anis Hadj Moussa', 'RW', 23, 77, 'ALG'], ['Leo Sauer', 'LW', 19, 73, 'SVK'], ['Ayase Ueda', 'ST', 27, 76, 'JPN']]),
    c('fortuna', 'Sittard Fortunezen', 'FOR', 38, ['#FFD200', '#00843D'], 'Fortuna Park', 12500), c('goahead', 'Deventer Eagles', 'GAE', 46, ['#FFD200', '#D71920'], 'Adelaarshorst Park', 10400),
    c('groningen', 'Groningen Pride of the North', 'GRO', 46, ['#00843D', '#FFFFFF'], 'Euroborg Park', 22579), c('heerenveen', 'Frisian Superfriezen', 'HEE', 48, ['#0055A4', '#FFFFFF'], 'Abe Lenstra Park', 27224),
    c('heracles', 'Almelo Heraclieden', 'HER', 40, ['#000000', '#FFFFFF'], 'Erve Asito Park', 12080), c('nac', 'Breda Parel van het Zuiden', 'NAC', 40, ['#FFD200', '#000000'], 'Rat Verlegh Park', 19000),
    c('nec', 'Nijmegen Nijmegenaren', 'NEC', 48, ['#D71920', '#00843D'], 'Goffert Park', 12500), c('zwolle', 'Zwolle Blauwvingers', 'PEC', 40, ['#0055A4', '#FFFFFF'], 'MAC³PARK', 14000),
    c('psv', 'Eindhoven Farmers', 'PSV', 82, ['#ED1C24', '#FFFFFF'], 'Philips Park', 35000, [
      ['Matej Kovář', 'GK', 25, 77, 'CZE'], ['Jerdy Schouten', 'DM', 28, 79, 'NED'], ['Armando Obispo', 'CB', 26, 76, 'NED'], ['Ryan Flamingo', 'CB', 22, 76, 'NED'],
      ['Mauro Júnior', 'LB', 26, 76, 'BRA'], ['Sergiño Dest', 'RB', 24, 77, 'USA'], ['Joey Veerman', 'CM', 26, 80, 'NED'], ['Guus Til', 'AM', 27, 78, 'NED'],
      ['Ivan Perišić', 'LW', 36, 77, 'CRO'], ['Ismael Saibari', 'AM', 24, 79, 'MAR'], ['Couhaib Driouech', 'LW', 23, 74, 'NED'], ['Ricardo Pepi', 'ST', 22, 76, 'USA']]),
    c('sparta', 'Rotterdam Castle Club', 'SPR', 40, ['#E30613', '#FFFFFF'], 'Het Kasteel Park', 11026), c('telstar', 'Velsen Witte Leeuwen', 'TEL', 32, ['#FFFFFF', '#0055A4'], 'Velsen Park', 5000),
    c('twente', 'Enschede Tukkers', 'TWE', 62, ['#E30613', '#FFFFFF'], 'Grolsch Park', 30205, [
      ['Lars Unnerstall', 'GK', 35, 74, 'GER'], ['Michel Vlap', 'AM', 27, 75, 'NED'], ['Sem Steijn', 'AM', 23, 0, 'NED'], ['Ricky van Wolfswinkel', 'ST', 36, 72, 'NED']]),
    c('utrecht', 'Utrecht Domstedelingen', 'UTR', 58, ['#E30613', '#FFFFFF'], 'Galgenwaard Park', 23750, [
      ['Vasilios Barkas', 'GK', 31, 74, 'GRE'], ['Mike van der Hoorn', 'CB', 32, 73, 'NED'], ['Yoann Cathline', 'LW', 23, 74, 'FRA'], ['Noah Ohio', 'ST', 22, 72, 'NED']]),
    c('volendam', 'Volendam Fishermen', 'VOL', 32, ['#F58220', '#FFFFFF'], 'Kras Park', 7384),
  ] }],
};

export const BELGIUM: RCountry = {
  id: 'bel', name: 'Belgium', superCup: false,
  cups: [{ id: 'bel-cup', name: 'Belgian Cup', tiers: [1], main: true }],
  leagues: [{ id: 'bel1', name: 'Belgian Pro League', short: 'Pro League', tier: 1, promote: 0, relegate: 0, tv: 200_000, clubs: [
    c('anderlecht', 'Brussels Purple & White', 'AND', 66, ['#4C2683', '#FFFFFF'], 'Lotto Park', 21500, [
      ['Colin Coosemans', 'GK', 32, 74, 'BEL'], ['Jan-Carlo Simić', 'CB', 20, 73, 'SRB'], ['Yari Verschaeren', 'AM', 24, 75, 'BEL'], ['Kasper Dolberg', 'ST', 27, 76, 'DEN']]),
    c('antwerp', 'Antwerp Great Old', 'ANT', 58, ['#E30613', '#FFFFFF'], 'Bosuil Park', 16144, [['Senne Lammens', 'GK', 23, 76, 'BEL'], ['Toby Alderweireld', 'CB', 36, 72, 'BEL']]),
    c('cercle', 'Bruges Green & Black', 'CER', 44, ['#00843D', '#000000'], 'Jan Breydel Park', 29042), c('charleroi', 'Charleroi Zebras', 'CHA', 50, ['#000000', '#FFFFFF'], 'Pays de Charleroi Park', 15000),
    c('brugge', 'Bruges Blue & Black', 'CLU', 74, ['#0055A4', '#000000'], 'Jan Breydel Park', 29042, [
      ['Simon Mignolet', 'GK', 37, 77, 'BEL'], ['Brandon Mechele', 'CB', 32, 75, 'BEL'], ['Joel Ordóñez', 'CB', 21, 76, 'ECU'], ['Joaquin Seys', 'LB', 20, 72, 'BEL'],
      ['Raphael Onyedika', 'DM', 24, 77, 'NGA'], ['Hans Vanaken', 'CM', 32, 77, 'BEL'], ['Christos Tzolis', 'LW', 23, 78, 'GRE'], ['Hugo Vetlesen', 'CM', 25, 74, 'NOR'], ['Nicolò Tresoldi', 'ST', 21, 73, 'GER']]),
    c('dender', 'Denderleeuw Dender', 'DEN', 34, ['#000000', '#FFFFFF'], 'Van Roy Park', 6429), c('genk', 'Limburg Smurfs', 'GNK', 64, ['#0055A4', '#FFFFFF'], 'Cegeka Arena', 23718, [
      ['Hendrik Van Crombrugge', 'GK', 32, 74, 'BEL'], ['Patrik Hrošovský', 'CM', 33, 74, 'SVK'], ['Jarne Steuckers', 'AM', 23, 74, 'BEL'], ['Tolu Arokodare', 'ST', 24, 75, 'NGA']]),
    c('gent', 'Ghent Buffalos', 'GNT', 60, ['#0055A4', '#FFFFFF'], 'Ghelamco Park', 20000), c('louviere', 'La Louvière Wolves', 'RAL', 34, ['#008B45', '#FFFFFF'], 'Tivoli Park', 8000),
    c('mechelen', 'Mechelen Malinwa', 'KVM', 50, ['#FFD200', '#D71920'], 'AFAS Park', 16700), c('ohl', 'Leuven Lions', 'OHL', 44, ['#E30613', '#FFFFFF'], 'Den Dreef Park', 10000),
    c('stvv', 'Sint-Truiden Canaries', 'STV', 44, ['#FFD200', '#0055A4'], 'Stayen Park', 14600), c('standard', 'Liège Rouches', 'STA', 58, ['#E30613', '#FFFFFF'], 'Sclessin Park', 27670),
    c('usg', 'Brussels Unionists', 'USG', 70, ['#FFD200', '#0055A4'], 'Joseph Marien Park', 9400, [
      ['Kjell Scherpen', 'GK', 25, 74, 'NED'], ['Christian Burgess', 'CB', 30, 74, 'ENG'], ['Kevin Mac Allister', 'CB', 28, 74, 'ARG'], ['Anouar Ait El Hadj', 'AM', 23, 74, 'BEL'], ['Promise David', 'ST', 24, 74, 'CAN']]),
    c('westerlo', 'Westerlo Kemphanen', 'WES', 40, ['#FFD200', '#0055A4'], 'Kuipje Park', 8035), c('zulte', 'Waregem Essevee', 'ZWA', 40, ['#D71920', '#00843D'], 'Elindus Park', 12400),
  ] }],
};

export const TURKEY: RCountry = {
  id: 'tur', name: 'Turkey', superCup: 'Turkish Super Cup',
  cups: [{ id: 'tur-cup', name: 'Turkish Cup', tiers: [1], main: true }],
  leagues: [{ id: 'tur1', name: 'Süper Lig', short: 'Süper Lig', tier: 1, promote: 0, relegate: 0, tv: 260_000, clubs: [
    c('alanya', 'Alanya Riviera', 'ALA', 44, ['#F58220', '#00843D'], 'Alanya Oba Park', 10130), c('antalya', 'Antalya Scorpions', 'ANT', 42, ['#E30613', '#FFFFFF'], 'Corendon Park', 32537),
    c('basaksehir', 'Istanbul Owls', 'IBF', 56, ['#F58220', '#002F6C'], 'Fatih Terim Park', 17319, [['Krzysztof Piątek', 'ST', 30, 75, 'POL'], ['Muhammed Şengezer', 'GK', 28, 72, 'TUR']]),
    c('besiktas', 'Istanbul Black Eagles', 'BJK', 74, ['#000000', '#FFFFFF'], 'Bosphorus Park', 42590, [
      ['Mert Günok', 'GK', 36, 76, 'TUR'], ['Felix Uduokhai', 'CB', 27, 75, 'GER'], ['Gabriel Paulista', 'CB', 34, 74, 'BRA'], ['Wilfred Ndidi', 'DM', 28, 78, 'NGA'],
      ['Orkun Kökçü', 'CM', 24, 79, 'TUR'], ['Rafa Silva', 'AM', 32, 79, 'POR'], ['Milot Rashica', 'LW', 29, 74, 'KOS'], ['Ciro Immobile', 'ST', 35, 76, 'ITA'], ['Tammy Abraham', 'ST', 27, 76, 'ENG']]),
    c('eyup', 'Istanbul Sultans', 'EYP', 42, ['#7A1F8B', '#FFD200'], 'Eyüp Park', 2500), c('karagumruk', 'Istanbul Fatih Red-Blacks', 'FKG', 40, ['#E30613', '#000000'], 'Atatürk Olympic Park', 76092),
    c('fenerbahce', 'Istanbul Canaries', 'FB', 80, ['#FFED00', '#163962'], 'Kadıköy Park', 47834, [
      ['Ederson', 'GK', 31, 83, 'BRA'], ['Dominik Livaković', 'GK', 30, 79, 'CRO'], ['Milan Škriniar', 'CB', 30, 80, 'SVK'], ['Çağlar Söyüncü', 'CB', 29, 75, 'TUR'],
      ['Nélson Semedo', 'RB', 31, 77, 'POR'], ['Archie Brown', 'LB', 23, 74, 'ENG'], ['Edson Álvarez', 'DM', 27, 79, 'MEX'], ['Fred', 'CM', 32, 78, 'BRA'],
      ['İsmail Yüksek', 'CM', 26, 75, 'TUR'], ['Marco Asensio', 'AM', 29, 80, 'ESP'], ['Kerem Aktürkoğlu', 'LW', 26, 79, 'TUR'], ['Dušan Tadić', 'AM', 36, 76, 'SRB'],
      ['Youssef En-Nesyri', 'ST', 28, 79, 'MAR'], ['Jhon Durán', 'ST', 21, 77, 'COL']]),
    c('galatasaray', 'Istanbul Lions', 'GS', 82, ['#A90432', '#FDB912'], 'Rams Park', 52223, [
      ['Uğurcan Çakır', 'GK', 29, 80, 'TUR'], ['Fernando Muslera', 'GK', 39, 75, 'URU'], ['Davinson Sánchez', 'CB', 29, 79, 'COL'], ['Abdülkerim Bardakcı', 'CB', 30, 77, 'TUR'],
      ['Wilfried Singo', 'CB', 24, 78, 'CIV'], ['Roland Sallai', 'RB', 28, 76, 'HUN'], ['Lucas Torreira', 'DM', 29, 80, 'URU'], ['İlkay Gündoğan', 'CM', 34, 81, 'GER'],
      ['Gabriel Sara', 'CM', 26, 78, 'BRA'], ['Yunus Akgün', 'RW', 24, 76, 'TUR'], ['Barış Alper Yılmaz', 'LW', 25, 79, 'TUR'], ['Leroy Sané', 'RW', 29, 81, 'GER'],
      ['Victor Osimhen', 'ST', 26, 86, 'NGA'], ['Mauro Icardi', 'ST', 32, 77, 'ARG']]),
    c('gaziantep', 'Gaziantep Falcons', 'GFK', 40, ['#E30613', '#000000'], 'Gaziantep Park', 33502), c('genclerbirligi', 'Ankara Poppies', 'GNC', 38, ['#E30613', '#000000'], 'Eryaman Park', 20560),
    c('goztepe', 'Izmir Goztepe Reds', 'GOZ', 44, ['#FFD200', '#E30613'], 'Gürsel Aksel Park', 19713), c('kasimpasa', 'Istanbul Apaches', 'KAS', 42, ['#0055A4', '#FFFFFF'], 'Recep Tayyip Park', 13856),
    c('kayseri', 'Kayseri Yellow-Reds', 'KAY', 38, ['#FFD200', '#E30613'], 'Kayseri Park', 32864), c('kocaeli', 'Izmit Green-Blacks', 'KOC', 36, ['#00843D', '#000000'], 'Kocaeli Park', 34712),
    c('konya', 'Konya Anatolian Eagles', 'KON', 42, ['#00843D', '#FFFFFF'], 'Konya Park', 42000), c('rizespor', 'Rize Tea Growers', 'RIZ', 40, ['#00843D', '#0055A4'], 'Rize City Park', 15332),
    c('samsun', 'Samsun Red Lightning', 'SAM', 48, ['#E30613', '#FFFFFF'], 'Samsun 19 Mayıs Park', 33919), c('trabzon', 'Trabzon Black Sea Storm', 'TS', 62, ['#7A1F3D', '#6CABDD'], 'Papara Park', 40782, [
      ['André Onana', 'GK', 29, 0, 'CMR'], ['Stefan Savić', 'CB', 34, 74, 'MNE'], ['Edin Višća', 'RW', 35, 73, 'BIH'], ['Paul Onuachu', 'ST', 31, 76, 'NGA']]),
  ] }],
};

export const SCOTLAND: RCountry = {
  id: 'sco', name: 'Scotland', superCup: false,
  cups: [{ id: 'sco-cup', name: 'Scottish Cup', tiers: [1], main: true }, { id: 'sco-lc', name: 'Scottish League Cup', tiers: [1] }],
  leagues: [{ id: 'sco1', name: 'Scottish Premiership', short: 'Premiership', tier: 1, promote: 0, relegate: 0, tv: 120_000, clubs: [
    c('aberdeen', 'Granite City Dons', 'ABE', 50, ['#E30613', '#FFFFFF'], 'Pittodrie Park', 20866, [['Dimitar Mitov', 'GK', 28, 72, 'BUL'], ['Kevin Nisbet', 'ST', 28, 70, 'SCO']]),
    c('celtic', 'Glasgow Hoops', 'CEL', 72, ['#018749', '#FFFFFF'], 'Parkhead Park', 60411, [
      ['Kasper Schmeichel', 'GK', 38, 76, 'DEN'], ['Cameron Carter-Vickers', 'CB', 27, 77, 'USA'], ['Liam Scales', 'CB', 26, 73, 'IRL'], ['Alistair Johnston', 'RB', 26, 75, 'CAN'],
      ['Kieran Tierney', 'LB', 28, 75, 'SCO'], ['Callum McGregor', 'CM', 32, 77, 'SCO'], ['Arne Engels', 'CM', 22, 76, 'BEL'], ['Reo Hatate', 'CM', 27, 77, 'JPN'],
      ['Benjamin Nygren', 'RW', 24, 74, 'SWE'], ['Daizen Maeda', 'LW', 27, 78, 'JPN'], ['Kelechi Iheanacho', 'ST', 28, 73, 'NGA']]),
    c('dundee', 'Dundee Dark Blues', 'DUN', 38, ['#002F6C', '#FFFFFF'], 'Dens Road', 11850), c('dundeeutd', 'Dundee Terrors', 'DUU', 44, ['#F58220', '#000000'], 'Tannadice Road', 14223),
    c('falkirk', 'Falkirk Bairns', 'FAL', 36, ['#002F6C', '#FFFFFF'], 'Falkirk Park', 7937), c('hearts', 'Edinburgh Jambos', 'HEA', 50, ['#7A1F3D', '#FFFFFF'], 'Tynecastle Park Road', 19852, [['Craig Gordon', 'GK', 42, 70, 'SCO'], ['Lawrence Shankland', 'ST', 29, 72, 'SCO']]),
    c('hibernian', 'Edinburgh Hibees', 'HIB', 48, ['#00843D', '#FFFFFF'], 'Easter Road Park', 20421), c('kilmarnock', 'Ayrshire Killie', 'KIL', 38, ['#002F6C', '#FFFFFF'], 'Rugby Park Road', 15003),
    c('livingston', 'Livingston Lions', 'LIV', 34, ['#FFD200', '#000000'], 'Almondvale Park', 9512), c('motherwell', 'Motherwell Steelmen', 'MOT', 38, ['#F58220', '#7A1F3D'], 'Fir Park Road', 13677),
    c('rangers', 'Glasgow Gers', 'RAN', 70, ['#1B458F', '#FFFFFF'], 'Ibrox Park', 50817, [
      ['Jack Butland', 'GK', 32, 77, 'ENG'], ['John Souttar', 'CB', 28, 73, 'SCO'], ['James Tavernier', 'RB', 33, 75, 'ENG'], ['Nicolas Raskin', 'CM', 24, 76, 'BEL'],
      ['Mohamed Diomande', 'CM', 23, 76, 'CIV'], ['Connor Barron', 'CM', 23, 72, 'SCO'], ['Danilo', 'ST', 26, 73, 'BRA'], ['Hamza Igamane', 'ST', 22, 0, 'MAR'], ['Cyriel Dessers', 'ST', 30, 73, 'NGA']]),
    c('stmirren', 'Paisley Buddies', 'STM', 36, ['#000000', '#FFFFFF'], 'Paisley Park', 8023),
  ] }],
};
