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
