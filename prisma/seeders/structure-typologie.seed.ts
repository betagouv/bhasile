import { fakerFR as faker } from "@faker-js/faker";

import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { StructureTypologie } from "@/generated/prisma/client";

export const createFakeStructureTypologie = ({
  placesAutorisees,
  year,
}: CreateFakeStructureTypologieOptions): Omit<
  StructureTypologie,
  "id" | "structureDnaCode" | "structureId" | "structureVersionTransformationId"
> => {
  const lgbt = faker.number.int({ min: 0, max: placesAutorisees });

  return {
    year,
    pmr: faker.number.int({ min: 0, max: placesAutorisees }),
    lgbt,
    fvvTeh: faker.number.int({ min: 0, max: placesAutorisees - lgbt }),
    placesAutorisees:
      year < PLACES_VERSIONED_FROM_YEAR ? placesAutorisees : null,
    placesACreer: null,
    placesAFermer: null,
    echeancePlacesACreer: null,
    echeancePlacesAFermer: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

type CreateFakeStructureTypologieOptions = {
  placesAutorisees: number;
  year: number;
};
