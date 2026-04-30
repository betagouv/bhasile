import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma, Structure, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateAdresses } from "../adresses/adresse.repository";
import { createOrUpdateAntennes } from "../antennes/antenne.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { createOrUpdateControles } from "../controles/controle.repository";
import { createOrUpdateDnaStructures } from "../dna-structures/dna-structure.repository";
import { createOrUpdateDocumentsFinanciers } from "../documents-financiers/documentFinancier.repository";
import { createOrUpdateEvaluations } from "../evaluations/evaluation.repository";
import { createOrUpdateFinesses } from "../finesses/finess.repository";
import {
  createOrUpdateForms,
  initializeDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateIndicateursFinanciers } from "../indicateurs-financiers/indicateur-financier.repository";
import { createOrUpdateStructureMillesimes } from "../structure-millesimes/structure-millesime.repository";
import { createOrUpdateStructureTypologies } from "../structure-typologies/structure-typologie.repository";
import {
  STRUCTURES_ORDER_CTE_SQL,
  STRUCTURES_ORDER_JOINS_SQL,
} from "./structure.constants";
import {
  StructureDbList,
  StructureDbMap,
  StructureDbOperateur,
} from "./structure.db.type";
import { SearchProps } from "./structure.service";
import {
  buildStructuresOrderSql,
  buildStructuresWhereSql,
  convertToPublicType,
} from "./structure.util";

const getOrderedStructures = async ({
  search,
  page,
  type,
  bati,
  placesAutorisees,
  departements,
  operateurs,
  column,
  direction,
  selection,
  map,
}: SearchProps): Promise<{ id: number }[]> => {
  const whereSql = buildStructuresWhereSql({
    search,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
    selection,
  });
  const orderSql = buildStructuresOrderSql(
    column ?? "departementAdministratif",
    direction ?? "asc"
  );
  const paginationSql =
    selection || map
      ? Prisma.sql``
      : Prisma.sql`LIMIT ${DEFAULT_PAGE_SIZE} OFFSET ${(page ?? 0) * DEFAULT_PAGE_SIZE}`;

  return prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    ${STRUCTURES_ORDER_CTE_SQL}
    SELECT s.id
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
    ORDER BY ${orderSql}
    ${paginationSql}
  `);
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
}: SearchProps): Promise<StructureDbList[] | StructureDbMap[]> => {
  const structuresIds = await getOrderedStructures({
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
  });
  if (map) {
    return prisma.structure.findMany({
      where: {
        id: {
          in: structuresIds.map((structure) => structure.id),
        },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  const structures = await prisma.structure.findMany({
    where: {
      id: {
        in: structuresIds.map((structure) => structure.id),
      },
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
      cpomStructures: {
        include: {
          cpom: {
            include: {
              actesAdministratifs: {
                include: {
                  fileUploads: true,
                },
              },
            },
          },
        },
      },
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
      dnaStructures: {
        orderBy: {
          dna: {
            code: "asc",
          },
        },
        include: {
          dna: true,
        },
      },
      actesAdministratifs: true,
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
  const whereSql = buildStructuresWhereSql({
    search,
    type,
    bati,
    departements,
    placesAutorisees,
    operateurs,
    selection: false,
  });
  const result = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    ${STRUCTURES_ORDER_CTE_SQL}
    SELECT COUNT(*)::bigint AS count
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
  `);
  return Number(result[0]?.count ?? 0);
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
): Promise<StructureDbOperateur> => {
  return await prisma.structure.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      codeBhasile: true,
      forms: true,
    },
  });
};

export const findOne = async (id: number) => {
  const structure = await prisma.structure.findFirstOrThrow({
    where: {
      id,
    },
    include: {
      userNotes: {
        orderBy: { createdAt: "desc" },
        select: { text: true },
      },
      dnaStructures: {
        orderBy: {
          dna: {
            code: "asc",
          },
        },
        include: {
          dna: {
            include: {
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
            },
          },
        },
      },
      finesses: true,
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
              budgets: {
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
      indicateursFinanciers: {
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

export const updateOne = async (
  structure: StructureAgentUpdateApiType,
  isOperateurUpdate: boolean = false
): Promise<Structure> => {
  try {
    const {
      contacts,
      budgets,
      indicateursFinanciers,
      structureTypologies,
      adresses,
      antennes,
      dnaStructures,
      finesses,
      actesAdministratifs,
      documentsFinanciers,
      controles,
      evaluations,
      forms,
      structureMillesimes,
    } = structure;

    return await prisma.$transaction(
      async (tx) => {
        const updatedStructure = await updateStructure(tx, structure);

        await initializeDefaultForms(tx, isOperateurUpdate, structure.id);

        await createOrUpdateDnaStructures(tx, dnaStructures, structure.id);
        await createOrUpdateFinesses(tx, finesses, structure.id);
        await createOrUpdateContacts(tx, contacts, structure.id);
        await createOrUpdateBudgets(tx, budgets, { structureId: structure.id });
        await createOrUpdateIndicateursFinanciers(tx, indicateursFinanciers, {
          structureId: structure.id,
        });
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
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );
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
    lgbt,
    fvvTeh,
    debutPeriodeAutorisation,
    finPeriodeAutorisation,
    notes,
    nomOfii,
    directionTerritoriale,
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
      lgbt,
      fvvTeh,
      debutPeriodeAutorisation,
      finPeriodeAutorisation,
      notes,
      nomOfii,
      directionTerritoriale,
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
export const createMinimalStructure = async (
  dnaCodes: { code: string }[],
  structure: {
    codeBhasile: string;
    type: StructureType;
    operateurId: number;
    departementAdministratif?: string;
    nom: string;
    adresseAdministrative: string;
    codePostalAdministratif: string;
    communeAdministrative: string;
  }
): Promise<Structure> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }

  const upsertedStructure = await prisma.structure.upsert({
    where: { codeBhasile: structure.codeBhasile },
    update: {
      ...structure,
      dnaStructures: {
        create: dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
    },
    create: {
      ...structure,
      dnaStructures: {
        create: dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
    },
  });

  return upsertedStructure;
};

// Only used in e2e tests
export const deleteStructure = async (codeBhasile: string): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }
  await prisma.structure.delete({ where: { codeBhasile } });
};
