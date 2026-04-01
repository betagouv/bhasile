import { DEPARTEMENTS, REGIONS } from "@/constants";
import { type Departement, type PrismaClient } from "@/generated/prisma/client";

const createDepartements = (): Pick<
  Departement,
  "numero" | "name"
>[] => {
  return DEPARTEMENTS.map((department) => ({
    numero: department.numero,
    name: department.name,
  }));
};

export const seedRegionsAndDepartements = async (
  prisma: PrismaClient
): Promise<void> => {
  await prisma.region.createMany({
    data: REGIONS.map((region) => ({ name: region.name, code: region.code })),
  });

  const regions = await prisma.region.findMany();
  const regionNameToId = new Map(regions.map((region) => [region.name, region.id]));

  const departementsToInsert = createDepartements().map((departement) => ({
    ...departement,
    regionId: regionNameToId.get(
      DEPARTEMENTS.find((d) => d.numero === departement.numero)?.region ?? ""
    ),
  }));
  await prisma.departement.createMany({
    data: departementsToInsert,
  });

  console.log(`🌍 Départements et régions créés`);
};
