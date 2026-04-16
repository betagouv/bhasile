import { normalizeAccents } from "@/app/utils/string.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { Operateur, Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

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
}: {
  page: number | null;
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
      GROUP BY o.id, o.name
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
      os.structure_types
    FROM operateurs_stats os
    CROSS JOIN total_places tp
    ORDER BY nb_structures DESC
    LIMIT ${MIDDLE_PAGE_SIZE} OFFSET ${(page ?? 0) * MIDDLE_PAGE_SIZE}
  `);
};

export const countOperateurs = async (): Promise<number> => {
  return prisma.operateur.count();
};

export const findOne = async (id: number): Promise<OperateurWithStructures> => {
  return prisma.operateur.findFirstOrThrow({
    where: { id },
    include: {
      structures: {
        select: {
          lgbt: true,
          fvvTeh: true,
        },
      },
    },
  });
};

type OperateurWithStructures = Prisma.OperateurGetPayload<{
  include: {
    structures: {
      select: {
        lgbt: true;
        fvvTeh: true;
      };
    };
  };
}>;

type OperateurStat = {
  id: number;
  name: string;
  nb_structures: number;
  total_places: number;
  pourcentage_parc: number;
  structure_types: StructureType[];
};
