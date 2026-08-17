import { fakerFR as faker } from "@faker-js/faker";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";
import { Budget } from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

export const createFakeBudget = ({
  year,
  type,
}: CreateFakeBudgetOptions): Omit<
  Budget,
  "id" | "structureDnaCode" | "structureId"
> => {
  const isAutorisee = isStructureAutorisee(type);
  const isSubventionnee = isStructureSubventionnee(type);

  const isBudgetOpen = isAutorisee
    ? year < AUTORISEE_OPEN_YEAR
    : year <= SUBVENTIONNEE_OPEN_YEAR;

  if (isSubventionnee && !isBudgetOpen) {
    return {
      year,
    } as Budget;
  }

  return {
    year,
    cpomStructureType: type,
    dotationDemandee: faker.number.int({ min: 1, max: 10000 }),
    dotationAccordee: faker.number.int({ min: 1, max: 10000 }),
    totalProduitsProposes: isBudgetOpen
      ? faker.number.int({ min: 1, max: 10000 })
      : null,
    totalProduits: isBudgetOpen
      ? faker.number.int({ min: 1, max: 10000 })
      : null,
    totalCharges: isBudgetOpen
      ? faker.number.int({ min: 1, max: 10000 })
      : null,
    totalChargesProposees: isBudgetOpen
      ? faker.number.int({ min: 1, max: 10000 })
      : null,
    repriseEtat: isBudgetOpen ? faker.number.int({ min: 1, max: 10000 }) : null,
    excedentRecupere: faker.number.int({ min: 1, max: 10000 }) ?? null,
    excedentDeduit: faker.number.int({ min: 1, max: 10000 }) ?? null,
    affectationReservesFondsDedies: isBudgetOpen
      ? faker.number.int({ min: 1, max: 10000 })
      : null,
    reserveInvestissement: faker.number.int({ min: 1, max: 10000 }),
    chargesNonReconductibles: faker.number.int({ min: 1, max: 10000 }),
    reserveCompensationDeficits: faker.number.int({ min: 1, max: 10000 }),
    reserveCompensationBFR: faker.number.int({ min: 1, max: 10000 }),
    reserveCompensationAmortissements: faker.number.int({ min: 1, max: 10000 }),
    fondsDedies: faker.number.int({ min: 1, max: 10000 }),
    reportANouveau: isAutorisee
      ? faker.number.int({ min: 1, max: 10000 })
      : null,
    autre: faker.number.int({ min: 1, max: 10000 }),
    commentaire: faker.lorem.lines(2),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  } as Budget;
};

type CreateFakeBudgetOptions = {
  year: number;
  type: StructureType;
};
