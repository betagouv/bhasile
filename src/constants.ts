import { LatLngTuple } from "leaflet";

import { Departement } from "./types/departement.type";

// Center of France https://fr.wikipedia.org/wiki/Centre_de_la_France
export const FRANCE_CENTER: LatLngTuple = [46.6055983, 1.8750922];
export const DEFAULT_MAP_ZOOM = 6;

export const DEFAULT_PAGE_SIZE = 20;

// Cookie expiration times
export const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export const FILE_UPLOAD_EXPIRATION_DELAY = 60 * 60; // 1 hour

export const CURRENT_YEAR = 2025;
export const CURRENT_OPEN_YEAR = 2025;

export const AUTORISEE_OPEN_YEAR = 2025;
export const SUBVENTIONNEE_OPEN_YEAR = 2024;

export const SPREADSHEET_MIME_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
  "text/csv",
];
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  ...SPREADSHEET_MIME_TYPES,
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export const MODELE_DIFFUS_LINK = "/adresses-diffus.xlsx";
export const MODELE_MIXTE_LINK = "/adresses-mixte.xlsx";

export const PLACE_ASILE_CONTACT_EMAIL = "contact@placedasile.beta.gouv.fr";

export const PLACE_ASILE_PHONE_NUMBERS = "07 86 38 96 85 ou au 06 86 44 20 93";

export const DEPARTEMENTS: Departement[] = [
  {
    numero: "01",
    name: "Ain",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "02",
    name: "Aisne",
    region: "Hauts-de-France",
  },
  {
    numero: "03",
    name: "Allier",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "04",
    name: "Alpes-de-Haute-Provence",
    region: "Provence-Alpes-Côte d'Azur",
  },
  {
    numero: "05",
    name: "Hautes-Alpes",
    region: "Provence-Alpes-Côte d'Azur",
  },
  {
    numero: "06",
    name: "Alpes-Maritimes",
    region: "Provence-Alpes-Côte d'Azur",
  },
  {
    numero: "07",
    name: "Ardèche",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "08",
    name: "Ardennes",
    region: "Grand Est",
  },
  {
    numero: "09",
    name: "Ariège",
    region: "Occitanie",
  },
  {
    numero: "10",
    name: "Aube",
    region: "Grand Est",
  },
  {
    numero: "11",
    name: "Aude",
    region: "Occitanie",
  },
  {
    numero: "12",
    name: "Aveyron",
    region: "Occitanie",
  },
  {
    numero: "13",
    name: "Bouches-du-Rhône",
    region: "Provence-Alpes-Côte d'Azur",
  },
  {
    numero: "14",
    name: "Calvados",
    region: "Normandie",
  },
  {
    numero: "15",
    name: "Cantal",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "16",
    name: "Charente",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "17",
    name: "Charente-Maritime",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "18",
    name: "Cher",
    region: "Centre-Val de Loire",
  },
  {
    numero: "19",
    name: "Corrèze",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "21",
    name: "Côte-d'Or",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "22",
    name: "Côtes-d'Armor",
    region: "Bretagne",
  },
  {
    numero: "23",
    name: "Creuse",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "24",
    name: "Dordogne",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "25",
    name: "Doubs",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "26",
    name: "Drôme",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "27",
    name: "Eure",
    region: "Normandie",
  },
  {
    numero: "28",
    name: "Eure-et-Loir",
    region: "Centre-Val de Loire",
  },
  {
    numero: "29",
    name: "Finistère",
    region: "Bretagne",
  },
  {
    numero: "2A",
    name: "Corse-du-Sud",
    region: "Corse",
  },
  {
    numero: "2B",
    name: "Haute-Corse",
    region: "Corse",
  },
  {
    numero: "20",
    name: "Corse",
    region: "Corse",
  },
  {
    numero: "30",
    name: "Gard",
    region: "Occitanie",
  },
  {
    numero: "31",
    name: "Haute-Garonne",
    region: "Occitanie",
  },
  {
    numero: "32",
    name: "Gers",
    region: "Occitanie",
  },
  {
    numero: "33",
    name: "Gironde",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "34",
    name: "Hérault",
    region: "Occitanie",
  },
  {
    numero: "35",
    name: "Ille-et-Vilaine",
    region: "Bretagne",
  },
  {
    numero: "36",
    name: "Indre",
    region: "Centre-Val de Loire",
  },
  {
    numero: "37",
    name: "Indre-et-Loire",
    region: "Centre-Val de Loire",
  },
  {
    numero: "38",
    name: "Isère",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "39",
    name: "Jura",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "40",
    name: "Landes",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "41",
    name: "Loir-et-Cher",
    region: "Centre-Val de Loire",
  },
  {
    numero: "42",
    name: "Loire",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "43",
    name: "Haute-Loire",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "44",
    name: "Loire-Atlantique",
    region: "Pays de la Loire",
  },
  {
    numero: "45",
    name: "Loiret",
    region: "Centre-Val de Loire",
  },
  {
    numero: "46",
    name: "Lot",
    region: "Occitanie",
  },
  {
    numero: "47",
    name: "Lot-et-Garonne",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "48",
    name: "Lozère",
    region: "Occitanie",
  },
  {
    numero: "49",
    name: "Maine-et-Loire",
    region: "Pays de la Loire",
  },
  {
    numero: "50",
    name: "Manche",
    region: "Normandie",
  },
  {
    numero: "51",
    name: "Marne",
    region: "Grand Est",
  },
  {
    numero: "52",
    name: "Haute-Marne",
    region: "Grand Est",
  },
  {
    numero: "53",
    name: "Mayenne",
    region: "Pays de la Loire",
  },
  {
    numero: "54",
    name: "Meurthe-et-Moselle",
    region: "Grand Est",
  },
  {
    numero: "55",
    name: "Meuse",
    region: "Grand Est",
  },
  {
    numero: "56",
    name: "Morbihan",
    region: "Bretagne",
  },
  {
    numero: "57",
    name: "Moselle",
    region: "Grand Est",
  },
  {
    numero: "58",
    name: "Nièvre",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "59",
    name: "Nord",
    region: "Hauts-de-France",
  },
  {
    numero: "60",
    name: "Oise",
    region: "Hauts-de-France",
  },
  {
    numero: "61",
    name: "Orne",
    region: "Normandie",
  },
  {
    numero: "62",
    name: "Pas-de-Calais",
    region: "Hauts-de-France",
  },
  {
    numero: "63",
    name: "Puy-de-Dôme",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "64",
    name: "Pyrénées-Atlantiques",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "65",
    name: "Hautes-Pyrénées",
    region: "Occitanie",
  },
  {
    numero: "66",
    name: "Pyrénées-Orientales",
    region: "Occitanie",
  },
  {
    numero: "67",
    name: "Bas-Rhin",
    region: "Grand Est",
  },
  {
    numero: "68",
    name: "Haut-Rhin",
    region: "Grand Est",
  },
  {
    numero: "69",
    name: "Rhône",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "70",
    name: "Haute-Saône",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "71",
    name: "Saône-et-Loire",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "72",
    name: "Sarthe",
    region: "Pays de la Loire",
  },
  {
    numero: "73",
    name: "Savoie",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "74",
    name: "Haute-Savoie",
    region: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "75",
    name: "Paris",
    region: "Île-de-France",
  },
  {
    numero: "76",
    name: "Seine-Maritime",
    region: "Normandie",
  },
  {
    numero: "77",
    name: "Seine-et-Marne",
    region: "Île-de-France",
  },
  {
    numero: "78",
    name: "Yvelines",
    region: "Île-de-France",
  },
  {
    numero: "79",
    name: "Deux-Sèvres",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "80",
    name: "Somme",
    region: "Hauts-de-France",
  },
  {
    numero: "81",
    name: "Tarn",
    region: "Occitanie",
  },
  {
    numero: "82",
    name: "Tarn-et-Garonne",
    region: "Occitanie",
  },
  {
    numero: "83",
    name: "Var",
    region: "Provence-Alpes-Côte d'Azur",
  },
  {
    numero: "84",
    name: "Vaucluse",
    region: "Provence-Alpes-Côte d'Azur",
  },
  {
    numero: "85",
    name: "Vendée",
    region: "Pays de la Loire",
  },
  {
    numero: "86",
    name: "Vienne",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "87",
    name: "Haute-Vienne",
    region: "Nouvelle-Aquitaine",
  },
  {
    numero: "88",
    name: "Vosges",
    region: "Grand Est",
  },
  {
    numero: "89",
    name: "Yonne",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "90",
    name: "Territoire de Belfort",
    region: "Bourgogne-Franche-Comté",
  },
  {
    numero: "91",
    name: "Essonne",
    region: "Île-de-France",
  },
  {
    numero: "92",
    name: "Hauts-de-Seine",
    region: "Île-de-France",
  },
  {
    numero: "93",
    name: "Seine-Saint-Denis",
    region: "Île-de-France",
  },
  {
    numero: "94",
    name: "Val-de-Marne",
    region: "Île-de-France",
  },
  {
    numero: "95",
    name: "Val-d'Oise",
    region: "Île-de-France",
  },
  {
    numero: "971",
    name: "Guadeloupe",
    region: "Guadeloupe",
  },
  {
    numero: "972",
    name: "Martinique",
    region: "Martinique",
  },
  {
    numero: "973",
    name: "Guyane",
    region: "Guyane",
  },
  {
    numero: "974",
    name: "La Réunion",
    region: "La Réunion",
  },
  {
    numero: "976",
    name: "Mayotte",
    region: "Mayotte",
  },
];
