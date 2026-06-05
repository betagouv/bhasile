import { normalizeAccents } from "@/app/utils/string.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { Operateur, Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { OperateurApiWrite } from "@/schemas/api/operateur.schema";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { OperateurDbDetail } from "./operateur.db.type";

export const findBySearchTerm = async (
  searchTerm: string | null
): Promise<Operateur[]> => {
  if (!searchTerm) {
    return [];
  }

  const operateurs = await prisma.operateur.findMany({});
  return operateurs.filter((operateur) =>
    normalizeAccents(operateur.name).includes(normalizeAccents(searchTerm))
  );
};

export const getPaginatedOperateurs = async ({
  page,
  search,
}: {
  page: number | null;
  search: string | null;
}): Promise<OperateurStat[]> => {
  return prisma.$queryRaw(Prisma.sql`
    WITH dernier_millesime_structure_typologie AS (
      SELECT DISTINCT ON (st."structureId")
        st."structureId",
        st."placesAutorisees"
      FROM public."StructureTypologie" st
      ORDER BY st."structureId", st."year" DESC
    ),
    operateurs_stats AS (
      SELECT
        o.id,
        o.name,
        COUNT(DISTINCT s.id)::int as nb_structures,
        COALESCE(SUM(st."placesAutorisees"), 0)::int as total_places,
        ARRAY_AGG(DISTINCT s.type) FILTER (WHERE s.type IS NOT NULL) as structure_types
      FROM public."Operateur" o
      LEFT JOIN public."Structure" s ON s."operateurId" = o.id
      LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
      WHERE o."parentId" IS NULL
        ${search ? Prisma.sql`AND o.name ILIKE ${`%${search}%`}` : Prisma.empty}
      GROUP BY o.id, o.name
      HAVING COUNT(DISTINCT s.id) > 0
    ),
    total_places AS (
      SELECT COALESCE(SUM(st."placesAutorisees"), 0)::int as total
      FROM public."Structure" s
      LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
    )
    SELECT
      os.id,
      os.name,
      os.nb_structures,
      os.total_places,
      ROUND((os.total_places::float / NULLIF(tp.total, 0) * 100)::numeric, 2)::float as pourcentage_parc,
      os.structure_types,
      fl."key" as logo_key
    FROM operateurs_stats os
    CROSS JOIN total_places tp
    LEFT JOIN public."FileUpload" fl ON fl."operateurId" = os.id
    ORDER BY nb_structures DESC
    LIMIT ${MIDDLE_PAGE_SIZE} OFFSET ${(page ?? 0) * MIDDLE_PAGE_SIZE}
  `);
};

export const countOperateurs = async ({
  search,
}: {
  search: string | null;
}): Promise<number> => {
  return prisma.operateur.count({
    where: {
      parentId: null,
      structures: {
        some: {},
      },
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : undefined),
    },
  });
};

export const findOne = async (id: number): Promise<OperateurDbDetail> => {
  return prisma.operateur.findFirstOrThrow({
    where: { id },
    include: {
      contacts: true,
      actesAdministratifs: {
        include: { fileUploads: true },
      },
      logo: true,
    },
  });
};

export const updateOne = async (
  operateur: OperateurApiWrite
): Promise<Operateur> => {
  const { actesAdministratifs, contacts, logo, ...operateurFields } = operateur;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.operateur.update({
      where: { id: operateur.id },
      data: {
        ...operateurFields,
        ...(logo && { logo: { connect: { key: logo.key } } }),
      },
    });

    await createOrUpdateActesAdministratifs(tx, actesAdministratifs, {
      operateurId: operateur.id,
    });

    await createOrUpdateContacts(tx, contacts, {
      operateurId: operateur.id,
    });

    return updated;
  });
};

type OperateurStat = {
  id: number;
  name: string;
  nb_structures: number;
  total_places: number;
  pourcentage_parc: number;
  structure_types: StructureType[];
  logo_key: string;
};
