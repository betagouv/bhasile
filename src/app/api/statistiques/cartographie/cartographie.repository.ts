import prisma from "@/lib/prisma";

import type { CartographieDbDepartement } from "./cartographie.db.type";

export const findAllDepartementsWithRegion = async (): Promise<
  CartographieDbDepartement[]
> => {
  const departements = await prisma.departement.findMany({
    select: {
      id: true,
      numero: true,
      name: true,
      regionAdministrative: { select: { code: true, name: true } },
    },
  });

  return departements.map((departement) => ({
    id: departement.id,
    numero: departement.numero,
    name: departement.name,
    regionCode: departement.regionAdministrative?.code ?? null,
    regionName: departement.regionAdministrative?.name ?? null,
  }));
};
