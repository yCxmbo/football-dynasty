import { c, type RCountry } from './types';

export const SPAIN: RCountry = {
  id: 'esp', name: 'Spain',
  cups: [{ id: 'esp-cup', name: 'Copa del Reino', tiers: [1], main: true }],
  leagues: [
    { id: 'esp1', name: 'Spanish Primera', short: 'Primera', tier: 1, promote: 0, relegate: 0, tv: 1_000_000, clubs: [
      c('alaves', 'Vitoria Babazorros', 'ALA', 60, ['#0761AF', '#FFFFFF'], 'Mendizorrotza Park', 19840, [
        ['Antonio Sivera', 'GK', 28, 76, 'ESP'], ['Jonny Otto', 'RB', 31, 74, 'ESP'], ['Antonio Blanco', 'DM', 25, 75, 'ESP'], ['Carlos Vicente', 'RW', 26, 75, 'ESP'], ['Toni Martínez', 'ST', 28, 75, 'ESP']]),
      c('athletic', 'Bilbao Lions', 'ATH', 80, ['#EE2523', '#FFFFFF'], 'Lions Cathedral', 53289, [
        ['Unai Simón', 'GK', 28, 84, 'ESP'], ['Dani Vivian', 'CB', 26, 81, 'ESP'], ['Aitor Paredes', 'CB', 25, 77, 'ESP'], ['Yuri Berchiche', 'LB', 35, 76, 'ESP'],
        ['Óscar de Marcos', 'RB', 36, 74, 'ESP'], ['Mikel Jauregizar', 'CM', 21, 77, 'ESP', 84], ['Mikel Vesga', 'DM', 32, 75, 'ESP'], ['Oihan Sancet', 'AM', 25, 81, 'ESP'],
        ['Nico Williams', 'LW', 23, 85, 'ESP', 89], ['Iñaki Williams', 'RW', 31, 80, 'GHA'], ['Gorka Guruzeta', 'ST', 29, 77, 'ESP'], ['Álex Berenguer', 'RW', 30, 77, 'ESP']]),
      c('atletico', 'Madrid Colchoneros', 'ATM', 88, ['#CB3524', '#FFFFFF'], 'Metropolitan Park', 70460, [
        ['Jan Oblak', 'GK', 32, 86, 'SVN'], ['José María Giménez', 'CB', 30, 81, 'URU'], ['Robin Le Normand', 'CB', 28, 81, 'ESP'], ['Clément Lenglet', 'CB', 30, 77, 'FRA'],
        ['David Hancko', 'CB', 27, 81, 'SVK'], ['Marcos Llorente', 'RB', 30, 81, 'ESP'], ['Nahuel Molina', 'RB', 27, 78, 'ARG'], ['Matteo Ruggeri', 'LB', 22, 76, 'ITA'],
        ['Koke', 'CM', 33, 79, 'ESP'], ['Pablo Barrios', 'CM', 22, 80, 'ESP', 86], ['Johnny Cardoso', 'DM', 23, 78, 'USA'], ['Conor Gallagher', 'CM', 25, 80, 'ENG'],
        ['Álex Baena', 'AM', 24, 83, 'ESP'], ['Giuliano Simeone', 'RW', 22, 78, 'ARG'], ['Thiago Almada', 'AM', 24, 79, 'ARG'], ['Antoine Griezmann', 'ST', 34, 83, 'FRA'],
        ['Julián Álvarez', 'ST', 25, 87, 'ARG'], ['Alexander Sørloth', 'ST', 29, 80, 'NOR']]),
      c('barcelona', 'Catalonia Blaugrana', 'BAR', 94, ['#A50044', '#004D98'], 'Camp Nou Park', 99354, [
        ['Marc-André ter Stegen', 'GK', 33, 84, 'GER'], ['Joan García', 'GK', 24, 82, 'ESP'], ['Wojciech Szczęsny', 'GK', 35, 79, 'POL'], ['Pau Cubarsí', 'CB', 18, 82, 'ESP', 90],
        ['Ronald Araújo', 'CB', 26, 82, 'URU'], ['Eric García', 'CB', 24, 78, 'ESP'], ['Andreas Christensen', 'CB', 29, 79, 'DEN'], ['Jules Koundé', 'RB', 26, 85, 'FRA'],
        ['Alejandro Balde', 'LB', 21, 82, 'ESP', 87], ['Frenkie de Jong', 'CM', 28, 85, 'NED'], ['Pedri', 'CM', 22, 89, 'ESP', 91], ['Gavi', 'CM', 21, 81, 'ESP', 88],
        ['Marc Casadó', 'DM', 22, 77, 'ESP'], ['Dani Olmo', 'AM', 27, 83, 'ESP'], ['Fermín López', 'AM', 22, 80, 'ESP', 85], ['Lamine Yamal', 'RW', 18, 89, 'ESP', 96],
        ['Raphinha', 'LW', 28, 88, 'BRA'], ['Marcus Rashford', 'LW', 27, 80, 'ENG'], ['Robert Lewandowski', 'ST', 37, 85, 'POL'], ['Ferran Torres', 'ST', 25, 79, 'ESP']]),
      c('celta', 'Vigo Celestes', 'CEL', 64, ['#8AC3EE', '#FFFFFF'], 'Balaídos Park', 24870, [
        ['Iván Villar', 'GK', 28, 74, 'ESP'], ['Óscar Mingueza', 'RB', 26, 78, 'ESP'], ['Carl Starfelt', 'CB', 30, 75, 'SWE'], ['Fran Beltrán', 'CM', 26, 76, 'ESP'],
        ['Ilaix Moriba', 'CM', 22, 75, 'GUI'], ['Iago Aspas', 'ST', 38, 78, 'ESP'], ['Borja Iglesias', 'ST', 32, 76, 'ESP'], ['Williot Swedberg', 'LW', 21, 73, 'SWE']]),
      c('elche', 'Elche Franjiverdes', 'ELC', 52, ['#FFFFFF', '#05642C'], 'Martínez Valero Park', 31388, [
        ['Matías Dituro', 'GK', 38, 72, 'ARG'], ['Pedro Bigas', 'CB', 35, 71, 'ESP'], ['Marc Aguado', 'CM', 25, 72, 'ESP'], ['Rafa Mir', 'ST', 28, 74, 'ESP']]),
      c('espanyol', 'Barcelona Periquitos', 'ESY', 60, ['#007FC8', '#FFFFFF'], 'Cornellà Park', 40000, [
        ['Marko Dmitrović', 'GK', 33, 75, 'SRB'], ['Leandro Cabrera', 'CB', 34, 74, 'URU'], ['Carlos Romero', 'LB', 23, 74, 'ESP'], ['Pol Lozano', 'CM', 25, 73, 'ESP'],
        ['Javi Puado', 'ST', 27, 76, 'ESP'], ['Roberto Fernández', 'ST', 23, 72, 'ESP']]),
      c('getafe', 'Getafe Azulones', 'GET', 60, ['#005999', '#FFFFFF'], 'Coliseum Sur', 16500, [
        ['David Soria', 'GK', 32, 78, 'ESP'], ['Djené', 'CB', 33, 76, 'TOG'], ['Mauro Arambarri', 'CM', 29, 77, 'URU'], ['Luis Milla', 'CM', 30, 77, 'ESP'], ['Borja Mayoral', 'ST', 28, 75, 'ESP']]),
      c('girona', 'Girona Blanquivermells', 'GIR', 68, ['#CD2534', '#FFFFFF'], 'Montilivi Park', 14624, [
        ['Paulo Gazzaniga', 'GK', 33, 77, 'ARG'], ['Daley Blind', 'CB', 35, 76, 'NED'], ['David López', 'CB', 35, 74, 'ESP'], ['Arnau Martínez', 'RB', 22, 77, 'ESP'],
        ['Yangel Herrera', 'CM', 27, 78, 'VEN'], ['Iván Martín', 'CM', 26, 76, 'ESP'], ['Viktor Tsygankov', 'RW', 27, 78, 'UKR'], ['Bryan Gil', 'LW', 24, 75, 'ESP'], ['Cristhian Stuani', 'ST', 38, 73, 'URU']]),
      c('levante', 'Valencia Granotes', 'LEV', 54, ['#004D98', '#A50044'], 'Ciutat Park', 26354, [
        ['Mathew Ryan', 'GK', 33, 75, 'AUS'], ['Unai Elgezabal', 'CB', 32, 70, 'ESP'], ['Carlos Álvarez', 'AM', 22, 74, 'ESP'], ['Iván Romero', 'ST', 24, 72, 'ESP']]),
      c('mallorca', 'Mallorca Bermellones', 'MLL', 62, ['#E20613', '#000000'], 'Son Moix Park', 23142, [
        ['Dominik Greif', 'GK', 28, 76, 'SVK'], ['Martin Valjent', 'CB', 29, 76, 'SVK'], ['Antonio Raíllo', 'CB', 33, 74, 'ESP'], ['Pablo Maffeo', 'RB', 28, 76, 'ARG'],
        ['Sergi Darder', 'CM', 31, 76, 'ESP'], ['Dani Rodríguez', 'AM', 37, 72, 'ESP'], ['Vedat Muriqi', 'ST', 31, 76, 'KOS'], ['Takuma Asano', 'RW', 30, 73, 'JPN']]),
      c('osasuna', 'Pamplona Rojillos', 'OSA', 62, ['#D91A21', '#0A346F'], 'Sadar Park', 23576, [
        ['Sergio Herrera', 'GK', 32, 76, 'ESP'], ['Alejandro Catena', 'CB', 30, 76, 'ESP'], ['Jesús Areso', 'RB', 26, 74, 'ESP'], ['Lucas Torró', 'DM', 31, 75, 'ESP'],
        ['Aimar Oroz', 'AM', 23, 76, 'ESP'], ['Rubén García', 'LW', 31, 74, 'ESP'], ['Ante Budimir', 'ST', 34, 78, 'CRO']]),
      c('rayo', 'Vallecas Franjirrojos', 'RAY', 60, ['#FFFFFF', '#E53027'], 'Vallecas Park', 14708, [
        ['Augusto Batalla', 'GK', 29, 75, 'ARG'], ['Florian Lejeune', 'CB', 34, 75, 'FRA'], ['Andrei Rațiu', 'RB', 27, 76, 'ROU'], ['Pathé Ciss', 'DM', 31, 74, 'SEN'],
        ['Unai López', 'CM', 29, 75, 'ESP'], ['Isi Palazón', 'RW', 30, 77, 'ESP'], ['Jorge de Frutos', 'LW', 28, 76, 'ESP'], ['Álvaro García', 'LW', 32, 74, 'ESP']]),
      c('betis', 'Seville Verdiblancos', 'BET', 74, ['#00954C', '#FFFFFF'], 'Villamarín Park', 60721, [
        ['Adrián', 'GK', 38, 72, 'ESP'], ['Pau López', 'GK', 30, 76, 'ESP'], ['Diego Llorente', 'CB', 32, 77, 'ESP'], ['Marc Bartra', 'CB', 34, 75, 'ESP'],
        ['Natan', 'CB', 24, 76, 'BRA'], ['Ricardo Rodríguez', 'LB', 32, 75, 'SUI'], ['Sofyan Amrabat', 'DM', 29, 78, 'MAR'],
        ['Pablo Fornals', 'CM', 29, 78, 'ESP'], ['Isco', 'AM', 33, 80, 'ESP'], ['Giovani Lo Celso', 'AM', 29, 79, 'ARG'], ['Abde Ezzalzouli', 'LW', 23, 78, 'MAR'],
        ['Antony', 'RW', 25, 79, 'BRA'], ['Cédric Bakambu', 'ST', 34, 74, 'COD'], ['Cucho Hernández', 'ST', 26, 78, 'COL']]),
      c('realmadrid', 'Madrid Merengues', 'RMA', 96, ['#FFFFFF', '#FEBE10'], 'Bernabéu Park', 83186, [
        ['Thibaut Courtois', 'GK', 33, 89, 'BEL'], ['Andriy Lunin', 'GK', 26, 79, 'UKR'], ['Antonio Rüdiger', 'CB', 32, 85, 'GER'], ['Éder Militão', 'CB', 27, 83, 'BRA'],
        ['Dean Huijsen', 'CB', 20, 81, 'ESP', 88], ['David Alaba', 'CB', 33, 79, 'AUT'], ['Raúl Asencio', 'CB', 22, 77, 'ESP'], ['Trent Alexander-Arnold', 'RB', 26, 86, 'ENG'],
        ['Dani Carvajal', 'RB', 33, 82, 'ESP'], ['Álvaro Carreras', 'LB', 22, 80, 'ESP', 85], ['Ferland Mendy', 'LB', 30, 79, 'FRA'], ['Aurélien Tchouaméni', 'DM', 25, 84, 'FRA'],
        ['Federico Valverde', 'CM', 27, 88, 'URU'], ['Eduardo Camavinga', 'CM', 22, 83, 'FRA'], ['Jude Bellingham', 'AM', 22, 89, 'ENG', 93], ['Arda Güler', 'AM', 20, 80, 'TUR', 89],
        ['Dani Ceballos', 'CM', 29, 78, 'ESP'], ['Rodrygo', 'RW', 24, 84, 'BRA'], ['Brahim Díaz', 'AM', 26, 79, 'MAR'], ['Vinícius Júnior', 'LW', 25, 90, 'BRA'],
        ['Franco Mastantuono', 'RW', 18, 76, 'ARG', 90], ['Kylian Mbappé', 'ST', 26, 92, 'FRA'], ['Endrick', 'ST', 19, 76, 'BRA', 89], ['Gonzalo García', 'ST', 21, 73, 'ESP']]),
      c('oviedo', 'Asturias Carbayones', 'OVI', 50, ['#0055A5', '#FFFFFF'], 'Carlos Tartiere Park', 30500, [
        ['Aarón Escandell', 'GK', 30, 72, 'ESP'], ['David Costas', 'CB', 30, 70, 'ESP'], ['Santi Cazorla', 'AM', 40, 73, 'ESP'], ['Salomón Rondón', 'ST', 35, 73, 'VEN']]),
      c('realsociedad', 'San Sebastián Txuri-Urdin', 'RSO', 74, ['#0067B1', '#FFFFFF'], 'Anoeta Park', 39500, [
        ['Álex Remiro', 'GK', 30, 82, 'ESP'], ['Igor Zubeldia', 'CB', 28, 78, 'ESP'], ['Jon Aramburu', 'RB', 22, 75, 'VEN'], ['Sergio Gómez', 'LB', 25, 76, 'ESP'],
        ['Brais Méndez', 'CM', 28, 79, 'ESP'], ['Takefusa Kubo', 'RW', 24, 81, 'JPN'], ['Ander Barrenetxea', 'LW', 23, 77, 'ESP'], ['Mikel Oyarzabal', 'ST', 28, 82, 'ESP'], ['Orri Óskarsson', 'ST', 21, 74, 'ISL']]),
      c('sevilla', 'Seville Nervionenses', 'SEV', 72, ['#FFFFFF', '#D8001D'], 'Nervión Park', 43883, [
        ['Ørjan Nyland', 'GK', 34, 75, 'NOR'], ['Loïc Badé', 'CB', 25, 78, 'FRA'], ['José Ángel Carmona', 'RB', 23, 75, 'ESP'], ['Nemanja Gudelj', 'DM', 33, 75, 'SRB'],
        ['Djibril Sow', 'CM', 28, 75, 'SUI'], ['Lucien Agoumé', 'CM', 23, 75, 'FRA'], ['Rubén Vargas', 'LW', 27, 76, 'SUI'], ['Isaac Romero', 'ST', 25, 74, 'ESP']]),
      c('valencia', 'Valencia Che', 'VAL', 70, ['#FFFFFF', '#000000'], 'Mestalla Park', 49430, [
        ['Stole Dimitrievski', 'GK', 31, 75, 'MKD'], ['César Tárrega', 'CB', 23, 76, 'ESP'], ['Mouctar Diakhaby', 'CB', 28, 76, 'GUI'],
        ['José Gayà', 'LB', 30, 77, 'ESP'], ['Javi Guerra', 'CM', 22, 78, 'ESP', 84], ['Pepelu', 'DM', 27, 77, 'ESP'], ['Luis Rioja', 'LW', 31, 75, 'ESP'],
        ['Diego López', 'RW', 23, 75, 'ESP'], ['Hugo Duro', 'ST', 25, 76, 'ESP']]),
      c('villarreal', 'Castellón Yellow Submarine', 'VIL', 78, ['#FFE667', '#005187'], 'Ceramic Park', 23500, [
        ['Luiz Júnior', 'GK', 24, 78, 'BRA'], ['Juan Foyth', 'CB', 27, 79, 'ARG'], ['Logan Costa', 'CB', 24, 77, 'CPV'], ['Renato Veiga', 'CB', 21, 77, 'POR'],
        ['Sergi Cardona', 'LB', 26, 76, 'ESP'], ['Dani Parejo', 'CM', 36, 79, 'ESP'], ['Santi Comesaña', 'CM', 28, 77, 'ESP'], ['Thomas Partey', 'DM', 32, 80, 'GHA'],
        ['Pape Gueye', 'CM', 26, 76, 'SEN'], ['Yeremy Pino', 'RW', 22, 79, 'ESP'], ['Nicolas Pépé', 'RW', 30, 77, 'CIV'], ['Ayoze Pérez', 'ST', 32, 79, 'ESP'],
        ['Gerard Moreno', 'ST', 33, 79, 'ESP'], ['Georges Mikautadze', 'ST', 24, 78, 'GEO']]),
    ] },
  ],
};
