import { fakerFR as faker } from "@faker-js/faker";

import { Adresse, Repartition } from "@/generated/prisma/client";

// Écart places à l'adrresse x places autorisées : au-delà de 10 % -> anomalie
const PLACES_GAP_RATIO = 0.2;
// Quelques adresses non localisées alimentent l'anomalie ADRESSE_NON_LOCALISEE
const NON_LOCALISEE_RATIO = 0.05;

// Points `municipality` renvoyés par la BAN, identiques à ce que produirait le géocodage à l'enregistrement
const LOCALISATIONS: Pick<
  Adresse,
  | "codePostal"
  | "commune"
  | "communeNom"
  | "communeLatitude"
  | "communeLongitude"
>[] = [
  // Ville à plusieurs codes postaux : un seul centre
  {
    codePostal: "75011",
    commune: "Paris",
    communeNom: "Paris",
    communeLatitude: 48.859,
    communeLongitude: 2.347,
  },
  {
    codePostal: "69003",
    commune: "Lyon",
    communeNom: "Lyon",
    communeLatitude: 45.758,
    communeLongitude: 4.835,
  },
  // Code postal partagé par deux communes, et variante d'écriture de la même commune
  {
    codePostal: "50000",
    commune: "Saint-Lô",
    communeNom: "Saint-Lô",
    communeLatitude: 49.113843,
    communeLongitude: -1.080182,
  },
  {
    codePostal: "50000",
    commune: "ST LO",
    communeNom: "Saint-Lô",
    communeLatitude: 49.113843,
    communeLongitude: -1.080182,
  },
  {
    codePostal: "50000",
    commune: "Baudre",
    communeNom: "Baudre",
    communeLatitude: 49.089822,
    communeLongitude: -1.06874,
  },
  // Ancien nom d'une commune fusionnée
  {
    codePostal: "50100",
    commune: "Cherbourg-en-Cotentin",
    communeNom: "Cherbourg-en-Cotentin",
    communeLatitude: 49.628684,
    communeLongitude: -1.63324,
  },
  {
    codePostal: "50130",
    commune: "Cherbourg-Octeville",
    communeNom: "Cherbourg-en-Cotentin",
    communeLatitude: 49.628684,
    communeLongitude: -1.63324,
  },
];

export const createFakeAdresses = ({
  placesAutorisees,
}: CreateFakeAdressesArgs): Omit<
  Adresse,
  "id" | "structureDnaCode" | "structureId" | "structureVersionTransformationId"
>[] => {
  const totalPlaces = Math.max(
    1,
    Math.round(
      placesAutorisees *
        faker.number.float({
          min: 1 - PLACES_GAP_RATIO,
          max: 1 + PLACES_GAP_RATIO,
        })
    )
  );
  const count = Math.min(faker.number.int({ min: 1, max: 10 }), totalPlaces);
  const hasCollectif = faker.datatype.boolean();
  const collectifIndex = hasCollectif
    ? faker.number.int({ min: 0, max: count - 1 })
    : -1;
  const placesPerAdresse = splitPlaces(totalPlaces, count);

  return Array.from({ length: count }, (_, index) =>
    createFakeAdresse({
      placesAutorisees: placesPerAdresse[index],
      repartition:
        index === collectifIndex ? Repartition.COLLECTIF : Repartition.DIFFUS,
    })
  );
};

// Répartit le total entre les adresses.
const splitPlaces = (total: number, count: number): number[] => {
  const places: number[] = [];
  let left = total;

  for (let index = 0; index < count - 1; index++) {
    const reservedForNext = count - index - 1;
    const share = faker.number.int({
      min: 1,
      max: Math.max(1, left - reservedForNext),
    });
    places.push(share);
    left -= share;
  }
  places.push(left);

  return places;
};

const createFakeAdresse = ({
  placesAutorisees,
  repartition,
}: CreateFakeAdresseArgs): Omit<
  Adresse,
  "id" | "structureDnaCode" | "structureId" | "structureVersionTransformationId"
> => ({
  adresse: faker.location.streetAddress(),
  ...(faker.datatype.boolean({ probability: NON_LOCALISEE_RATIO })
    ? {
        codePostal: faker.location.zipCode(),
        commune: faker.location.city(),
        communeNom: null,
        communeLatitude: null,
        communeLongitude: null,
      }
    : faker.helpers.arrayElement(LOCALISATIONS)),
  repartition,
  placesAutorisees,
  isQpv: faker.datatype.boolean(),
  isLogementSocial: faker.datatype.boolean(),
  structureVersionId: null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
});

type CreateFakeAdressesArgs = {
  placesAutorisees: number;
};

type CreateFakeAdresseArgs = {
  placesAutorisees: number;
  repartition: Repartition;
};
