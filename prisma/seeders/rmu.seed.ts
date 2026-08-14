import { fakerFR as faker } from "@faker-js/faker";

import {
  endOfMonthUtcFromMonth,
  endOfPreviousMonthUtc,
  getMonthsBetween,
} from "@/app/utils/date.util";
import { type PrismaClient, type Rmu } from "@/generated/prisma/client";

// Premier mois de collecte en prod ; la collecte arrive après coup, d'où le mois clos.
const RMU_START_MONTH = "2025-06";

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

  const months = getMonthsBetween(
    RMU_START_MONTH,
    endOfPreviousMonthUtc().toISOString()
  );

  const rmus = departements.flatMap(({ numero }) => {
    if (!faker.helpers.maybe(() => true, { probability: 0.3 })) {
      return [];
    }

    return months.map((month) =>
      createFakeRmu(
        numero,
        endOfMonthUtcFromMonth(month.year(), month.month() + 1)
      )
    );
  });

  await prisma.rmu.createMany({ data: rmus });
  console.log(`✅ ${rmus.length} lignes Rmu créées`);
};
