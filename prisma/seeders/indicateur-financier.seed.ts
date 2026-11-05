import { fakerFR as faker } from "@faker-js/faker";

import {
  IndicateurFinancier,
  IndicateurFinancierType,
} from "@/generated/prisma/client";

export const createFakeIndicateurFinancier = ({
  year,
  type,
}: CreateFakeIndicateurFinancierOptions): Omit<
  IndicateurFinancier,
  "id" | "structureDnaCode" | "structureId"
> => {
  return {
    year,
    type,
    ETP: faker.number.int({ min: 1, max: 30 }),
    tauxEncadrement: faker.number.float({ min: 1, max: 10, fractionDigits: 2 }),
    coutJournalier: faker.number.int({ min: 1, max: 30 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  } as IndicateurFinancier;
};

type CreateFakeIndicateurFinancierOptions = {
  year: number;
  type: IndicateurFinancierType;
};
