import { Prisma, Repartition, StructureType } from "@/generated/prisma/client";
import { StructureColumn } from "@/types/ListColumn";

import { convertToRepartition } from "../adresses/adresse.util";
import { getLatestPlacesAutoriseesPerStructure } from "./structure.repository";

export type StructureWithFileUploadsAndActivites = Prisma.StructureGetPayload<{
  include: { fileUploads: true; activites: true };
}>;

export const addPresencesIndues = (
  structure: StructureWithFileUploadsAndActivites
) => {
  const activitesWithPresencesIndues = structure.activites.map((activite) => {
    const presencesIndues =
      (activite?.presencesInduesBPI || 0) +
      (activite?.presencesInduesDeboutees || 0);
    return {
      ...activite,
      presencesIndues,
    };
  });

  return {
    ...structure,
    activites: activitesWithPresencesIndues,
  };
};

export const getStructureOrderBy = (
  column: StructureColumn,
  direction: "asc" | "desc"
): Prisma.StructuresOrderOrderByWithRelationInput[] => {
  return [
    { [column as StructureColumn]: direction },
    { departementAdministratif: "asc" },
    { operateur: "asc" },
    { type: "asc" },
  ];
};

export const getStructureSearchWhere = ({
  search,
  type,
  bati,
  departements,
  placesAutorisees,
  operateurs,
  selection,
}: {
  search: string | null;
  type: string | null;
  bati: string | null;
  departements: string | null;
  placesAutorisees: string | null;
  operateurs: string | null;
  selection?: boolean;
}): Prisma.StructuresOrderWhereInput => {
  const where: Prisma.StructuresOrderWhereInput = {};

  if (type) {
    const typeList = type.split(",").filter(Boolean) as StructureType[];
    if (typeList.length > 0) {
      where.type = {
        in: typeList,
      };
    }
  }

  if (!selection) {
    where.hasForms = true;
  }

  if (departements) {
    const departementList = departements.split(",").filter(Boolean);
    if (departementList.length > 0) {
      where.departementAdministratif = {
        in: departementList,
      };
    }
  }
  if (operateurs) {
    const operateurList = operateurs.split(",").filter(Boolean);
    if (operateurList.length > 0) {
      where.operateur = {
        in: operateurList,
      };
    }
  }

  if (placesAutorisees) {
    const [minStr, maxStr] = placesAutorisees.split(",");
    const min = minStr ? parseInt(minStr, 10) : null;
    const max = maxStr ? parseInt(maxStr, 10) : null;
    if (min !== null && max !== null) {
      where.placesAutorisees = {
        gte: min,
        lte: max,
      };
    }
  }

  if (search) {
    where.OR = [
      {
        dnaCode: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        finessCode: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        nom: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        departementAdministratif: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        communeAdministrative: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        codePostalAdministratif: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        operateur: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (bati) {
    if (bati === "none") {
      where.bati = {
        in: ["none"],
      };
    } else {
      where.bati = {
        in: bati
          .split(",")
          .filter(Boolean)
          .map((bati) => convertToRepartition(bati)) as Repartition[],
      };
    }
  }

  return where;
};

export const getMaxPlacesAutorisees = async (): Promise<number> => {
  const latestPlacesAutoriseesOfEveryStructure =
    await getLatestPlacesAutoriseesPerStructure();
  return Math.max(...latestPlacesAutoriseesOfEveryStructure);
};

export const getMinPlacesAutorisees = async (): Promise<number> => {
  const latestPlacesAutoriseesOfEveryStructure =
    await getLatestPlacesAutoriseesPerStructure();
  return Math.min(...latestPlacesAutoriseesOfEveryStructure);
};
