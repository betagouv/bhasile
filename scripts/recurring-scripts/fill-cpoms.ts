// Fill Cpom table, link with structures and create associated structure millesimes with csv from s3 bucket
// Usage: yarn script fill-cpoms my_cpom_file.csv
// An example of the csv file is available at /public/cpom_example.csv

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import { loadCsvFromS3 } from "../utils/csv-loader";
import { ensureOperateursExist } from "../utils/ensure-operateurs-exist";
import { parseDate, parseYear } from "../utils/parse-date";

const prisma = createPrismaClient();
const bucketName = process.env.DOCS_BUCKET_NAME!;
const args = process.argv.slice(2);
const csvFilename = args[0];

if (!csvFilename) {
  throw new Error(
    "Merci de fournir le nom du fichier CSV en argument du script."
  );
}

type CpomCsvRow = {
  cpom: string;
  departement: string;
  code_dna: string;
  typologie?: string;
  operateur?: string;
  date_debut: string;
  date_fin: string;
  date_entree_structure?: string;
  date_sortie_structure?: string;
};

const buildStructureMillesimeYears = (start: number, end: number): number[] => {
  const years: number[] = [];
  for (let year = start; year <= end; year++) {
    years.push(year);
  }
  return years;
};

const loadCpomsFromCsv = async () => {
  try {
    const records = await loadCsvFromS3<CpomCsvRow>(bucketName, csvFilename);

    if (records.length === 0) {
      return;
    }

    // Ensure no operator is missing
    console.log("Résolution des IDs des opérateurs...");
    const operateurMap = await ensureOperateursExist(
      prisma,
      records,
      "operateur"
    );

    // Get all necessary structures
    const dnaCodes = [...new Set(records.map((r) => r.code_dna))];
    const structures = await prisma.structure.findMany({
      where: { dnaCode: { in: dnaCodes } },
      select: { id: true, dnaCode: true },
    });
    const structureMap = new Map(structures.map((s) => [s.dnaCode, s.id]));

    // Group CPOMs by name + dates + operator
    const cpomMap = new Map<
      string,
      {
        name: string;
        dateStart: Date;
        dateEnd: Date;
        operateurId: number;
      }
    >();
    const cpomCache = new Map<string, number>();

    for (const row of records) {
      if (!row.cpom || !row.date_debut || !row.date_fin) {
        continue;
      }

      if (!row.operateur) {
        console.log(
          `❌ Ligne ignorée, opérateur manquant pour le CPOM: cpom=${row.cpom}, departement=${row.departement}`
        );
        continue;
      }

      const operateurId = operateurMap.get(row.operateur)!;
      const dateStart = parseDate(row.date_debut.trim(), `date_debut`);
      const dateEnd = parseDate(row.date_fin.trim(), `date_fin`);
      const yearStart = dateStart.getFullYear();
      const yearEnd = dateEnd.getFullYear();
      const key = `${row.cpom} - ${yearStart} - ${yearEnd} - ${operateurId}`;

      if (!cpomMap.has(key)) {
        cpomMap.set(key, {
          name: row.cpom,
          dateStart,
          dateEnd,
          operateurId,
        });
      }
    }

    // Créer ou récupérer les CPOMs
    console.log(`🍎 Création de ${cpomMap.size} CPOM(s)...`);
    for (const [key, cpomData] of cpomMap.entries()) {
      let cpom = await prisma.cpom.findFirst({
        where: {
          name: cpomData.name,
          operateurId: cpomData.operateurId,
          actesAdministratifs: {
            some: {
              startDate: cpomData.dateStart,
              endDate: cpomData.dateEnd,
            },
          },
        },
        select: { id: true },
      });

      if (!cpom) {
        const createdCpom = await prisma.cpom.create({
          data: {
            name: cpomData.name,
            operateurId: cpomData.operateurId,
          },
        });

        await prisma.acteAdministratif.create({
          data: {
            cpomId: createdCpom.id,
            startDate: cpomData.dateStart,
            endDate: cpomData.dateEnd,
          },
        });

        cpom = { id: createdCpom.id };
        console.log(`✅ CPOM créé "${cpomData.name}"`);
      }

      cpomCache.set(key, cpom.id);
    }

    // Create CPOM/Structure links
    console.log("🔗 Création des liens CPOM/Structure...");

    for (const row of records) {
      if (!row.cpom || !row.code_dna || !row.date_debut || !row.date_fin) {
        console.log(
          `❌ Ligne ignorée, champs manquants : cpom=${row.cpom}, code_dna=${row.code_dna}, date_debut=${row.date_debut}, date_fin=${row.date_fin}`
        );
        continue;
      }

      const structureId = structureMap.get(row.code_dna);
      if (!structureId) {
        console.log(
          `❌ Ligne ignorée, structure non trouvée: cpom=${row.cpom}, code_dna=${row.code_dna}, date_debut=${row.date_debut}, date_fin=${row.date_fin}`
        );
        continue;
      }

      if (!row.operateur) {
        console.log(
          `❌ Ligne ignorée, opérateur manquant pour le CPOM: cpom=${row.cpom}, code_dna=${row.code_dna}`
        );
        continue;
      }

      const operateurId = operateurMap.get(row.operateur)!;
      const yearStart = parseYear(row.date_debut.trim(), `date_debut`);
      const yearEnd = parseYear(row.date_fin.trim(), `date_fin`);
      const cpomKey = `${row.cpom} - ${yearStart} - ${yearEnd} - ${operateurId}`;
      const cpomId = cpomCache.get(cpomKey);

      if (!cpomId) {
        console.log(
          `❌ Ligne ignorée, CPOM non trouvé: cpom=${row.cpom}, code_dna=${row.code_dna}, date_debut=${row.date_debut}, date_fin=${row.date_fin}`
        );
        continue;
      }

      const dateStartStructure = row.date_entree_structure?.trim()
        ? parseDate(row.date_entree_structure.trim(), `date_entree_structure`)
        : null;
      const dateEndStructure = row.date_sortie_structure?.trim()
        ? parseDate(row.date_sortie_structure.trim(), `date_sortie_structure`)
        : null;
      const yearStartStructure = dateStartStructure?.getFullYear() ?? null;
      const yearEndStructure = dateEndStructure?.getFullYear() ?? null;

      const cpomStructure = await prisma.cpomStructure.upsert({
        where: {
          cpomId_structureId: {
            cpomId,
            structureId,
          },
        },
        update: {
          dateStart: dateStartStructure,
          dateEnd: dateEndStructure,
        },
        create: {
          cpomId,
          structureId,
          dateStart: dateStartStructure,
          dateEnd: dateEndStructure,
        },
      });

      // Create millesimes for the structure
      console.log(
        `🍷 Création des millesimes pour la structure ${row.code_dna}`
      );

      const millesimeStart =
        yearStartStructure ??
        cpomStructure.dateStart?.getFullYear() ??
        yearStart;
      const millesimeEnd =
        yearEndStructure ?? cpomStructure.dateEnd?.getFullYear() ?? yearEnd;
      const millesimeYears = buildStructureMillesimeYears(
        millesimeStart,
        millesimeEnd
      );

      for (const millesimeYear of millesimeYears) {
        await prisma.structureMillesime.upsert({
          where: {
            structureDnaCode_year: {
              structureDnaCode: row.code_dna,
              year: millesimeYear,
            },
          },
          update: {
            cpom: true,
          },
          create: {
            structureDnaCode: row.code_dna,
            year: millesimeYear,
            cpom: true,
          },
        });
      }
    }
  } catch (error) {
    throw new Error("❌ Erreur lors du chargement des données: " + error);
  } finally {
    await prisma.$disconnect();
  }
};

loadCpomsFromCsv();
