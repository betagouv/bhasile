-- Objective: enable structure ordering in front-end
-- This view is in public to prevent interruption in the application if the reporting schema is not created yet
DROP VIEW IF EXISTS "public"."structures_order";


CREATE VIEW "public"."structures_order" AS
WITH
  dernier_millesime_structure_typologie AS (
    SELECT DISTINCT
      ON (st."structureId") st."structureId",
      st."placesAutorisees",
      st."year"
    FROM
      public."StructureTypologie" st
    ORDER BY
      st."structureId",
      st."year" DESC
  ),
  structure_repartition AS (
    SELECT
      a."structureId",
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
      a."structureId"
  )
SELECT
  s.id,
  s."codeBhasile",
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
      f."structureId" = s."id"
  ) AS "hasForms"
FROM
  public."Structure" s
  LEFT JOIN public."Operateur" o ON o.id = s."operateurId"
  LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s."id"
  LEFT JOIN structure_repartition sr ON sr."structureId" = s."id"
  LEFT JOIN public."Departement" d ON d."numero" = s."departementAdministratif";
