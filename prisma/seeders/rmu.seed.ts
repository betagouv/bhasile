import { fakerFR as faker } from "@faker-js/faker";

import { type PrismaClient, type Rmu } from "@/generated/prisma/client";

type FakeRmu = Omit<Rmu, "id" | "departementNumero"> & {
  departementNumero: string;
};

const createFakeRmu = (departementNumero: string, date: Date): FakeRmu => ({
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

export const createFakeRmus = async (prisma: PrismaClient): Promise<void> => {
  const departements = await prisma.departement.findMany({
    select: { numero: true },
  });

  const rmus = departements.flatMap(({ numero }) => {
    if (!faker.helpers.maybe(() => true, { probability: 0.3 })) {
      return [];
    }

    const startMonth = 5; // seed from june
    const count = 12 - startMonth;
    return Array.from({ length: count }, (_, index) =>
      createFakeRmu(
        numero,
        new Date(Date.UTC(2025, startMonth + index + 1, 0, 12))
      )
    );
  });

  await prisma.rmu.createMany({ data: rmus });
  console.log(`✅ ${rmus.length} lignes Rmu créées`);
};
