-- Objective: enable structure ordering in front-end
-- This view is in public to prevent interruption in the application if the reporting schema is not created yet
CREATE OR REPLACE VIEW "public"."structures_order" AS
WITH
  dernier_millesime_structure_typologie AS (
    SELECT DISTINCT
      ON (st."structureDnaCode") st."structureDnaCode",
      st."placesAutorisees",
      st."year"
    FROM
      public."StructureTypologie" st
    ORDER BY
      st."structureDnaCode",
      st."year" DESC
  ),
  structure_repartition AS (
    SELECT
      a."structureDnaCode",
      CASE
        WHEN BOOL_AND(a.repartition = 'COLLECTIF'::public."Repartition") THEN 'COLLECTIF'
        WHEN BOOL_AND(a.repartition = 'DIFFUS'::public."Repartition") THEN 'DIFFUS'
        ELSE 'MIXTE'
      END AS bati
    FROM
      public."Adresse" a
    WHERE
      a.repartition IS NOT NULL
    GROUP BY
      a."structureDnaCode"
  )
SELECT
  s.id,
  s."dnaCode",
  s."finessCode",
  s."nom",
  s."adresseAdministrative",
  s."codePostalAdministratif",
  s."communeAdministrative",
  s."departementAdministratif",
  d."region",
  s."type"::text,
  o."name" AS "operateur",
  sr."bati",
  st."placesAutorisees",
  s."finConvention",
  EXISTS (
    SELECT
      1
    FROM
      public."Form" f
    WHERE
      f."structureCodeDna" = s."dnaCode"
  ) AS "hasForms"
FROM
  public."Structure" s
  LEFT JOIN public."Operateur" o ON o.id = s."operateurId"
  LEFT JOIN dernier_millesime_structure_typologie st ON st."structureDnaCode" = s."dnaCode"
  LEFT JOIN structure_repartition sr ON sr."structureDnaCode" = s."dnaCode"
  LEFT JOIN public."Departement" d ON d."numero" = s."departementAdministratif"
