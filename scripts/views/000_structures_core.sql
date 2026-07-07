-- Objective: core structure attributes for reporting/filters
-- One row per structure with a current StructureVersion, centralizes common joins
-- (operateur, departement, region) and DNA aggregation.
CREATE OR REPLACE VIEW:"SCHEMA"."structures_core" AS
WITH
  structure_version_current AS (
    SELECT DISTINCT
      ON (sv."structureId") sv."structureId",
      sv."id" AS "structure_version_id",
      sv."departementAdministratif",
      sv."latitude",
      sv."longitude",
      sv."public",
      sv."creationDate",
      sv."date303"
    FROM
      public."StructureVersion" sv
      LEFT JOIN public."StructureVersionTransformation" svt ON svt."id" = sv."structureVersionTransformationId"
      LEFT JOIN public."Form" f ON f."transformationId" = svt."transformationId"
    WHERE
      sv."structureId" IS NOT NULL
      AND sv."effectiveDate" < (
        (DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day') AT TIME ZONE 'UTC'
      )
      AND (
        -- Filter out structures versions linked to a non finished transformation
        sv."structureVersionTransformationId" IS NULL
        OR f."status" IS TRUE
      )
    ORDER BY
      sv."structureId",
      sv."effectiveDate" DESC,
      sv."id" DESC
  ),
  dna_codes_by_version AS (
    SELECT
      ds."structureVersionId",
      STRING_AGG(
        DISTINCT dna."code",
        ', '
        ORDER BY
          dna."code"
      ) AS "dna_codes"
    FROM
      public."DnaStructure" ds
      JOIN public."Dna" dna ON dna."id" = ds."dnaId"
    GROUP BY
      ds."structureVersionId"
  )
SELECT
  s."id" AS "id",
  svc."structure_version_id" AS "structure_version_id",
  s."codeBhasile" AS "code_bhasile",
  s."type" AS "structure_type",
  s."createdAt" AS "created_at",
  s."updatedAt" AS "updated_at",
  svc."creationDate" AS "creation_date",
  svc."date303" AS "date_303",
  svc."departementAdministratif" AS "departement_administratif",
  svc."latitude" AS "latitude",
  svc."longitude" AS "longitude",
  svc."public" AS "public",
  dep."name" AS "departement",
  r."name" AS "region",
  o."name" AS "operateur",
  COALESCE(dna."dna_codes", '') AS "dna_codes"
FROM
  public."Structure" s
  INNER JOIN structure_version_current svc ON svc."structureId" = s."id"
  LEFT JOIN public."Operateur" o ON o."id" = s."operateurId"
  LEFT JOIN public."Departement" dep ON dep."numero" = svc."departementAdministratif"
  LEFT JOIN public."Region" r ON r."id" = dep."regionId"
  LEFT JOIN dna_codes_by_version dna ON dna."structureVersionId" = svc."structure_version_id";
