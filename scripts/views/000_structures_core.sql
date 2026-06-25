-- Objective: core structure attributes for reporting/filters
-- One row per structure, centralizes common joins (operateur, departement, region) and DNA aggregation.
-- Last effective version < now, or structure as a fallback.
CREATE OR REPLACE VIEW:"SCHEMA"."structures_core" AS
WITH
  structure_version_latest AS (
    SELECT DISTINCT
      ON (sv."structureId") sv."structureId",
      sv."id" AS "structure_version_id",
      sv."type",
      sv."departementAdministratif",
      sv."latitude",
      sv."longitude",
      sv."public"
    FROM
      public."StructureVersion" sv
    WHERE
      sv."structureId" IS NOT NULL
      AND sv."effectiveDate" <= CURRENT_TIMESTAMP
    ORDER BY
      sv."structureId",
      sv."effectiveDate" DESC,
      sv."updatedAt" DESC,
      sv."id" DESC
  )
SELECT
  s."id" AS "id",
  svl."structure_version_id" AS "structure_version_id",
  s."codeBhasile" AS "code_bhasile",
  COALESCE(svl."type", s."type") AS "structure_type",
  s."createdAt" AS "created_at",
  s."updatedAt" AS "updated_at",
  COALESCE(svl."departementAdministratif", s."departementAdministratif") AS "departement_administratif",
  COALESCE(svl."latitude", s."latitude") AS "latitude",
  COALESCE(svl."longitude", s."longitude") AS "longitude",
  COALESCE(svl."public", s."public") AS "public",
  dep."name" AS "departement",
  r."name" AS "region",
  o."name" AS "operateur",
  dna_agg."dna_codes" AS "dna_codes"
FROM
  public."Structure" s
  LEFT JOIN structure_version_latest svl ON svl."structureId" = s."id"
  LEFT JOIN public."Operateur" o ON o."id" = s."operateurId"
  LEFT JOIN public."Departement" dep ON dep."numero" = COALESCE(svl."departementAdministratif", s."departementAdministratif")
  LEFT JOIN public."Region" r ON r."id" = dep."regionId"
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(
        STRING_AGG(
          DISTINCT dna."code",
          ', '
          ORDER BY
            dna."code"
        ),
        ''
      ) AS "dna_codes"
    FROM
      public."DnaStructure" ds
      JOIN public."Dna" dna ON dna."id" = ds."dnaId"
    WHERE
      (
        svl."structure_version_id" IS NOT NULL
        AND ds."structureVersionId" = svl."structure_version_id"
      )
      OR (
        svl."structure_version_id" IS NULL
        AND ds."structureId" = s."id"
      )
  ) dna_agg ON TRUE;
