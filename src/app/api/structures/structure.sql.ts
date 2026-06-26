import { startOfNextUtcDay } from "@/app/utils/date.util";
import { Prisma } from "@/generated/prisma/client";

// Shared current-version CTE, consumed by the activites and operateurs raw SQL.
// The structures list no longer uses raw SQL; this CTE will move out when those
// domains get their own zero-SQL migration.
export const buildCurrentVersionCteSql = (now: Date): Prisma.Sql => Prisma.sql`
  current_version AS (
    SELECT DISTINCT ON (sv."structureId")
      sv."structureId",
      sv.id AS version_id
    FROM public."StructureVersion" sv
    LEFT JOIN public."StructureVersionTransformation" svt ON svt.id = sv."structureVersionTransformationId"
    LEFT JOIN public."Form" f ON f."transformationId" = svt."transformationId"
    WHERE sv."structureId" IS NOT NULL
      AND sv."effectiveDate" < ${startOfNextUtcDay(now).toISOString()}::timestamptz AT TIME ZONE 'UTC'
      AND (sv."structureVersionTransformationId" IS NULL OR f."status" IS TRUE)
    ORDER BY sv."structureId", sv."effectiveDate" DESC, sv.id DESC
  )
`;
