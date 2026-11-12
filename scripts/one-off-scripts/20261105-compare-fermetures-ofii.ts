// One-off (lecture seule) : compare les fermetures OFII aux fermetures Bhasile, par code DNA.
//
// Usage: yarn one-off 20261105-compare-fermetures-ofii <clef_s3_du_csv>

import "dotenv/config";

import { currentVersionArgs } from "@/app/api/structure-versions/structure-version.db.type";
import { isStructureClosed } from "@/app/api/structures/structure.util";
import { formatDate, toMonthKey } from "@/app/utils/date.util";
import { createPrismaClient } from "@/prisma-client";

import { loadCsvFromS3 } from "../utils/csv-loader";

const prisma = createPrismaClient();

const COLUMNS = {
  code: "Code centre",
  nom: "Nom du centre",
  date: "Date de fermeture",
  places: "Nombre de places avant fermeture",
} as const;

async function main() {
  const csvKey = process.argv[2];
  if (!csvKey) {
    throw new Error("Merci de fournir la clef S3 du fichier CSV en argument.");
  }
  const bucketName = process.env.DOCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("DOCS_BUCKET_NAME doit être défini.");
  }

  const ofiiFermetures = parseOfiiFermetures(
    await loadCsvFromS3<Record<string, string>>(bucketName, csvKey)
  );
  const now = new Date();
  const bhasileByDna = await loadBhasileStructuresByDna(now);

  const closedInBhasileOnly: Record<string, unknown>[] = [];
  const closedInOfiiOnly: Record<string, unknown>[] = [];
  const unknownInBhasile: Record<string, unknown>[] = [];
  const monthMismatches: Record<string, unknown>[] = [];

  for (const [dnaCode, structure] of bhasileByDna) {
    if (isStructureClosed(structure, now) && !ofiiFermetures.has(dnaCode)) {
      closedInBhasileOnly.push({
        dna: dnaCode,
        ...describeBhasile(structure),
      });
    }
  }

  for (const [dnaCode, ofii] of ofiiFermetures) {
    const structure = bhasileByDna.get(dnaCode);
    if (!structure) {
      unknownInBhasile.push({ dna: dnaCode, ...describeOfii(ofii) });
      continue;
    }
    if (!structure.fermetureDate) {
      closedInOfiiOnly.push({
        dna: dnaCode,
        ...describeOfii(ofii),
        ...describeBhasile(structure),
      });
      continue;
    }
    if (
      toMonthKey(structure.fermetureDate) !== toMonthKey(ofii.fermetureDate)
    ) {
      monthMismatches.push({
        dna: dnaCode,
        ...describeOfii(ofii),
        ...describeBhasile(structure),
      });
    }
  }

  printSection(
    "Fermé dans Bhasile mais absent des fermetures OFII",
    closedInBhasileOnly
  );
  printSection("Fermé à l'OFII mais ouvert dans Bhasile", closedInOfiiOnly);
  printSection(
    "Fermé à l'OFII, code DNA porté par aucune structure Bhasile",
    unknownInBhasile
  );
  printSection("Fermé des deux côtés mais pas le même mois", monthMismatches);

  console.log(
    `✅ ${ofiiFermetures.size} fermeture(s) OFII comparée(s) à ${bhasileByDna.size} code(s) DNA Bhasile.`
  );
}

const parseOfiiFermetures = (
  rows: Record<string, string>[]
): Map<string, OfiiFermeture> => {
  const missingColumns = Object.values(COLUMNS).filter(
    (column) => rows.length > 0 && !(column in rows[0])
  );
  if (missingColumns.length > 0) {
    throw new Error(
      `Colonnes introuvables dans le CSV : ${missingColumns.join(", ")} (colonnes lues : ${Object.keys(rows[0]).join(", ")})`
    );
  }

  const fermetures = new Map<string, OfiiFermeture>();
  for (const [index, row] of rows.entries()) {
    const code = row[COLUMNS.code];
    if (fermetures.has(code)) {
      console.warn(
        `⚠️ Code ${code} en double dans le CSV (ligne ${index + 2})`
      );
    }
    fermetures.set(code, {
      nom: row[COLUMNS.nom],
      fermetureDate: parseFrenchDate(row[COLUMNS.date], code),
      places: row[COLUMNS.places] ? Number(row[COLUMNS.places]) : null,
    });
  }
  return fermetures;
};

const parseFrenchDate = (value: string, code: string): Date => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    throw new Error(`${code} : date de fermeture invalide (${value})`);
  }
  const [, day, month, year] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
};

const loadBhasileStructuresByDna = async (
  now: Date
): Promise<Map<string, BhasileStructure>> => {
  const structures = await prisma.structure.findMany({
    select: {
      codeBhasile: true,
      type: true,
      fermetureDate: true,
      structureVersions: {
        ...currentVersionArgs(now),
        select: {
          nom: true,
          placesAutorisees: true,
          dnaStructures: { select: { dna: { select: { code: true } } } },
        },
      },
    },
  });

  const byDna = new Map<string, BhasileStructure>();
  for (const { structureVersions, ...structure } of structures) {
    const currentVersion = structureVersions[0];
    for (const { dna } of currentVersion?.dnaStructures ?? []) {
      const previous = byDna.get(dna.code);
      if (previous) {
        console.warn(
          `⚠️ DNA ${dna.code} porté par ${previous.codeBhasile} et ${structure.codeBhasile}`
        );
      }
      byDna.set(dna.code, {
        ...structure,
        nom: currentVersion.nom,
        placesAutorisees: currentVersion.placesAutorisees,
      });
    }
  }
  return byDna;
};

const describeOfii = (ofii: OfiiFermeture) => ({
  nomOfii: ofii.nom,
  fermetureOfii: formatDate(ofii.fermetureDate, { timeZone: "UTC" }),
  placesOfii: ofii.places,
});

const describeBhasile = (structure: BhasileStructure) => ({
  codeBhasile: structure.codeBhasile,
  type: structure.type,
  nomBhasile: structure.nom,
  fermetureBhasile: structure.fermetureDate
    ? formatDate(structure.fermetureDate, { timeZone: "UTC" })
    : null,
  placesBhasile: structure.placesAutorisees,
});

const printSection = (title: string, rows: Record<string, unknown>[]) => {
  console.log(`\n=== ${title} : ${rows.length} ===`);
  if (rows.length > 0) {
    console.table(rows);
  }
};

type OfiiFermeture = {
  nom: string;
  fermetureDate: Date;
  places: number | null;
};

type BhasileStructure = {
  codeBhasile: string;
  type: string | null;
  fermetureDate: Date | null;
  nom: string | null;
  placesAutorisees: number | null;
};

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
