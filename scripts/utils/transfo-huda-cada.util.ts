import { TRANSFORMATION_START_YEAR } from "@/constants";
import { TransformationType } from "@/types/transformation.type";

/* Le dernier segment d'un code Bhasile est numérique : on change les O en 0 */
export const normalizeBhasileCode = (raw: string): string | null => {
  const BHASILE_CODE_PATTERN = /BHA[\s-]*([A-Z]{3})[\s-]*([0-9O]{3})(?![0-9O])/;
  const match = raw.toUpperCase().match(BHASILE_CODE_PATTERN);
  if (!match) {
    return null;
  }

  const [, region, numero] = match;
  return `BHA-${region}-${numero.replace(/O/g, "0")}`;
};

const DNA_CODE = /^[A-Z]\d{4}$/;
const DNA_CODE_LIKE = /^[A-Z]\d+$/;

/* Recolle une lettre isolée aux chiffres qui la suivent (« H 0123 », « H 208 »). */
const collapseSpacedCodes = (text: string): string =>
  text.replace(/(^|[^A-Z0-9])([A-Z])\s+(?=\d)/g, "$1$2");

export type DnaCodesParseResult = {
  codes: string[];
  unparsed: string[];
};

/* Les codes DNA arrivent avec des séparateurs libres */
export const normalizeDnaCodes = (raw: string): DnaCodesParseResult => {
  const tokens = collapseSpacedCodes(raw.toUpperCase())
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  const codes = [...new Set(tokens.filter((token) => DNA_CODE.test(token)))];
  const unparsed = [
    ...new Set(
      tokens.filter(
        (token) => !DNA_CODE.test(token) && DNA_CODE_LIKE.test(token)
      )
    ),
  ];

  return { codes, unparsed };
};

/* « 02 - Aisne » → « 02 ». La Corse (2A / 2B) sort du contrôle numérique. */
export const parseDepartement = (raw: string): string | null => {
  const numero = raw.split("-")[0]?.trim().toUpperCase();
  return numero && /^(\d{2,3}|2[AB])$/.test(numero) ? numero : null;
};

export const getDnaCodeDepartement = (code: string): string => code.slice(1, 3);

export const isDnaCodeInDepartement = (
  code: string,
  departement: string | null
): boolean =>
  departement === null ||
  !/^\d{2}$/.test(departement) ||
  getDnaCodeDepartement(code) === departement;

/* Un zéro manquant après la lettre : « H209 » se lit « H0209 ». */
export const padDnaCode = (code: string): string | null =>
  /^[A-Z]\d{3}$/.test(code) ? `${code[0]}0${code.slice(1)}` : null;

export type DnaCodesParse = {
  codes: string[];
  /* Candidats à confirmer contre le référentiel : code brut → code padé */
  padded: Map<string, string>;
  invalid: string[];
};

/* Un code jeté en silence, c'est une structure absente de la transformation. */
export const parseDnaCodes = (
  rawValues: string[],
  departement: string | null
): DnaCodesParse => {
  const parsed = rawValues.map((raw) => normalizeDnaCodes(raw));
  const parsedCodes = [...new Set(parsed.flatMap(({ codes }) => codes))];
  const unparsed = [...new Set(parsed.flatMap(({ unparsed }) => unparsed))];

  const codes: string[] = [];
  const invalid: string[] = [];
  for (const code of parsedCodes) {
    (isDnaCodeInDepartement(code, departement) ? codes : invalid).push(code);
  }

  const padded = new Map<string, string>();
  for (const code of unparsed) {
    const candidate = padDnaCode(code);
    if (
      candidate &&
      !codes.includes(candidate) &&
      isDnaCodeInDepartement(candidate, departement)
    ) {
      padded.set(code, candidate);
    } else {
      invalid.push(code);
    }
  }

  return { codes, padded, invalid };
};

const FRENCH_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** Démarches Numériques renvoie les dates en français (« 01 juillet 2026 »), pas en ISO. */
export const parseFrenchDate = (raw: string): Date | null => {
  const match = raw
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})\s+([a-zéûôà]+)\s+(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const monthIndex = FRENCH_MONTHS.indexOf(month);
  if (monthIndex === -1) {
    return null;
  }

  const date = new Date(Date.UTC(Number(year), monthIndex, Number(day), 12));
  if (date.getUTCDate() !== Number(day)) {
    return null;
  }

  return date;
};

export const isEffectiveDateInScope = (date: Date): boolean =>
  date.getUTCFullYear() >= TRANSFORMATION_START_YEAR;

/* Deux libellés coexistent pour chaque branche : on matche sur le préfixe */
export const parseTransformationType = (
  raw: string
): TransformationType | null => {
  if (raw.startsWith("Extension d'un CADA")) {
    return TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR;
  }
  if (raw.startsWith("Création d'un nouveau CADA")) {
    return TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR;
  }
  return null;
};
