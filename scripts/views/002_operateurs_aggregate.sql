-- Objective: aggregate all the data for the operateurs
CREATE OR REPLACE VIEW:"SCHEMA"."operateurs_aggregates" AS
SELECT
  o."id",
  o."name",
  o."directionGenerale",
  o."siegeSocial",
  o."siret",
  o."createdAt",
  o."updatedAt",
  COUNT(DISTINCT s."id") AS "nb_structures",
  SUM(sa."places_autorisees_structure") AS "places_autorisees_structure"
FROM
  public."Operateur" o
  LEFT JOIN public."Structure" s ON s."operateurId" = o."id"
  LEFT JOIN:"SCHEMA"."structures_aggregates" sa ON sa."id" = s."id"
GROUP BY
  o."id",
  o."name",
  o."directionGenerale",
  o."siegeSocial",
  o."siret",
  o."createdAt",
  o."updatedAt";
