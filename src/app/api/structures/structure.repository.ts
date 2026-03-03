import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Structure, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { StructureColumn } from "@/types/ListColumn";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acteAdministratif.repository";
import { createOrUpdateAdresses } from "../adresses/adresse.repository";
import { createOrUpdateAntennes } from "../antennes/antenne.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { createOrUpdateControles } from "../controles/controle.repository";
import { createOrUpdateDocumentsFinanciers } from "../documents-financiers/documentFinancier.repository";
import { createOrUpdateEvaluations } from "../evaluations/evaluation.repository";
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
      structureId: true,
      placesAutorisees: true,
    },
  });

  const seenStructures = new Set<string>();

  return allTypologies
    .filter((typology) => typology.structureId !== null)
    .filter((typology) => {
      if (
        seenStructures.has(typology.structureId as unknown as string) ||
        typology.placesAutorisees === null
      ) {
        return false;
      }
      seenStructures.add(typology.structureId as unknown as string);
      return true;
    })
    .map((typology) => typology.placesAutorisees as number);
};

export const findOneOperateur = async (
  id: number
): Promise<{
  id: number;
  codeBhasile: string | null;
  forms: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    structureId: number | null;
    formDefinitionId: number;
    status: boolean;
  }[];
}> => {
  return await prisma.structure.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      codeBhasile: true,
      forms: true,
    },
  });
};

export const findOne = async (id: number): Promise<Structure> => {
  const structure = await prisma.structure.findFirstOrThrow({
    where: {
      id,
    },
    include: {
      dnasStructures: {
        include: {
          dna: true,
        },
      },
      adresses: {
        include: {
          adresseTypologies: {
            orderBy: {
              year: "desc",
            },
          },
        },
      },
      antennes: true,
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
      cpomStructures: {
        include: {
          cpom: {
            include: {
              structures: {
                include: {
                  structure: {
                    select: {
                      id: true,
                      codeBhasile: true,
                      type: true,
                      communeAdministrative: true,
                      operateur: {
                        select: {
                          name: true,
                        },
                      },
                      forms: true,
                    },
                  },
                },
              },
              operateur: true,
              actesAdministratifs: {
                include: {
                  fileUploads: true,
                },
              },
              cpomMillesimes: {
                orderBy: {
                  year: "desc",
                },
              },
            },
          },
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
          evenementDate: "desc",
        },
      },
      actesAdministratifs: {
        include: {
          fileUploads: true,
        },
      },
      documentsFinanciers: {
        include: {
          fileUploads: true,
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
      structureTypologies,
      adresses,
      antennes,
      actesAdministratifs,
      documentsFinanciers,
      controles,
      evaluations,
      forms,
      structureMillesimes,
    } = structure;

    return await prisma.$transaction(async (tx) => {
      const updatedStructure = await updateStructure(tx, structure);

      await initializeDefaultForms(tx, isOperateurUpdate, structure.id);

      await createOrUpdateDnaStructures(tx, dnaStructures, structure.id);
      await createOrUpdateFinesses(tx, finesses, structure.id);
      await createOrUpdateContacts(tx, contacts, structure.id);
      await createOrUpdateBudgets(tx, budgets, structure.id);
      await createOrUpdateStructureTypologies(
        tx,
        structureTypologies,
        structure.id
      );
      await createOrUpdateAdresses(tx, adresses, structure.id);
      await createOrUpdateAntennes(tx, antennes, structure.id);
      await createOrUpdateActesAdministratifs(tx, actesAdministratifs, {
        structureId: structure.id,
      });
      await createOrUpdateDocumentsFinanciers(tx, documentsFinanciers, {
        structureId: structure.id,
      });
      await createOrUpdateControles(tx, controles, structure.id);
      await createOrUpdateForms(tx, forms, structure.id);
      await createOrUpdateEvaluations(tx, evaluations, structure.id);
      await createOrUpdateStructureMillesimes(
        tx,
        structureMillesimes,
        structure.id
      );

      return updatedStructure;
    });
  } catch (error) {
    throw new Error(
      `Impossible de mettre à jour la structure avec l'id ${structure.id}: ${error}`
    );
  }
};

const updateStructure = async (
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
      id: structure.id,
    },
    data: {
      public: convertToPublicType(publicType!),
      adresseAdministrative,
      codePostalAdministratif,
      communeAdministrative,
      filiale,
      type,
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

// Only used in e2e tests
export const createMinimalStructure = async (structure: {
  id: number;
  type: StructureType;
  operateurId: number;
  departementAdministratif?: string;
  nom: string;
  adresseAdministrative: string;
  codePostalAdministratif: string;
  communeAdministrative: string;
}): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }
  await prisma.structure.upsert({
    where: { id: structure.id },
    update: structure,
    create: structure,
  });
};

// Only used in e2e tests
export const deleteStructure = async (id: number): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }
  await prisma.structure.delete({ where: { id } });
};
