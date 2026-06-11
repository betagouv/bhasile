-- Objective: resolve the current version of each structure (one row per structure).
-- Mirrors the application resolver `resolveCurrentVersion`:
--   effectiveDate <= now AND (no transfo OR its Transformation form is finalised),
--   newest effectiveDate wins, ties broken by id.
-- Base building block joined by every reporting view to read versioned data:
--   versioned scalars from `StructureVersion sv ON sv.id = version_id`,
--   versioned relations via `rel."structureVersionId" = version_id`.
CREATE OR REPLACE VIEW:"SCHEMA"."structures_current_version" AS
SELECT DISTINCT
  ON (sv."structureId") sv."structureId" AS "structureId",
  sv."id" AS "version_id"
FROM
  public."StructureVersion" sv
  LEFT JOIN public."StructureVersionTransformation" svt ON svt."id" = sv."structureVersionTransformationId"
  LEFT JOIN public."Form" f ON f."transformationId" = svt."transformationId"
WHERE
  sv."effectiveDate" <= (NOW() AT TIME ZONE 'UTC')
  AND (
    sv."structureVersionTransformationId" IS NULL
    OR f."status" IS TRUE
  )
ORDER BY
  sv."structureId",
  sv."effectiveDate" DESC,
  sv."id" DESC;
