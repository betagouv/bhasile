import { normalizeRegionCode } from "@/app/utils/bhasile.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { StructureType } from "@/generated/prisma/client";
import { ImportError } from "@/types/import.type";
import { normalizeDepartementName } from "@/utils-server/departement-name.server.util";

import { type ActiviteRow, type OfiiReferentialRow } from "./ofii-xlsx.util";

const PREFIXES_TO_REMOVE = [
  "CADA",
  "PRAHDA",
  "HUDA",
  "CPH",
  "CAES",
  "NUITEE HOTELIERE",
  "CENTRE D'ACCUEIL DEMANDEURS D'ASILE",
  "CENTRE D'ACCUEIL POUR DEMANDEURS D'ASILE",
  "ACCUEIL D'URGENCE DES DEMANDEURS D'ASILE",
  "HEBERGEMENT D'URGENCE",
] as const;

const STRUCTURE_TYPES = new Set<string>(Object.values(StructureType));

export const validateOfiiRows = (
  rows: OfiiReferentialRow[],
  { departements, operateurs }: OfiiReferential
): { dnas: OfiiDna[]; errors: ImportError[] } => {
  const { nameToNumero, numeroToRegionCode } =
    buildDepartementMaps(departements);
  const operateurLookup = buildOperateurLookup(operateurs);
  const dnas: OfiiDna[] = [];
  const errors: ImportError[] = [];

  for (const row of rows) {
    const issues: string[] = [];
    const departementName = normalizeDepartementName(row.departement);
    const departementNumero = resolveDepartementNumero(
      departementName,
      nameToNumero
    );
    const type = normalizeStructureType(row.type);
    const operateurLabel = stripAndUpper(row.operateur);
    const operateur = operateurLookup.get(operateurLabel);

    if (!departementNumero) {
      issues.push(`département « ${departementName} » inconnu`);
    } else if (!numeroToRegionCode.get(departementNumero)) {
      issues.push(
        `région introuvable pour le département ${departementNumero}`
      );
    }
    if (!STRUCTURE_TYPES.has(type)) {
      issues.push(`type de structure « ${type} » inconnu`);
    }
    if (!operateurLabel) {
      issues.push("opérateur manquant");
    } else if (!operateur) {
      issues.push(`opérateur « ${operateurLabel} » inconnu de Bhasile`);
    }
    if (!row.nom) {
      issues.push("nom OFII manquant");
    }
    if (!row.directionTerritoriale) {
      issues.push("direction territoriale manquante");
    }

    if (issues.length > 0 || !departementNumero || !operateur) {
      errors.push({ key: row.dnaCode, issues });
      continue;
    }

    dnas.push({
      code: row.dnaCode,
      departementAdministratif: departementNumero,
      directionTerritoriale: row.directionTerritoriale,
      nom: getCleanName(row, type, departementNumero, operateur.name),
      nomOfii: row.nom,
      operateurId: operateur.id,
      type: type as StructureType,
    });
  }

  return { dnas, errors };
};

export const toOfiiActivite = (row: ActiviteRow): OfiiActivite => ({
  dnaCode: row.dnaCode,
  placesAutorisees: row.placesAutorisees ?? undefined,
  desinsectisation: row.desinsectisation ?? undefined,
  remiseEnEtat: row.remiseEnEtat ?? undefined,
  sousOccupation: row.sousOccupation ?? undefined,
  travaux: row.travaux ?? undefined,
  placesIndisponibles: row.placesIndisponibles ?? undefined,
  tauxIndisponibilite: row.tauxIndisponibilite ?? undefined,
  tauxOccupation: row.tauxOccupation ?? undefined,
  placesOccupees: row.placesOccupees ?? undefined,
  tauxBPI: row.tauxBPI ?? undefined,
  presencesInduesBPI: row.presencesInduesBPI ?? undefined,
  tauxDeboutes: row.tauxDeboutes ?? undefined,
  presencesInduesDeboutees: row.presencesInduesDeboutees ?? undefined,
});

export const buildOperateurLookup = (
  operateurs: OperateurRecord[]
): OperateurLookup => {
  const lookup: OperateurLookup = new Map();
  const byOfiiName: OperateurLookup = new Map();

  for (const operateur of operateurs) {
    const entry = { id: operateur.id, name: operateur.name };
    const name = stripAndUpper(operateur.name);

    if (name) {
      lookup.set(name, entry);
    }

    for (const label of operateur.ofiiNames
      .map(stripAndUpper)
      .filter(Boolean)) {
      const existing = byOfiiName.get(label);
      if (existing && existing.id !== operateur.id) {
        throw new DomainError(
          `Le libellé OFII « ${label} » est rattaché à deux opérateurs : ${existing.name} et ${operateur.name}`,
          409
        );
      }
      byOfiiName.set(label, entry);
    }
  }

  for (const [label, entry] of byOfiiName) {
    lookup.set(label, entry);
  }

  return lookup;
};

const stripAndUpper = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const collapseSpaces = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const normalizeStructureType = (value: unknown): string => {
  const type = collapseSpaces(stripAndUpper(value));
  return type === "NUITEE HOTELIERE" ? "NH" : type;
};

const deptCodeFromCode = (code: string | null | undefined): string => {
  if (!code || code.length < 3) {
    return "";
  }
  const two = code.slice(1, 3);
  const three = code.slice(1, 4);
  return parseInt(two, 10) > 96 ? three : two;
};

const resolveDepartementNumero = (
  departementName: string,
  nameToNumero: Map<string, string>
): string | null =>
  departementName
    ? (nameToNumero.get(departementName.trim().toLowerCase()) ?? null)
    : null;

const buildDepartementMaps = (departements: DepartementRecord[]) => {
  const nameToNumero = new Map<string, string>(
    departements.map((departement) => [
      departement.name.trim().toLowerCase(),
      departement.numero,
    ])
  );

  const numeroToRegionCode = new Map<string, string>();
  for (const departement of departements) {
    const regionCode = normalizeRegionCode(
      departement.regionAdministrative?.code
    );
    if (regionCode) {
      numeroToRegionCode.set(departement.numero, regionCode);
    }
  }

  return { nameToNumero, numeroToRegionCode };
};

const getCleanName = (
  row: OfiiReferentialRow,
  type: string,
  departementNumero: string,
  operateurName: string
): string => {
  const operateur = stripAndUpper(operateurName);

  let cleanName = stripAndUpper(row.nom);
  for (const prefix of PREFIXES_TO_REMOVE) {
    cleanName = cleanName.replace(prefix, "");
  }
  cleanName = cleanName.replace(departementNumero, "").replace(operateur, "");

  return collapseSpaces(
    `${type} ${cleanName} ${operateur} - ${deptCodeFromCode(row.dnaCode)}`
  );
};

type OperateurRecord = { id: number; name: string; ofiiNames: string[] };

type OperateurLookup = Map<string, { id: number; name: string }>;

type DepartementRecord = {
  numero: string;
  name: string;
  regionAdministrative: { name: string; code: string } | null;
};

export type OfiiReferential = {
  departements: DepartementRecord[];
  operateurs: OperateurRecord[];
};

export type OfiiDna = {
  code: string;
  departementAdministratif: string;
  directionTerritoriale: string;
  nom: string;
  nomOfii: string;
  operateurId: number;
  type: StructureType;
};

export type OfiiActivite = {
  [Key in keyof ActiviteRow]: Key extends "dnaCode"
    ? string
    : NonNullable<ActiviteRow[Key]> | undefined;
};
