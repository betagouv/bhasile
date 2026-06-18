-- Objective: core structure attributes for reporting/filters
-- One row per structure, centralizes common joins (operateur, departement, region) and DNA aggregation.
CREATE OR REPLACE VIEW:"SCHEMA"."structures_core" AS
SELECT
  s."id" AS "id",
  s."codeBhasile" AS "code_bhasile",
  s."type" AS "structure_type",
  s."createdAt" AS "created_at",
  s."updatedAt" AS "updated_at",
  s."departementAdministratif" AS "departement_administratif",
  dep."name" AS "departement",
  r."name" AS "region",
  o."name" AS "operateur",
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
  public."Structure" s
  LEFT JOIN public."Operateur" o ON o."id" = s."operateurId"
  LEFT JOIN public."Departement" dep ON dep."numero" = s."departementAdministratif"
  LEFT JOIN public."Region" r ON r."id" = dep."regionId"
  LEFT JOIN public."DnaStructure" ds ON ds."structureId" = s."id"
  LEFT JOIN public."Dna" dna ON dna."id" = ds."dnaId"
GROUP BY
  s."id",
  s."codeBhasile",
  s."type",
  s."createdAt",
  s."updatedAt",
  s."departementAdministratif",
  dep."name",
  r."name",
  o."name";
