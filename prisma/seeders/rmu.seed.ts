import { fakerFR as faker } from "@faker-js/faker";

import { type PrismaClient, type Rmu } from "@/generated/prisma/client";

type FakeRmu = Omit<Rmu, "id" | "departementNumero"> & {
  departementNumero: string;
};

const createFakeRmu = (
  departementNumero: string,
  date: Date
): FakeRmu => ({
  departementNumero,
  date,
  deboutesSansMesureAdministrative: faker.number.int({
    min: 0,
    max: 40,
  }),
  misesEnDemeure: faker.number.int({ min: 0, max: 5 }),
  referesEngages: faker.number.int({ min: 0, max: 5 }),
  referesExecutes: faker.number.int({ min: 0, max: 5 }),
});

/**
 * Crée des données RMU factices pour un sous-ensemble de départements, sur quelques mois de 2025.
 */
export const createFakeRmus = async (prisma: PrismaClient): Promise<void> => {
  const departements = await prisma.departement.findMany({
    select: { numero: true },
  });

  const rmus = departements.flatMap(({ numero }) => {
    if (!faker.helpers.maybe(() => true, { probability: 0.3 })) {
      return [];
    }

    const count = faker.number.int({ min: 1, max: 12 });
    const startMonth = 12 - count; // 0..11
    return Array.from({ length: count }, (_, index) =>
      createFakeRmu(numero, new Date(2025, startMonth + index, 1, 13))
    );
  });

  await prisma.rmu.createMany({ data: rmus });
  console.log(`✅ ${rmus.length} lignes Rmu créées`);
};
