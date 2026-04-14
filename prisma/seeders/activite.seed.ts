import { fakerFR as faker } from "@faker-js/faker";

import { Activite, Prisma } from "@/generated/prisma/client";

export const createFakeActivites = ({
  dnaCode,
}: CreateFakeActivitesArgs): Omit<Activite, "id" | "structureDnaCode">[] => {
  if (!faker.helpers.maybe(() => true, { probability: 0.3 })) {
    return [];
  }

  const count = faker.number.int({ min: 1, max: 12 });
  const startMonth = 12 - count; // 0..11
  const months = Array.from({ length: count }, (_, i) => startMonth + i);

  return months.map((month) =>
    createFakeActivite({ dnaCode, date: new Date(2025, month, 1, 13) })
  );
};

export const createFakeActivite = ({
  dnaCode,
  date,
}: CreateFakeActiviteArgs): Omit<Activite, "id" | "structureDnaCode"> => {
  const placesAutorisees = faker.number.int({ min: 10, max: 200 });
  const desinsectisation = faker.number.int({
    min: 1,
    max: placesAutorisees / 5,
  });
  const remiseEnEtat = faker.number.int({ min: 1, max: placesAutorisees / 5 });
  const sousOccupation = faker.number.int({
    min: 1,
    max: placesAutorisees / 5,
  });
  const travaux = faker.number.int({ min: 1, max: placesAutorisees / 5 });
  const placesIndisponibles =
    desinsectisation + remiseEnEtat + sousOccupation + travaux;

  return {
    dnaCode,
    date,
    desinsectisation,
    placesAutorisees,
    remiseEnEtat,
    sousOccupation,
    travaux,
    placesIndisponibles,
    placesOccupees: faker.number.int({ min: 1, max: 5 }),
    tauxOccupation: new Prisma.Decimal(
      faker.number.float({ min: 0.8, max: 1, fractionDigits: 2 })
    ),
    presencesInduesBPI: faker.number.int({ min: 1, max: 5 }),
    presencesInduesDeboutees: faker.number.int({
      min: 1,
      max: 5,
    }),
  };
};

type CreateFakeActiviteArgs = {
  date: Date;
  dnaCode: string;
};

type CreateFakeActivitesArgs = {
  dnaCode: string;
};
