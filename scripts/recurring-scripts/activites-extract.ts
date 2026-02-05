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

const mapToActivites = (sheet: (string | number | Date)[][], index: number) => {
  const metadata = activitesMetadata[index];
  // TODO : identifier l'origine des NaN
  return sheet.map((line) => ({
    date: parseDate(metadata.date, "activites-extract"),
    structureDnaCode: String(line[metadata.dnaIndex]),
    dnaCode: String(line[metadata.dnaIndex]),
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
  }));
};

const extractActivitesFromOds = (): Omit<Activite, "id">[] => {
  const sheets = xlsx.parse(`${__dirname}/activites.ods`, {
    cellDates: true,
    blankrows: false,
  });

  const allActivites: Omit<Activite, "id">[] = [];
  sheets.forEach((sheet, index) => {
    const sheetData = sheet.data;
    sheetData.shift();
    sheetData.shift();
    sheetData.shift();
    const activites = mapToActivites(sheetData, index);
    activites.forEach((activite) => {
      allActivites.push(activite);
    });
  });

  return allActivites;
};

await prisma.activite.createMany({
  data: extractActivitesFromOds(),
});
