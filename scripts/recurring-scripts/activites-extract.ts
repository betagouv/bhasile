import "dotenv/config";

import xlsx from "node-xlsx";
import path from "path";
import { parseDate } from "scripts/utils/parse-date";
import { fileURLToPath } from "url";

import { Activite } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

import { ActivitesMetadata, activitesMetadata } from "./activites-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prisma = createPrismaClient();

const getPlacesVacantes = (
  metadata: ActivitesMetadata,
  line: (string | number | Date)[]
): number => {
  const totalPlaces = Number(line[metadata.placesAutoriseesIndex]);
  if (metadata.placesOccupeesIndex) {
    return totalPlaces - Number(line[metadata.placesOccupeesIndex]);
  } else {
    const tauxOccupation = line[metadata.tauxOccupationIndex as number];
    return totalPlaces - Math.floor(totalPlaces * (tauxOccupation as number));
  }
};

const buildStructureIdByDnaCode = async (
  dnaCodes: string[]
): Promise<Map<string, number>> => {
  const uniqueCodes = [...new Set(dnaCodes.filter(Boolean))];
  if (uniqueCodes.length === 0) {
    return new Map();
  }

  const dnas = await prisma.dna.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true, code: true },
  });
  const dnaStructures = await prisma.dnaStructure.findMany({
    where: { dnaId: { in: dnas.map((d) => d.id) } },
    select: { dnaId: true, structureId: true },
  });
  const dnaIdToCode = new Map(dnas.map((d) => [d.id, d.code]));
  const map = new Map<string, number>();
  for (const dnaStructure of dnaStructures) {
    const code = dnaIdToCode.get(dnaStructure.dnaId);
    if (code) {
      map.set(code, dnaStructure.structureId);
    }
  }
  return map;
};

const mapToActivites = (
  sheet: (string | number | Date)[][],
  index: number,
  structureByDnaCode: Map<string, number>
) => {
  const metadata = activitesMetadata[index];
  return sheet.map((line) => {
    const dnaCode = String(line[metadata.dnaIndex]);
    const structureId = structureByDnaCode.get(dnaCode);
    return {
      date: parseDate(metadata.date, "activites-extract"),
      structureDnaCode: null,
      structureId: structureId ?? null,
      dnaCode: dnaCode || null,
      placesAutorisees: Number(line[metadata.placesAutoriseesIndex]) || 0,
      desinsectisation: metadata.desinsectisationIndex
        ? Number(line[metadata.desinsectisationIndex]) || 0
        : 0,
      remiseEnEtat: metadata.remiseEnEtatIndex
        ? Number(line[metadata.remiseEnEtatIndex]) || 0
        : 0,
      sousOccupation: metadata.sousOccupationIndex
        ? Number(line[metadata.sousOccupationIndex]) || 0
        : 0,
      travaux: metadata.travauxIndex
        ? Number(line[metadata.travauxIndex]) || 0
        : 0,
      placesIndisponibles: metadata.placesIndisponiblesIndex
        ? Number(line[metadata.placesIndisponiblesIndex]) || 0
        : 0,
      placesOccupees: metadata.placesOccupeesIndex
        ? Number(line[metadata.placesOccupeesIndex]) || 0
        : 0,
      placesVacantes: getPlacesVacantes(metadata, line) || 0,
      presencesInduesBPI: metadata.presencesInduesBPIIndex
        ? Number(line[metadata.presencesInduesBPIIndex]) || 0
        : 0,
      presencesInduesDeboutees: metadata.presencesInduesDebouteesIndex
        ? Number(line[metadata.presencesInduesDebouteesIndex]) || 0
        : 0,
    };
  });
};

const extractActivitesFromOds = async (): Promise<Omit<Activite, "id">[]> => {
  const sheets = xlsx.parse(`${__dirname}/activites.ods`, {
    cellDates: true,
    blankrows: false,
  });

  const allDnaCodes: string[] = [];
  for (let index = 0; index < sheets.length; index++) {
    const sheetData = [...(sheets[index].data ?? [])];
    sheetData.shift();
    sheetData.shift();
    sheetData.shift();
    const metadata = activitesMetadata[index];
    for (const line of sheetData) {
      const dnaCode = String(line[metadata.dnaIndex]);
      if (dnaCode) {
        allDnaCodes.push(dnaCode);
      }
    }
  }

  const structureByDnaCode = await buildStructureIdByDnaCode(allDnaCodes);

  const allActivites: Omit<Activite, "id">[] = [];
  sheets.forEach((sheet, index) => {
    const sheetData = sheet.data;
    sheetData.shift();
    sheetData.shift();
    sheetData.shift();
    const activites = mapToActivites(sheetData, index, structureByDnaCode);
    activites.forEach((activite) => {
      allActivites.push(activite);
    });
  });

  return allActivites;
};

await prisma.activite.createMany({
  data: await extractActivitesFromOds(),
});
