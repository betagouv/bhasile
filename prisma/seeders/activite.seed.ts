import { fakerFR as faker } from "@faker-js/faker";

import {
  endOfMonthUtcFromMonth,
  endOfPreviousMonthUtc,
  getMonthsBetween,
} from "@/app/utils/date.util";
import { Activite, Prisma } from "@/generated/prisma/client";

// Premier mois de collecte en prod ; la collecte arrive après coup, d'où le mois clos.
const ACTIVITE_START_MONTH = "2025-01";

export const createFakeActivites = ({
  dnaCode,
}: CreateFakeActivitesArgs): Omit<Activite, "id" | "structureDnaCode">[] => {
  if (!faker.helpers.maybe(() => true, { probability: 0.3 })) {
    return [];
  }

  const months = getMonthsBetween(
    ACTIVITE_START_MONTH,
    endOfPreviousMonthUtc().toISOString()
  );
  // Toutes les structures ne remontent pas depuis le début : fenêtre tirée au sort.
  const count = faker.number.int({ min: 1, max: months.length });

  return months.slice(-count).map((month) =>
    createFakeActivite({
      dnaCode,
      date: endOfMonthUtcFromMonth(month.year(), month.month() + 1),
    })
  );
};

const createFakeActivite = ({
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
    tauxIndisponibilite: new Prisma.Decimal(
      faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 2 })
    ),
    tauxBPI: new Prisma.Decimal(
      faker.number.float({ min: 0, max: 0.1, fractionDigits: 2 })
    ),
    tauxDeboutes: new Prisma.Decimal(
      faker.number.float({ min: 0, max: 0.1, fractionDigits: 2 })
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
