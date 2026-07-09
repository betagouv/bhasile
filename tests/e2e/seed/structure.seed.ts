import { getTypePlacesYearRange, getYearRange } from "@/app/utils/date.util";

import {
  buildStructureSeed,
  StructureSeedInput,
} from "../data/structure.factory";
import { prisma } from "./prisma";

export type SeededStructure = {
  id: number;
  structureVersionId: number;
  codeBhasile: string;
  nom: string;
  type: StructureSeedInput["type"];
  operateurId: number;
};

export const createStructureForTest = async (
  overrides: Partial<StructureSeedInput> = {}
): Promise<SeededStructure> => {
  const input = buildStructureSeed(overrides);
  const effectiveDate = new Date(`${input.creationDate}T12:00:00.000Z`);

  const structure = await prisma.structure.create({
    data: {
      codeBhasile: input.codeBhasile,
      type: input.type,
      operateurId: input.operateurId,
      nom: input.nom,
      adresseAdministrative: input.adresseAdministrative,
      codePostalAdministratif: input.codePostalAdministratif,
      communeAdministrative: input.communeAdministrative,
      departementAdministratif: input.departementAdministratif,
      creationDate: effectiveDate,
      public: input.public,
      dnaStructures: {
        create: input.dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
      structureFinesses: {
        create: [
          {
            finess: {
              connectOrCreate: {
                where: { code: input.finessCode },
                create: { code: input.finessCode },
              },
            },
          },
        ],
      },
    },
  });

  // L'app lit/écrit les champs versionnés via StructureVersion : on crée la
  // version courante que le parcours agent met à jour.
  const structureVersion = await prisma.structureVersion.create({
    data: {
      structureId: structure.id,
      effectiveDate,
      public: input.public,
      nom: input.nom,
      adresseAdministrative: input.adresseAdministrative,
      codePostalAdministratif: input.codePostalAdministratif,
      communeAdministrative: input.communeAdministrative,
      departementAdministratif: input.departementAdministratif,
      creationDate: effectiveDate,
      dnaStructures: {
        create: input.dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
      structureFinesses: {
        create: [
          {
            finess: {
              connectOrCreate: {
                where: { code: input.finessCode },
                create: { code: input.finessCode },
              },
            },
          },
        ],
      },
    },
  });

  return {
    id: structure.id,
    structureVersionId: structureVersion.id,
    codeBhasile: structure.codeBhasile,
    nom: structure.nom ?? input.nom,
    type: input.type,
    operateurId: input.operateurId,
  };
};

const TYPE_PLACES_YEARS = getTypePlacesYearRange().years;
const FINANCE_YEARS = getYearRange().years;

export const seedValidStructureTypologies = async (
  structureVersionId: number
): Promise<void> => {
  await prisma.structureTypologie.createMany({
    data: TYPE_PLACES_YEARS.map((year) => ({
      structureVersionId,
      year,
      placesAutorisees: 10,
      pmr: 0,
      lgbt: 0,
      fvvTeh: 0,
    })),
  });
};

export const seedValidStructureBudgets = async (
  structureId: number
): Promise<void> => {
  await prisma.budget.createMany({
    data: FINANCE_YEARS.map((year) => ({
      structureId,
      year,
      dotationDemandee: 1000,
      dotationAccordee: 1000,
      totalProduitsProposes: 1000,
      totalProduits: 1000,
      totalChargesProposees: 1000,
      totalCharges: 1000,
      repriseEtat: 0,
      affectationReservesFondsDedies: 0,
      excedentRecupere: 0,
      excedentDeduit: 0,
      fondsDedies: 0,
    })),
  });
};

export const seedValidIndicateursFinanciers = async (
  structureId: number
): Promise<void> => {
  await prisma.indicateurFinancier.createMany({
    data: FINANCE_YEARS.map((year) => ({
      structureId,
      year,
      type: "REALISE" as const,
      ETP: 10,
      tauxEncadrement: 1,
      coutJournalier: 50,
    })),
  });
};
