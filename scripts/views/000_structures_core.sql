-- Objective: core structure attributes for reporting/filters
-- One row per structure, centralizes common joins (operateur, departement, region) and DNA aggregation.
-- Versioned attributes (type, departementAdministratif, DNA links) are read from the current version.
CREATE OR REPLACE VIEW:"SCHEMA"."structures_core" AS
SELECT
  s."id" AS "id",
  s."codeBhasile" AS "codeBhasile",
  sv."type" AS "structureType",
  s."createdAt" AS "createdAt",
  s."updatedAt" AS "updatedAt",
  sv."departementAdministratif" AS "departementAdministratif",
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
  LEFT JOIN:"SCHEMA"."structures_current_version" scv ON scv."structureId" = s."id"
  LEFT JOIN public."StructureVersion" sv ON sv."id" = scv."version_id"
  LEFT JOIN public."Operateur" o ON o."id" = s."operateurId"
  LEFT JOIN public."Departement" dep ON dep."numero" = sv."departementAdministratif"
  LEFT JOIN public."Region" r ON r."id" = dep."regionId"
  LEFT JOIN public."DnaStructure" ds ON ds."structureVersionId" = scv."version_id"
  LEFT JOIN public."Dna" dna ON dna."id" = ds."dnaId"
GROUP BY
  s."id",
  s."codeBhasile",
  sv."type",
  s."createdAt",
  s."updatedAt",
  sv."departementAdministratif",
  dep."name",
  r."name",
  o."name";
