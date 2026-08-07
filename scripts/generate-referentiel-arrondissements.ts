// Génère le référentiel arrondissements / communes dans prisma/data/.
// Croise le COG INSEE (rattachement commune -> arrondissement) et geo.api.gouv.fr
// (codes postaux + populations). À rejouer uniquement pour changer de millésime :
// les fichiers produits sont versionnés et lus par le seeder et le script one-off.
// Usage : yarn referentiel:arrondissements

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { parse } from "csv-parse/sync";

import { normalizeCommuneName } from "@/app/utils/adresse.util";

const COG_MILLESIME = 2025;
// Identifiant du dossier INSEE du millésime : change à chaque publication annuelle.
const COG_FILE_ID = "8377162";
const COG_BASE_URL = `https://www.insee.fr/fr/statistiques/fichier/${COG_FILE_ID}`;
const GEO_API_URL =
  "https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,population,codeDepartement&format=json";

const DATA_DIR = join(process.cwd(), "prisma", "data");

const fetchCog = async <T extends Record<string, string>>(
  filename: string
): Promise<T[]> => {
  const response = await fetch(`${COG_BASE_URL}/${filename}`);
  if (!response.ok) {
    throw new Error(`Téléchargement ${filename} : HTTP ${response.status}`);
  }
  return parse<T>(await response.text(), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
};

const fetchGeoCommunes = async (): Promise<GeoCommune[]> => {
  const response = await fetch(GEO_API_URL);
  if (!response.ok) {
    throw new Error(`Téléchargement geo.api.gouv.fr : HTTP ${response.status}`);
  }
  return response.json();
};

const toCsv = (headers: string[], rows: string[][]): string =>
  [headers, ...rows]
    .map((row) =>
      row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")
    )
    .join("\n")
    .concat("\n");

const generate = async (): Promise<void> => {
  console.log(`➡️ Récupération du référentiel COG ${COG_MILLESIME}...`);
  const [cogArrondissements, cogCommunes, geoCommunes] = await Promise.all([
    fetchCog<CogArrondissement>(`v_arrondissement_${COG_MILLESIME}.csv`),
    fetchCog<CogCommune>(`v_commune_${COG_MILLESIME}.csv`),
    fetchGeoCommunes(),
  ]);

  // Le COG liste aussi les arrondissements municipaux (TYPECOM = ARM) : on ne garde
  // que les communes, dont le rattachement pointe l'arrondissement préfectoral.
  const arrondissementByCommune = new Map(
    cogCommunes
      .filter((commune) => commune.TYPECOM === "COM")
      .map((commune) => [commune.COM, commune.ARR || null])
  );

  const populationByArrondissement = new Map<string, number>();
  const communeRows = geoCommunes
    .map((commune) => {
      const arrondissementCode =
        arrondissementByCommune.get(commune.code) ?? null;
      if (arrondissementCode) {
        populationByArrondissement.set(
          arrondissementCode,
          (populationByArrondissement.get(arrondissementCode) ?? 0) +
            (commune.population ?? 0)
        );
      }
      return [
        commune.code,
        commune.nom,
        normalizeCommuneName(commune.nom),
        (commune.codesPostaux ?? []).join("|"),
        commune.population?.toString() ?? "",
        arrondissementCode ?? "",
      ];
    })
    .sort((left, right) => left[0].localeCompare(right[0]));

  const arrondissementRows = cogArrondissements
    .map((arrondissement) => [
      arrondissement.ARR,
      arrondissement.LIBELLE,
      arrondissement.DEP,
      populationByArrondissement.get(arrondissement.ARR)?.toString() ?? "",
    ])
    .sort((left, right) => left[0].localeCompare(right[0]));

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    join(DATA_DIR, "arrondissements.csv"),
    toCsv(["code", "name", "departementNumero", "population"], arrondissementRows)
  );
  await writeFile(
    join(DATA_DIR, "communes.csv"),
    toCsv(
      [
        "codeInsee",
        "name",
        "nameNormalized",
        "codesPostaux",
        "population",
        "arrondissementCode",
      ],
      communeRows
    )
  );

  const sansArrondissement = communeRows.filter((row) => !row[5]).length;
  console.log(
    `✅ ${arrondissementRows.length} arrondissements et ${communeRows.length} communes écrits (millésime ${COG_MILLESIME}).`
  );
  console.log(
    `ℹ️ ${sansArrondissement} communes sans arrondissement (Mayotte et collectivités d'outre-mer).`
  );
};

await generate();

type CogArrondissement = {
  ARR: string;
  DEP: string;
  LIBELLE: string;
};

type CogCommune = {
  TYPECOM: string;
  COM: string;
  ARR: string;
};

type GeoCommune = {
  code: string;
  nom: string;
  codesPostaux?: string[];
  population?: number;
  codeDepartement: string;
};
