import prisma from "@/lib/prisma";

export type CartographieDbDepartement = {
  numero: string;
  name: string;
  regionCode: string | null;
  regionName: string | null;
};

export const findAllDepartementsWithRegion = async (): Promise<
  CartographieDbDepartement[]
> => {
  const departements = await prisma.departement.findMany({
    select: {
      numero: true,
      name: true,
      regionAdministrative: { select: { code: true, name: true } },
    },
  });

  return departements.map((departement) => ({
    numero: departement.numero,
    name: departement.name,
    regionCode: departement.regionAdministrative?.code ?? null,
    regionName: departement.regionAdministrative?.name ?? null,
  }));
};
