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

/** Source de vérité géographique : relation Prisma `Departement.regionId -> Region`
 * (contrairement aux constantes `DEPARTEMENTS`/`REGIONS` qui n'ont qu'un nom de
 * région en texte libre, non fiable pour un regroupement par code). */
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

/** Couvre le cas (théorique) d'une région sans département rattaché. */
export const findAllRegions = async (): Promise<CartographieDbRegion[]> =>
  prisma.region.findMany({ select: { code: true, name: true } });
