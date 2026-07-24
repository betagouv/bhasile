import { CpomGranularity } from "@/types/cpom.type";

import { buildCpomSeed, CpomSeedInput } from "../data/cpom.factory";
import { prisma } from "./prisma";

export type SeededCpom = {
  id: number;
  name: string;
  granularity: CpomGranularity;
  operateurId: number;
  departementIds: number[];
  regionId: number | null;
};

export const createCpomForTest = async (
  overrides: Partial<CpomSeedInput> = {}
): Promise<SeededCpom> => {
  const input = buildCpomSeed(overrides);

  let regionId = input.regionId;
  if (regionId === undefined) {
    const region = await prisma.region.findFirst({
      where: { name: "Île-de-France" },
      select: { id: true },
    });
    regionId = region?.id ?? undefined;
  }

  const departementNumeros =
    input.departementNumeros ?? (regionId ? ["75"] : []);

  const departementIds = departementNumeros.length
    ? (
        await prisma.departement.findMany({
          where: { numero: { in: departementNumeros } },
          select: { id: true },
        })
      ).map((d) => d.id)
    : [];

  const cpom = await prisma.cpom.create({
    data: {
      name: input.name,
      granularity: input.granularity,
      operateurId: input.operateurId,
      regionId,
      departements: departementIds.length
        ? {
            createMany: {
              data: departementIds.map((departementId) => ({ departementId })),
            },
          }
        : undefined,
      actesAdministratifs: input.acteConvention
        ? {
            create: [
              {
                category: "CONVENTION_CPOM",
                startDate: new Date(
                  `${input.acteConvention.startDate}T12:00:00.000Z`
                ),
                endDate: new Date(
                  `${input.acteConvention.endDate}T12:00:00.000Z`
                ),
              },
            ],
          }
        : undefined,
    },
  });

  return {
    id: cpom.id,
    name: cpom.name ?? input.name,
    granularity: cpom.granularity,
    operateurId: cpom.operateurId,
    departementIds,
    regionId: cpom.regionId,
  };
};

export const attachStructureToCpom = async (
  cpomId: number,
  structureId: number
): Promise<void> => {
  await prisma.cpomStructure.create({
    data: { cpomId, structureId },
  });
};
