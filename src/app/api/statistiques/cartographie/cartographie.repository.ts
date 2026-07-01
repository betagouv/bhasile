import prisma from "@/lib/prisma";

export type CartographieDbDepartement = {
  numero: string;
  name: string;
  population: number | null;
  regionCode: string | null;
  regionName: string | null;
};

export type CartographieDbRegion = {
  code: string;
  name: string;
};

/** Uses the Prisma Departement/Region relation, not the free-text DEPARTEMENTS/REGIONS constants. */
export const findAllDepartementsWithRegion = async (): Promise<
  CartographieDbDepartement[]
> => {
  const departements = await prisma.departement.findMany({
    select: {
      numero: true,
      name: true,
      population: true,
      regionAdministrative: { select: { code: true, name: true } },
    },
  });

  return departements.map((departement) => ({
    numero: departement.numero,
    name: departement.name,
    population: departement.population,
    regionCode: departement.regionAdministrative?.code ?? null,
    regionName: departement.regionAdministrative?.name ?? null,
  }));
};

/** Covers the theoretical case of a region with no departement attached. */
export const findAllRegions = async (): Promise<CartographieDbRegion[]> =>
  prisma.region.findMany({ select: { code: true, name: true } });
