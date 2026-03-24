import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma, Structure, StructureType } from "@/generated/prisma/client";
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
import { createOrUpdateDnaStructures } from "../dna-structures/dna-structure.repository";
import { createOrUpdateDocumentsFinanciers } from "../documents-financiers/documentFinancier.repository";
import { createOrUpdateEvaluations } from "../evaluations/evaluation.repository";
import { createOrUpdateFinesses } from "../finesses/finess.repository";
import {
  createOrUpdateForms,
  initializeDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateStructureMillesimes } from "../structure-millesimes/structure-millesime.repository";
import { createOrUpdateStructureTypologies } from "../structure-typologies/structure-typologie.repository";
import { convertToPublicType } from "./structure.util";

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

const STRUCTURES_ORDER_WITH_PART = Prisma.sql`
  WITH dernier_millesime_structure_typologie AS (
    SELECT DISTINCT ON (st."structureId")
      st."structureId",
      st."placesAutorisees"
    FROM public."StructureTypologie" st
    ORDER BY st."structureId", st."year" DESC
  ),
  structure_repartition AS (
    SELECT
      a."structureId",
      CASE
        WHEN BOOL_AND(a.repartition = 'COLLECTIF'::public."Repartition") THEN 'COLLECTIF'
        WHEN BOOL_AND(a.repartition = 'DIFFUS'::public."Repartition") THEN 'DIFFUS'
        ELSE 'MIXTE'
      END AS bati
    FROM public."Adresse" a
    WHERE a.repartition IS NOT NULL
    GROUP BY a."structureId"
  )
`;

const STRUCTURES_ORDER_JOINS_PART = Prisma.sql`
  FROM public."Structure" s
  LEFT JOIN public."Operateur" o ON o.id = s."operateurId"
  LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
  LEFT JOIN structure_repartition sr ON sr."structureId" = s.id
`;

function buildOrder(
  column: StructureColumn,
  direction: "asc" | "desc"
): Prisma.Sql {
  const dir = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const byColumn: Record<StructureColumn, Prisma.Sql> = {
    codeBhasile: Prisma.sql`s."codeBhasile"`,
    type: Prisma.sql`s."type"`,
    operateur: Prisma.sql`o."name"`,
    departementAdministratif: Prisma.sql`s."departementAdministratif"`,
    bati: Prisma.sql`sr.bati`,
    communes: Prisma.sql`s."communeAdministrative"`,
    placesAutorisees: Prisma.sql`st."placesAutorisees"`,
    finConvention: Prisma.sql`s."finConvention"`,
  };
  return Prisma.sql`${byColumn[column]} ${dir}, s."codeBhasile" ASC`;
}

function buildWhereConditions({
  search,
  type,
  bati,
  departements,
  placesAutorisees,
  operateurs,
  selection,
}: SearchProps): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  const typeList = type?.split(",").filter(Boolean) ?? [];
  const depList = departements?.split(",").filter(Boolean) ?? [];
  const opList = operateurs?.split(",").filter(Boolean) ?? [];

  if (!selection) {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM public."Form" f WHERE f."structureId" = s.id)`
    );
  }
  if (typeList.length > 0) {
    conditions.push(Prisma.sql`s."type"::text IN (${Prisma.join(typeList)})`);
  }
  if (depList.length > 0) {
    conditions.push(
      Prisma.sql`s."departementAdministratif" IN (${Prisma.join(depList)})`
    );
  }
  if (opList.length > 0) {
    conditions.push(Prisma.sql`o."name" IN (${Prisma.join(opList)})`);
  }
  if (placesAutorisees) {
    const [minStr, maxStr] = placesAutorisees.split(",");
    const min = minStr ? parseInt(minStr, 10) : null;
    const max = maxStr ? parseInt(maxStr, 10) : null;
    if (min !== null && max !== null) {
      conditions.push(
        Prisma.sql`st."placesAutorisees" >= ${min} AND st."placesAutorisees" <= ${max}`
      );
    }
  }
  if (search) {
    const like = `%${search}%`;
    conditions.push(Prisma.sql`(
      s."codeBhasile" ILIKE ${like}
      OR COALESCE(s."finessCode", '') ILIKE ${like}
      OR COALESCE(s."nom", '') ILIKE ${like}
      OR s."departementAdministratif" ILIKE ${like}
      OR s."communeAdministrative" ILIKE ${like}
      OR s."codePostalAdministratif" ILIKE ${like}
      OR COALESCE(o."name", '') ILIKE ${like}
    )`);
  }
  if (bati) {
    if (bati === "none") {
      conditions.push(Prisma.sql`sr.bati IS NULL`);
    } else {
      const batiList = bati.split(",").filter(Boolean);
      if (batiList.length > 0) {
        conditions.push(Prisma.sql`sr.bati IN (${Prisma.join(batiList)})`);
      }
    }
  }

  if (conditions.length === 0) {
    return Prisma.sql``;
  }
  let combined = conditions[0];
  for (let i = 1; i < conditions.length; i += 1) {
    combined = Prisma.sql`${combined} AND ${conditions[i]}`;
  }
  return Prisma.sql`WHERE ${combined}`;
}

async function getOrderedStructures({
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
}: SearchProps): Promise<{ id: number }[]> {
  const whereSql = buildWhereConditions({
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
  });
  const orderSql = buildOrder(
    column ?? "departementAdministratif",
    direction ?? "asc"
  );
  const paginationSql =
    selection || map
      ? Prisma.sql``
      : Prisma.sql`LIMIT ${DEFAULT_PAGE_SIZE} OFFSET ${(page ?? 0) * DEFAULT_PAGE_SIZE}`;

  return prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    ${STRUCTURES_ORDER_WITH_PART}
    SELECT s.id
    ${STRUCTURES_ORDER_JOINS_PART}
    ${whereSql}
    ORDER BY ${orderSql}
    ${paginationSql}
  `);
}

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
      dnaStructures: {
        include: {
          dna: true,
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
  const whereSql = buildWhereConditions({
    search,
    page: null,
    type,
    bati,
    departements,
    placesAutorisees,
    operateurs,
    column: null,
    direction: null,
    map: false,
    selection: false,
  });
  const result = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    ${STRUCTURES_ORDER_WITH_PART}
    SELECT COUNT(*)::bigint AS count
    ${STRUCTURES_ORDER_JOINS_PART}
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
      dnaStructures: {
        include: {
          dna: true,
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
  codeBhasile: string;
  dnaCode: string;
  type: StructureType;
  operateurId: number;
  departementAdministratif?: string;
  nom: string;
  adresseAdministrative: string;
  codePostalAdministratif: string;
  communeAdministrative: string;
}): Promise<Structure> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }
  const upsertedStructure = await prisma.structure.upsert({
    where: { codeBhasile: structure.codeBhasile },
    update: {
      ...structure,
      dnaStructures: {
        create: [
          {
            dna: {
              connectOrCreate: {
                where: { code: structure.dnaCode },
                create: { code: structure.dnaCode },
              },
            },
          },
        ],
      },
    },
    create: {
      ...structure,
      dnaStructures: {
        create: [
          {
            dna: {
              connectOrCreate: {
                where: { code: structure.dnaCode },
                create: { code: structure.dnaCode },
              },
            },
          },
        ],
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
