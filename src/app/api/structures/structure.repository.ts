import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Structure } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { PrismaTransaction } from "@/types/prisma.type";
import { StructureColumn } from "@/types/StructureColumn.type";

import { createOrUpdateAdresses } from "../adresses/adresse.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { createOrUpdateControles } from "../controles/controle.repository";
import { createOrUpdateCpomMillesimes } from "../cpoms/cpom.repository";
import { createOrUpdateEvaluations } from "../evaluations/evaluation.repository";
import { updateFileUploads } from "../files/file.repository";
import {
  createOrUpdateForms,
  initializeDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateStructureMillesimes } from "../structure-millesimes/structure-millesime.repository";
import { createOrUpdateStructureTypologies } from "../structure-typologies/structure-typologie.repository";
import {
  getStructureOrderBy,
  getStructureSearchWhere,
} from "./structure.service";
import { convertToPublicType } from "./structure.util";

export const findAll = async (): Promise<Structure[]> => {
  return prisma.structure.findMany({
    include: {
      adresses: {
        include: {
          adresseTypologies: {
            orderBy: {
              year: "desc",
            },
          },
        },
      },
      operateur: true,
      structureTypologies: {
        orderBy: {
          year: "desc",
        },
      },
      forms: {
        include: {
          formDefinition: true,
        },
      },
    },
  });
};

type SearchProps = {
  search: string | null;
  page: number | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  column?: StructureColumn | null;
  direction?: "asc" | "desc" | null;
  map?: boolean;
  selection?: boolean;
};
export const findBySearch = async ({
  search,
  page,
  type,
  bati,
  placesAutorisees,
  departements,
  operateurs,
  column,
  direction,
  map,
  selection,
}: SearchProps): Promise<Partial<Structure>[]> => {
  const where = getStructureSearchWhere({
    search,
    type,
    bati,
    departements,
    placesAutorisees,
    operateurs,
    selection,
  });

  if (map) {
    const mapStructuresIds = await prisma.structuresOrder.findMany({
      where,
      select: {
        id: true,
      },
    });
    return prisma.structure.findMany({
      where: {
        id: {
          in: mapStructuresIds.map((structure) => structure.id),
        },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  const orderBy = getStructureOrderBy(
    column ?? "departementAdministratif",
    direction ?? "asc"
  );

  const structuresIds = await prisma.structuresOrder.findMany({
    where,
    skip: selection ? 0 : page ? page * DEFAULT_PAGE_SIZE : 0,
    take: selection ? undefined : DEFAULT_PAGE_SIZE,
    orderBy,
    select: {
      id: true,
    },
  });

  const structures = await prisma.structure.findMany({
    where: {
      id: {
        in: structuresIds.map((structure) => structure.id),
      },
    },
    include: {
      adresses: true,
      operateur: true,
      structureMillesimes: {
        orderBy: {
          year: "desc",
        },
      },
      structureTypologies: {
        orderBy: {
          year: "desc",
        },
      },
      forms: {
        include: {
          formDefinition: true,
        },
      },
    },
  });

  const orderedStructures = structuresIds
    .map((structuresIds) => {
      return structures.find((structure) => structure.id === structuresIds.id);
    })
    .filter((structure) => structure !== undefined);

  return orderedStructures;
};

export const countBySearch = async ({
  search,
  type,
  bati,
  placesAutorisees,
  departements,
  operateurs,
}: SearchProps): Promise<number> => {
  const where = getStructureSearchWhere({
    search,
    type,
    bati,
    departements,
    placesAutorisees,
    operateurs,
  });

  return prisma.structuresOrder.count({
    where,
  });
};

export const getLatestPlacesAutoriseesPerStructure = async (): Promise<
  number[]
> => {
  const allTypologies = await prisma.structureTypologie.findMany({
    orderBy: {
      year: "desc",
    },
    select: {
      structureDnaCode: true,
      placesAutorisees: true,
    },
  });

  const seenStructures = new Set<string>();

  return allTypologies
    .filter((typology) => {
      if (
        seenStructures.has(typology.structureDnaCode) ||
        typology.placesAutorisees === null
      ) {
        return false;
      }
      seenStructures.add(typology.structureDnaCode);
      return true;
    })
    .map((typology) => typology.placesAutorisees as number);
};

export const findOne = async (id: number): Promise<Structure> => {
  const structure = await prisma.structure.findFirstOrThrow({
    where: {
      id,
    },
    include: {
      adresses: {
        include: {
          adresseTypologies: {
            orderBy: {
              year: "desc",
            },
          },
        },
      },
      contacts: true,
      structureTypologies: {
        orderBy: {
          year: "desc",
        },
      },
      structureMillesimes: {
        orderBy: {
          year: "desc",
        },
      },
      evaluations: {
        include: {
          fileUploads: true,
        },
        orderBy: {
          date: "desc",
        },
      },
      controles: {
        include: {
          fileUploads: true,
        },
        orderBy: {
          date: "desc",
        },
      },
      activites: {
        orderBy: {
          date: "desc",
        },
      },
      evenementsIndesirablesGraves: {
        orderBy: {
          createdAt: "desc",
        },
      },
      fileUploads: {
        include: {
          parentFileUpload: true,
          childFileUploads: true,
        },
      },
      budgets: {
        orderBy: {
          year: "desc",
        },
      },
      operateur: true,
      forms: {
        include: {
          formDefinition: true,
          formSteps: {
            include: {
              stepDefinition: true,
            },
          },
        },
      },
    },
  });
  return structure;
};

export const findByDnaCode = async (
  dnaCode: string
): Promise<Structure | null> => {
  return prisma.structure.findUnique({
    where: {
      dnaCode,
    },
    include: {
      adresses: {
        include: {
          adresseTypologies: {
            orderBy: {
              year: "desc",
            },
          },
        },
      },
      contacts: true,
      operateur: true,
      structureTypologies: {
        orderBy: {
          year: "desc",
        },
      },
      forms: {
        include: {
          formDefinition: true,
        },
      },
      fileUploads: true,
    },
  });
};

export const updateOneAgent = async (
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  return await updateOne(structure, false);
};
export const updateOneOperateur = async (
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  return await updateOne(structure, true);
};

const updateOne = async (
  structure: StructureAgentUpdateApiType,
  isOperateurUpdate: boolean = false
): Promise<Structure> => {
  try {
    const {
      contacts,
      budgets,
      cpomMillesimes,
      structureTypologies,
      adresses,
      actesAdministratifs,
      documentsFinanciers,
      controles,
      evaluations,
      forms,
      structureMillesimes,
    } = structure;

    return await prisma.$transaction(async (tx) => {
      const updatedStructure = await createOrUpdateStructure(tx, structure);

      await initializeDefaultForms(tx, isOperateurUpdate, structure.dnaCode);

      await createOrUpdateContacts(tx, contacts, structure.dnaCode);
      await createOrUpdateBudgets(tx, budgets, structure.dnaCode);
      await createOrUpdateStructureTypologies(
        tx,
        structureTypologies,
        structure.dnaCode
      );
      await createOrUpdateAdresses(tx, adresses, structure.dnaCode);
      await updateFileUploads(
        tx,
        actesAdministratifs,
        structure.dnaCode,
        "acteAdministratif"
      );
      await updateFileUploads(
        tx,
        documentsFinanciers,
        structure.dnaCode,
        "documentFinancier"
      );
      await createOrUpdateControles(tx, controles, structure.dnaCode);
      await createOrUpdateForms(tx, forms, structure.dnaCode);
      await createOrUpdateEvaluations(tx, evaluations, structure.dnaCode);
      await createOrUpdateCpomMillesimes(tx, cpomMillesimes, structure.dnaCode);
      await createOrUpdateStructureMillesimes(
        tx,
        structureMillesimes,
        structure.dnaCode
      );

      return updatedStructure;
    });
  } catch (error) {
    throw new Error(
      `Impossible de mettre à jour la structure avec le code DNA ${structure.dnaCode}: ${error}`
    );
  }
};

const createOrUpdateStructure = async (
  tx: PrismaTransaction,
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  const {
    public: publicType,
    departementAdministratif,
    operateur,
    adresseAdministrative,
    codePostalAdministratif,
    communeAdministrative,
    filiale,
    type,
    placesACreer,
    placesAFermer,
    echeancePlacesACreer,
    echeancePlacesAFermer,
    latitude,
    longitude,
    nom,
    date303,
    debutConvention,
    finConvention,
    creationDate,
    finessCode,
    lgbt,
    fvvTeh,
    debutPeriodeAutorisation,
    finPeriodeAutorisation,
    notes,
    nomOfii,
    directionTerritoriale,
    activeInOfiiFileSince,
    inactiveInOfiiFileSince,
  } = structure;

  const updatedStructure = await tx.structure.update({
    where: {
      dnaCode: structure.dnaCode,
    },
    data: {
      public: convertToPublicType(publicType!),
      adresseAdministrative,
      codePostalAdministratif,
      communeAdministrative,
      filiale,
      type,
      placesACreer,
      placesAFermer,
      echeancePlacesACreer,
      echeancePlacesAFermer,
      latitude,
      longitude,
      nom,
      date303,
      debutConvention,
      finConvention,
      creationDate,
      finessCode,
      lgbt,
      fvvTeh,
      debutPeriodeAutorisation,
      finPeriodeAutorisation,
      notes,
      nomOfii,
      directionTerritoriale,
      activeInOfiiFileSince,
      inactiveInOfiiFileSince,
      departement: departementAdministratif
        ? {
            connect: {
              numero: departementAdministratif,
            },
          }
        : undefined,
      operateur: {
        connect: operateur
          ? {
              id: operateur?.id,
            }
          : undefined,
      },
    },
  });
  return updatedStructure;
};
