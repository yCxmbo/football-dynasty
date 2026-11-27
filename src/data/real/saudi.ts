import { c, type RCountry } from './types';
import { KSA2 } from './second3';

export const SAUDI: RCountry = {
  id: 'ksa', name: 'Saudi Arabia', superCup: 'Saudi Super Cup',
  cups: [{ id: 'ksa-cup', name: 'King\'s Cup', tiers: [1, 2], main: true }],
  leagues: [{ id: 'ksa1', name: 'Saudi Pro League', short: 'Saudi Pro League', tier: 1, promote: 0, relegate: 3, tv: 400_000, clubs: [
    c('hilal', 'Riyadh Blue Waves', 'HIL', 78, ['#0055A4', '#FFFFFF'], 'Kingdom Park', 26000, [
      ['Yassine Bounou', 'GK', 34, 82, 'MAR'], ['Kalidou Koulibaly', 'CB', 34, 78, 'SEN'], ['Ali Al-Bulaihi', 'CB', 35, 72, 'KSA'], ['João Cancelo', 'RB', 31, 81, 'POR'],
      ['Theo Hernández', 'LB', 27, 83, 'FRA'], ['Rúben Neves', 'DM', 28, 82, 'POR'], ['Sergej Milinković-Savić', 'CM', 30, 82, 'SRB'], ['Malcom', 'RW', 28, 80, 'BRA'],
      ['Salem Al-Dawsari', 'LW', 33, 77, 'KSA'], ['Aleksandar Mitrović', 'ST', 30, 81, 'SRB'], ['Darwin Núñez', 'ST', 26, 81, 'URU']]),
    c('nassr', 'Riyadh Knights', 'NSR', 76, ['#FFD200', '#0055A4'], 'Al-Awwal Park', 25000, [
      ['Bento', 'GK', 26, 77, 'BRA'], ['Iñigo Martínez', 'CB', 34, 79, 'ESP'], ['Mohamed Simakan', 'CB', 25, 78, 'FRA'], ['Marcelo Brozović', 'DM', 32, 80, 'CRO'],
      ['Ângelo', 'RW', 20, 74, 'BRA'], ['Kingsley Coman', 'LW', 29, 80, 'FRA'], ['Sadio Mané', 'LW', 33, 79, 'SEN'], ['João Félix', 'AM', 25, 79, 'POR'], ['Cristiano Ronaldo', 'ST', 40, 82, 'POR']]),
    c('ittihad', 'Jeddah Tigers', 'ITT', 76, ['#FFD200', '#000000'], 'King Abdullah Sports City Park', 62345, [
      ['Predrag Rajković', 'GK', 29, 77, 'SRB'], ['Danilo Pereira', 'CB', 33, 76, 'POR'], ['Fabinho', 'DM', 31, 79, 'BRA'], ['N\'Golo Kanté', 'CM', 34, 80, 'FRA'],
      ['Houssem Aouar', 'AM', 27, 76, 'ALG'], ['Moussa Diaby', 'RW', 26, 79, 'FRA'], ['Steven Bergwijn', 'LW', 27, 76, 'NED'], ['Karim Benzema', 'ST', 37, 83, 'FRA']]),
    c('ahli', 'Jeddah Royals', 'AHL', 76, ['#00843D', '#FFFFFF'], 'Jeddah Park', 62345, [
      ['Édouard Mendy', 'GK', 33, 79, 'SEN'], ['Merih Demiral', 'CB', 27, 79, 'TUR'], ['Roger Ibañez', 'CB', 26, 77, 'BRA'], ['Franck Kessié', 'CM', 28, 79, 'CIV'],
      ['Enzo Millot', 'AM', 23, 77, 'FRA'], ['Riyad Mahrez', 'RW', 34, 80, 'ALG'], ['Galeno', 'LW', 27, 78, 'BRA'], ['Ivan Toney', 'ST', 29, 80, 'ENG']]),
    c('qadsiah', 'Khobar Qadsiah', 'QAD', 66, ['#E30613', '#FFD200'], 'Prince Saud bin Jalawi Park', 15000, [
      ['Koen Casteels', 'GK', 33, 79, 'BEL'], ['Nacho', 'CB', 35, 76, 'ESP'], ['Gastón Álvarez', 'CB', 25, 75, 'URU'], ['Mateo Retegui', 'ST', 26, 80, 'ITA'], ['Julián Quiñones', 'ST', 28, 77, 'MEX']]),
    c('ettifaq', 'Dammam Commandos', 'ETT', 60, ['#00843D', '#E30613'], 'EGO Park', 15000, [['Georginio Wijnaldum', 'CM', 34, 76, 'NED'], ['Moussa Dembélé', 'ST', 29, 75, 'FRA']]),
    c('shabab', 'Riyadh White Lions', 'SHB', 58, ['#FFFFFF', '#000000'], 'Al-Shabab Park', 15000, [['Yannick Carrasco', 'LW', 31, 77, 'BEL'], ['Abderrazak Hamdallah', 'ST', 34, 74, 'MAR']]),
    c('taawoun', 'Buraidah Sukari', 'TAA', 52, ['#FFD200', '#000000'], 'Taawoun Park', 25000), c('fateh', 'Al-Hasa Model', 'FAT', 48, ['#0055A4', '#FFFFFF'], 'Prince Abdullah bin Jalawi Park', 26000),
    c('khaleej', 'Saihat Dolphins', 'KHA', 46, ['#FFD200', '#00843D'], 'Saihat Park', 8000), c('fayha', 'Majmaah Orange', 'FAY', 44, ['#F58220', '#FFFFFF'], 'Majmaah Park', 7000),
    c('kholood', 'Ar Rass Kholood', 'KHO', 40, ['#E30613', '#FFD200'], 'Ar Rass Park', 7000), c('riyadh', 'Riyadh City Club', 'RIY', 40, ['#E30613', '#000000'], 'Riyadh University Park', 15000),
    c('okhdood', 'Najran Okhdood', 'OKH', 38, ['#000000', '#FFFFFF'], 'Najran Park', 12000), c('hazem', 'Ar Rass Hazem', 'HAZ', 36, ['#E30613', '#FFFFFF'], 'Hazem Park', 8000),
    c('najma', 'Unaizah Stars', 'NAJ', 36, ['#0055A4', '#FFD200'], 'Unaizah Park', 8000), c('neom', 'Neom Futurists', 'NEO', 50, ['#002F6C', '#C39E6D'], 'Neom Park', 10000, [['Alexandre Lacazette', 'ST', 34, 75, 'FRA']]),
    c('damac', 'Khamis Mushait Knights', 'DAM', 42, ['#E30613', '#FFD200'], 'Prince Sultan Park', 20000),
  ] }, KSA2],
};
