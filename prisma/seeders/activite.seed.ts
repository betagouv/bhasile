import { fakerFR as faker } from "@faker-js/faker";

import { Activite } from "@/generated/prisma/client";

export const createFakeActivites = (): Omit<
  Activite,
  "id" | "structureDnaCode"
>[] => {
  return Array.from(Array(12).keys()).map((month) =>
    createFakeActivite({
      date: new Date(2025, month, 1, 13),
    })
  );
};

export const createFakeActivite = ({
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
    date,
    dnaCode: null,
    desinsectisation,
    placesAutorisees,
    remiseEnEtat,
    sousOccupation,
    travaux,
    placesIndisponibles,
    placesOccupees: faker.number.int({ min: 1, max: 5 }),
    placesVacantes: faker.number.int({ min: 1, max: 5 }),
    presencesInduesBPI: faker.number.int({ min: 1, max: 5 }),
    presencesInduesDeboutees: faker.number.int({
      min: 1,
      max: 5,
    }),
  };
};

type CreateFakeActiviteArgs = { date: Date };
