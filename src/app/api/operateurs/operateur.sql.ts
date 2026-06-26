import { MIDDLE_PAGE_SIZE } from "@/constants";
import { Prisma } from "@/generated/prisma/client";

import { buildCurrentVersionCteSql } from "../structures/structure.sql";

type OperateursQueryFilters = {
  page: number | null;
  search: string | null;
};

export const buildPaginatedOperateursQuery = (
  { page, search }: OperateursQueryFilters,
  now: Date
): Prisma.Sql => Prisma.sql`
  WITH ${buildCurrentVersionCteSql(now)},
  dernier_millesime_structure_typologie AS (
    SELECT DISTINCT ON (cv."structureId")
      cv."structureId",
      st."placesAutorisees"
    FROM current_version cv
    JOIN public."StructureTypologie" st ON st."structureVersionId" = cv.version_id
    ORDER BY cv."structureId", st."year" DESC
  ),
  current_structure_type AS (
    SELECT cv."structureId", sv."type"
    FROM current_version cv
    JOIN public."StructureVersion" sv ON sv.id = cv.version_id
  ),
  operateurs_stats AS (
    SELECT
      o.id,
      o.name,
      COUNT(DISTINCT s.id)::int as nb_structures,
      COALESCE(SUM(st."placesAutorisees"), 0)::int as total_places,
      ARRAY_AGG(DISTINCT cst."type") FILTER (WHERE cst."type" IS NOT NULL) as structure_types
    FROM public."Operateur" o
    LEFT JOIN public."Structure" s ON s."operateurId" = o.id
    LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
    LEFT JOIN current_structure_type cst ON cst."structureId" = s.id
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
`;
