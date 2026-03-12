import { DEPARTEMENTS, REGIONS } from "@/constants";
import { type Departement, type PrismaClient } from "@/generated/prisma/client";

const createDepartements = (): Pick<
  Departement,
  "numero" | "name" | "region"
>[] => {
  return DEPARTEMENTS.map((department) => ({
    numero: department.numero,
    name: department.name,
    region: department.region,
  }));
};

export const seedRegionsAndDepartements = async (
  prisma: PrismaClient
): Promise<void> => {
  await prisma.region.createMany({
    data: REGIONS.map((region) => ({ name: region.name, code: region.code })),
  });

  const regions = await prisma.region.findMany();

  const departementsToInsert = createDepartements();
  await prisma.departement.createMany({
    data: departementsToInsert,
  });

  for (const region of regions) {
    await prisma.departement.updateMany({
      where: { region: region.name },
      data: { regionId: region.id },
    });
  }

  console.log(`🌍 Départements et régions créés`);
};
