import { Prisma } from "@/generated/prisma/client";

export const buildCurrentVersionCteSql = (now: Date): Prisma.Sql => Prisma.sql`
  current_version AS (
    SELECT DISTINCT ON (sv."structureId")
      sv."structureId",
      sv.id AS version_id
    FROM public."StructureVersion" sv
    LEFT JOIN public."StructureVersionTransformation" svt ON svt.id = sv."structureVersionTransformationId"
    LEFT JOIN public."Form" f ON f."transformationId" = svt."transformationId"
    WHERE sv."effectiveDate" <= ${now.toISOString()}::timestamptz AT TIME ZONE 'UTC'
      AND (sv."structureVersionTransformationId" IS NULL OR f."status" IS TRUE)
    ORDER BY sv."structureId", sv."effectiveDate" DESC, sv.id DESC
  )
`;

export const buildStructuresOrderCteSql = (now: Date): Prisma.Sql => Prisma.sql`
  WITH ${buildCurrentVersionCteSql(now)},
  dernier_millesime_structure_typologie AS (
    SELECT DISTINCT ON (cv."structureId")
      cv."structureId",
      st."placesAutorisees"
    FROM current_version cv
    JOIN public."StructureTypologie" st ON st."structureVersionId" = cv.version_id
    ORDER BY cv."structureId", st."year" DESC
  ),
  structure_repartition AS (
    SELECT
      cv."structureId",
      CASE
        WHEN BOOL_AND(a.repartition = 'COLLECTIF'::public."Repartition") THEN 'COLLECTIF'
        WHEN BOOL_AND(a.repartition = 'DIFFUS'::public."Repartition") THEN 'DIFFUS'
        ELSE 'MIXTE'
      END AS bati
    FROM current_version cv
    JOIN public."Adresse" a ON a."structureVersionId" = cv.version_id
    WHERE a.repartition IS NOT NULL
    GROUP BY cv."structureId"
  )
`;

export const STRUCTURES_ORDER_JOINS_SQL = Prisma.sql`
  FROM public."Structure" s
  JOIN current_version cv ON cv."structureId" = s.id
  JOIN public."StructureVersion" sv ON sv.id = cv.version_id
  LEFT JOIN public."Operateur" o ON o.id = s."operateurId"
  LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
  LEFT JOIN structure_repartition sr ON sr."structureId" = s.id
`;
