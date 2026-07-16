import { Departement, Region } from "./types/departement.type";
import { StructureType } from "./types/structure.type";

export type LatLngTuple = [number, number];

// Center of France https://fr.wikipedia.org/wiki/Centre_de_la_France
export const FRANCE_CENTER: LatLngTuple = [46.6055983, 1.8750922];
export const DEFAULT_MAP_ZOOM = 6;
export const MIN_MAP_ZOOM = 6;
export const MAX_MAP_ZOOM = 18;

// Map bounds (France métropolitaine) (SW/NE)
export const FRANCE_MAX_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [38.976492485539424, -5.9326171875],
  [53.291489065300226, 9.667968750000002],
];

export const DEFAULT_PAGE_SIZE = 20;
export const MIDDLE_PAGE_SIZE = 12;
export const SHORT_PAGE_SIZE = 6;

// Cookie expiration times
export const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;
export const THREE_MONTHS_IN_SECONDS = 60 * 60 * 24 * 31 * 3;

export const FILE_UPLOAD_EXPIRATION_DELAY = 60 * 60; // 1 hour

export const START_YEAR = 2021;

export const CURRENT_YEAR = new Date().getFullYear();

export const DOCUMENTS_FINANCIERS_OPEN_YEAR =
  Number(process.env.NEXT_PUBLIC_DOCUMENTS_FINANCIERS_OPEN_YEAR) || 2025;

export const INDICATEUR_FINANCIER_PREVISIONNEL_START_YEAR = 2024;

export const INDICATEUR_FINANCIER_CUTOFF_YEAR_AUTORISEE =
  Number(process.env.NEXT_PUBLIC_INDICATEUR_FINANCIER_CUTOFF_YEAR_AUTORISEE) ||
  2024;

export const INDICATEUR_FINANCIER_CUTOFF_YEAR_SUBVENTIONNEE =
  Number(
    process.env.NEXT_PUBLIC_INDICATEUR_FINANCIER_CUTOFF_YEAR_SUBVENTIONNEE
  ) || 2024;

export const AUTORISEE_OPEN_YEAR =
  Number(process.env.NEXT_PUBLIC_AUTORISEE_OPEN_YEAR) || 2025;
export const SUBVENTIONNEE_OPEN_YEAR =
  Number(process.env.NEXT_PUBLIC_SUBVENTIONNEE_OPEN_YEAR) || 2024;

export const EXCLUDED_STRUCTURE_TYPES = [StructureType.PRAHDA, "NH"] as const;

const IMAGE_MIME_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const SPREADSHEET_MIME_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "text/csv",
];
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  ...IMAGE_MIME_TYPES,
  ...SPREADSHEET_MIME_TYPES,
];

export const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 Mo

export const MODELE_DIFFUS_LINK = "/adresses-diffus.xlsx";
export const MODELE_MIXTE_LINK = "/adresses-mixte.xlsx";

export const BHASILE_USER_NAME = "BhasileBot";
export const BHASILE_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_BHASILE_CONTACT_EMAIL || "";
export const BHASILE_PHONE_NUMBERS =
  process.env.NEXT_PUBLIC_BHASILE_PHONE_NUMBERS || "";

export const DEPARTEMENTS: Departement[] = [
  {
    numero: "01",
    name: "Ain",
    region: "Auvergne-Rhône-Alpes",
    population: 679344,
  },
  {
    numero: "02",
    name: "Aisne",
    region: "Hauts-de-France",
    population: 523342,
  },
  {
    numero: "03",
    name: "Allier",
    region: "Auvergne-Rhône-Alpes",
    population: 333298,
  },
  {
    numero: "04",
    name: "Alpes-de-Haute-Provence",
    region: "Provence-Alpes-Côte d'Azur",
    population: 168054,
  },
  {
    numero: "05",
    name: "Hautes-Alpes",
    region: "Provence-Alpes-Côte d'Azur",
    population: 143467,
  },
  {
    numero: "06",
    name: "Alpes-Maritimes",
    region: "Provence-Alpes-Côte d'Azur",
    population: 1128418,
  },
  {
    numero: "07",
    name: "Ardèche",
    region: "Auvergne-Rhône-Alpes",
    population: 334231,
  },
  {
    numero: "08",
    name: "Ardennes",
    region: "Grand Est",
    population: 265893,
  },
  {
    numero: "09",
    name: "Ariège",
    region: "Occitanie",
    population: 155722,
  },
  {
    numero: "10",
    name: "Aube",
    region: "Grand Est",
    population: 310447,
  },
  {
    numero: "11",
    name: "Aude",
    region: "Occitanie",
    population: 379648,
  },
  {
    numero: "12",
    name: "Aveyron",
    region: "Occitanie",
    population: 279609,
  },
  {
    numero: "13",
    name: "Bouches-du-Rhône",
    region: "Provence-Alpes-Côte d'Azur",
    population: 2087658,
  },
  {
    numero: "14",
    name: "Calvados",
    region: "Normandie",
    population: 709441,
  },
  {
    numero: "15",
    name: "Cantal",
    region: "Auvergne-Rhône-Alpes",
    population: 144196,
  },
  {
    numero: "16",
    name: "Charente",
    region: "Nouvelle-Aquitaine",
    population: 352683,
  },
  {
    numero: "17",
    name: "Charente-Maritime",
    region: "Nouvelle-Aquitaine",
    population: 672279,
  },
  {
    numero: "18",
    name: "Cher",
    region: "Centre-Val de Loire",
    population: 298660,
  },
  {
    numero: "19",
    name: "Corrèze",
    region: "Nouvelle-Aquitaine",
    population: 240826,
  },
  {
    numero: "21",
    name: "Côte-d'Or",
    region: "Bourgogne-Franche-Comté",
    population: 540100,
  },
  {
    numero: "22",
    name: "Côtes-d'Armor",
    region: "Bretagne",
    population: 611859,
  },
  {
    numero: "23",
    name: "Creuse",
    region: "Nouvelle-Aquitaine",
    population: 115527,
  },
  {
    numero: "24",
    name: "Dordogne",
    region: "Nouvelle-Aquitaine",
    population: 417614,
  },
  {
    numero: "25",
    name: "Doubs",
    region: "Bourgogne-Franche-Comté",
    population: 547163,
  },
  {
    numero: "26",
    name: "Drôme",
    region: "Auvergne-Rhône-Alpes",
    population: 524207,
  },
  {
    numero: "27",
    name: "Eure",
    region: "Normandie",
    population: 602714,
  },
  {
    numero: "28",
    name: "Eure-et-Loir",
    region: "Centre-Val de Loire",
    population: 433129,
  },
  {
    numero: "29",
    name: "Finistère",
    region: "Bretagne",
    population: 933455,
  },
  {
    numero: "2A",
    name: "Corse-du-Sud",
    region: "Corse",
    population: 168306,
  },
  {
    numero: "2B",
    name: "Haute-Corse",
    region: "Corse",
    population: 187180,
  },
  {
    numero: "20",
    name: "Corse",
    region: "Corse",
    population: 355486,
  },
  {
    numero: "30",
    name: "Gard",
    region: "Occitanie",
    population: 770940,
  },
  {
    numero: "31",
    name: "Haute-Garonne",
    region: "Occitanie",
    population: 1471468,
  },
  {
    numero: "32",
    name: "Gers",
    region: "Occitanie",
    population: 192645,
  },
  {
    numero: "33",
    name: "Gironde",
    region: "Nouvelle-Aquitaine",
    population: 1690493,
  },
  {
    numero: "34",
    name: "Hérault",
    region: "Occitanie",
    population: 1230289,
  },
  {
    numero: "35",
    name: "Ille-et-Vilaine",
    region: "Bretagne",
    population: 1120666,
  },
  {
    numero: "36",
    name: "Indre",
    region: "Centre-Val de Loire",
    population: 216069,
  },
  {
    numero: "37",
    name: "Indre-et-Loire",
    region: "Centre-Val de Loire",
    population: 619362,
  },
  {
    numero: "38",
    name: "Isère",
    region: "Auvergne-Rhône-Alpes",
    population: 1298990,
  },
  {
    numero: "39",
    name: "Jura",
    region: "Bourgogne-Franche-Comté",
    population: 257973,
  },
  {
    numero: "40",
    name: "Landes",
    region: "Nouvelle-Aquitaine",
    population: 433570,
  },
  {
    numero: "41",
    name: "Loir-et-Cher",
    region: "Centre-Val de Loire",
    population: 328543,
  },
  {
    numero: "42",
    name: "Loire",
    region: "Auvergne-Rhône-Alpes",
    population: 774133,
  },
  {
    numero: "43",
    name: "Haute-Loire",
    region: "Auvergne-Rhône-Alpes",
    population: 228654,
  },
  {
    numero: "44",
    name: "Loire-Atlantique",
    region: "Pays de la Loire",
    population: 1487570,
  },
  {
    numero: "45",
    name: "Loiret",
    region: "Centre-Val de Loire",
    population: 691268,
  },
  {
    numero: "46",
    name: "Lot",
    region: "Occitanie",
    population: 176473,
  },
  {
    numero: "47",
    name: "Lot-et-Garonne",
    region: "Nouvelle-Aquitaine",
    population: 333602,
  },
  {
    numero: "48",
    name: "Lozère",
    region: "Occitanie",
    population: 76486,
  },
  {
    numero: "49",
    name: "Maine-et-Loire",
    region: "Pays de la Loire",
    population: 833776,
  },
  {
    numero: "50",
    name: "Manche",
    region: "Normandie",
    population: 497522,
  },
  {
    numero: "51",
    name: "Marne",
    region: "Grand Est",
    population: 563076,
  },
  {
    numero: "52",
    name: "Haute-Marne",
    region: "Grand Est",
    population: 168331,
  },
  {
    numero: "53",
    name: "Mayenne",
    region: "Pays de la Loire",
    population: 305468,
  },
  {
    numero: "54",
    name: "Meurthe-et-Moselle",
    region: "Grand Est",
    population: 732236,
  },
  {
    numero: "55",
    name: "Meuse",
    region: "Grand Est",
    population: 180290,
  },
  {
    numero: "56",
    name: "Morbihan",
    region: "Bretagne",
    population: 783390,
  },
  {
    numero: "57",
    name: "Moselle",
    region: "Grand Est",
    population: 1051309,
  },
  {
    numero: "58",
    name: "Nièvre",
    region: "Bourgogne-Franche-Comté",
    population: 201417,
  },
  {
    numero: "59",
    name: "Nord",
    region: "Hauts-de-France",
    population: 2615635,
  },
  {
    numero: "60",
    name: "Oise",
    region: "Hauts-de-France",
    population: 829899,
  },
  {
    numero: "61",
    name: "Orne",
    region: "Normandie",
    population: 275201,
  },
  {
    numero: "62",
    name: "Pas-de-Calais",
    region: "Hauts-de-France",
    population: 1457905,
  },
  {
    numero: "63",
    name: "Puy-de-Dôme",
    region: "Auvergne-Rhône-Alpes",
    population: 664453,
  },
  {
    numero: "64",
    name: "Pyrénées-Atlantiques",
    region: "Nouvelle-Aquitaine",
    population: 706564,
  },
  {
    numero: "65",
    name: "Hautes-Pyrénées",
    region: "Occitanie",
    population: 231349,
  },
  {
    numero: "66",
    name: "Pyrénées-Orientales",
    region: "Occitanie",
    population: 496855,
  },
  {
    numero: "67",
    name: "Bas-Rhin",
    region: "Grand Est",
    population: 1163810,
  },
  {
    numero: "68",
    name: "Haut-Rhin",
    region: "Grand Est",
    population: 770738,
  },
  {
    numero: "69",
    name: "Rhône",
    region: "Auvergne-Rhône-Alpes",
    population: 1914667,
  },
  {
    numero: "70",
    name: "Haute-Saône",
    region: "Bourgogne-Franche-Comté",
    population: 233185,
  },
  {
    numero: "71",
    name: "Saône-et-Loire",
    region: "Bourgogne-Franche-Comté",
    population: 550310,
  },
  {
    numero: "72",
    name: "Sarthe",
    region: "Pays de la Loire",
    population: 566733,
  },
  {
    numero: "73",
    name: "Savoie",
    region: "Auvergne-Rhône-Alpes",
    population: 448226,
  },
  {
    numero: "74",
    name: "Haute-Savoie",
    region: "Auvergne-Rhône-Alpes",
    population: 861158,
  },
  {
    numero: "75",
    name: "Paris",
    region: "Île-de-France",
    population: 2103778,
  },
  {
    numero: "76",
    name: "Seine-Maritime",
    region: "Normandie",
    population: 1260964,
  },
  {
    numero: "77",
    name: "Seine-et-Marne",
    region: "Île-de-France",
    population: 1468108,
  },
  {
    numero: "78",
    name: "Yvelines",
    region: "Île-de-France",
    population: 1485086,
  },
  {
    numero: "79",
    name: "Deux-Sèvres",
    region: "Nouvelle-Aquitaine",
    population: 375229,
  },
  {
    numero: "80",
    name: "Somme",
    region: "Hauts-de-France",
    population: 565413,
  },
  {
    numero: "81",
    name: "Tarn",
    region: "Occitanie",
    population: 397352,
  },
  {
    numero: "82",
    name: "Tarn-et-Garonne",
    region: "Occitanie",
    population: 265817,
  },
  {
    numero: "83",
    name: "Var",
    region: "Provence-Alpes-Côte d'Azur",
    population: 1119307,
  },
  {
    numero: "84",
    name: "Vaucluse",
    region: "Provence-Alpes-Côte d'Azur",
    population: 572056,
  },
  {
    numero: "85",
    name: "Vendée",
    region: "Pays de la Loire",
    population: 713609,
  },
  {
    numero: "86",
    name: "Vienne",
    region: "Nouvelle-Aquitaine",
    population: 438897,
  },
  {
    numero: "87",
    name: "Haute-Vienne",
    region: "Nouvelle-Aquitaine",
    population: 373167,
  },
  {
    numero: "88",
    name: "Vosges",
    region: "Grand Est",
    population: 357248,
  },
  {
    numero: "89",
    name: "Yonne",
    region: "Bourgogne-Franche-Comté",
    population: 332267,
  },
  {
    numero: "90",
    name: "Territoire de Belfort",
    region: "Bourgogne-Franche-Comté",
    population: 140255,
  },
  {
    numero: "91",
    name: "Essonne",
    region: "Île-de-France",
    population: 1338485,
  },
  {
    numero: "92",
    name: "Hauts-de-Seine",
    region: "Île-de-France",
    population: 1654712,
  },
  {
    numero: "93",
    name: "Seine-Saint-Denis",
    region: "Île-de-France",
    population: 1704316,
  },
  {
    numero: "94",
    name: "Val-de-Marne",
    region: "Île-de-France",
    population: 1426929,
  },
  {
    numero: "95",
    name: "Val-d'Oise",
    region: "Île-de-France",
    population: 1281653,
  },
  {
    numero: "971",
    name: "Guadeloupe",
    region: "Guadeloupe",
    population: 384160,
  },
  {
    numero: "972",
    name: "Martinique",
    region: "Martinique",
    population: 360630,
  },
  {
    numero: "973",
    name: "Guyane",
    region: "Guyane",
    population: 293996,
  },
  {
    numero: "974",
    name: "La Réunion",
    region: "La Réunion",
    population: 889679,
  },
  {
    numero: "976",
    name: "Mayotte",
    region: "Mayotte",
    population: null,
  },
];

export const REGIONS: Region[] = [
  { code: "FR-ARA", name: "Auvergne-Rhône-Alpes", show: true },
  { code: "FR-BFC", name: "Bourgogne-Franche-Comté", show: true },
  { code: "FR-BRE", name: "Bretagne", show: true },
  { code: "FR-CVL", name: "Centre-Val de Loire", show: true },
  { code: "FR-20R", name: "Corse", show: false },
  { code: "FR-GES", name: "Grand Est", show: true },
  { code: "FR-HDF", name: "Hauts-de-France", show: true },
  { code: "FR-IDF", name: "Île-de-France", show: true },
  { code: "FR-NOR", name: "Normandie", show: true },
  { code: "FR-NAQ", name: "Nouvelle-Aquitaine", show: true },
  { code: "FR-OCC", name: "Occitanie", show: true },
  { code: "FR-PDL", name: "Pays de la Loire", show: true },
  { code: "FR-PAC", name: "Provence-Alpes-Côte d'Azur", show: true },
  { code: "FR-971", name: "Guadeloupe", show: true },
  { code: "FR-972", name: "Martinique", show: true },
  { code: "FR-973", name: "Guyane", show: true },
  { code: "FR-974", name: "La Réunion", show: true },
  { code: "FR-976", name: "Mayotte", show: true },
];
