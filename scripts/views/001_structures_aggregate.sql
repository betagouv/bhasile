-- Objective: aggregate indicators per structure
CREATE OR REPLACE VIEW:"SCHEMA"."structures_aggregates" AS
WITH -- Last typology by structure
  structure_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (st."structureDnaCode") st."structureDnaCode",
      st."placesAutorisees",
      st."pmr",
      st."lgbt",
      st."fvvTeh",
      st."year"
    FROM
      public."StructureTypologie" st
    ORDER BY
      st."structureDnaCode",
      st."year" DESC
  ),
  -- Last typology by address
  adresse_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (aty."adresseId") a."structureDnaCode",
      a."id" AS "adresse_id",
      aty."placesAutorisees",
      aty."qpv",
      aty."logementSocial",
      aty."year"
    FROM
      public."AdresseTypologie" aty
      JOIN public."Adresse" a ON a."id" = aty."adresseId"
    ORDER BY
      aty."adresseId",
      aty."year" DESC
  ),
  -- Last activite by structure
  activite_dernier_millesime AS (
    SELECT DISTINCT
      ON (sa."structureDnaCode") sa."structureDnaCode",
      sa."date",
      sa."placesAutorisees"
    FROM
      public."Activite" sa
    ORDER BY
      sa."structureDnaCode",
      sa."date" DESC
  ),
  -- Aggregate by structure on the last typologies of addresses
  adresses_agregees AS (
    SELECT
      adm."structureDnaCode",
      COUNT(DISTINCT adm."adresse_id") AS nb_adresses,
      SUM(adm."placesAutorisees") AS places_autorisees_adresse,
      SUM(adm."qpv") AS qpv_adresse,
      SUM(adm."logementSocial") AS logement_social_adresse,
      MAX(adm."year") AS year_adresse
    FROM
      adresse_typologie_dernier_millesime adm
    GROUP BY
      adm."structureDnaCode"
  ),
  -- Last dotationAccordee by structure (most recent budget)
  budget_dernier_millesime AS (
    SELECT DISTINCT
      ON (b."structureDnaCode") b."structureDnaCode",
      b."dotationAccordee"
    FROM
      public."Budget" b
    ORDER BY
      b."structureDnaCode",
      b."year" DESC
  ),
  -- Aggregate budgets by structure
  budgets_agreges AS (
    SELECT
      b."structureDnaCode",
      MAX(b."tauxEncadrement") AS taux_encadrement_max,
      MIN(b."tauxEncadrement") AS taux_encadrement_min,
      MAX(b."coutJournalier") AS cout_journalier_max,
      MIN(b."coutJournalier") AS cout_journalier_min,
      COALESCE(
        COALESCE((MAX(b."tauxEncadrement") > 25)::int, 1) + COALESCE((MIN(b."tauxEncadrement") < 15)::int, 1) + COALESCE((MAX(b."coutJournalier") > 25)::int, 1) + COALESCE((MIN(b."coutJournalier") < 15)::int, 1),
        0
      ) AS "indicateurs_budgetaires"
    FROM
      public."Budget" b
    GROUP BY
      b."structureDnaCode"
  ),
  -- Calculs agrégés avec différences et pourcentages
  places_agregees AS (
    SELECT
      s."dnaCode",
      sdm."placesAutorisees" AS places_autorisees_structure,
      aa."places_autorisees_adresse",
      adm."placesAutorisees" AS nb_places_activite,
      -- Differences and percentages
      COALESCE(sdm."placesAutorisees", 0) - COALESCE(aa."places_autorisees_adresse", 0) AS diff_places_adresse,
      COALESCE(
        ABS(
          COALESCE(sdm."placesAutorisees", 0) - COALESCE(aa."places_autorisees_adresse", 0)
        ) / NULLIF(COALESCE(sdm."placesAutorisees", 0)::float, 0) * 100,
        0
      ) AS pct_diff_places_adresse,
      COALESCE(adm."placesAutorisees", 0) - COALESCE(sdm."placesAutorisees", 0) AS diff_places_activite,
      COALESCE(
        ABS(COALESCE(adm."placesAutorisees", 0) - COALESCE(sdm."placesAutorisees", 0)) / NULLIF(COALESCE(adm."placesAutorisees", 0)::float, 0) * 100,
        0
      ) AS pct_diff_places_activite
    FROM
      public."Structure" s
      LEFT JOIN structure_typologie_dernier_millesime sdm ON sdm."structureDnaCode" = s."dnaCode"
      LEFT JOIN adresses_agregees aa ON aa."structureDnaCode" = s."dnaCode"
      LEFT JOIN activite_dernier_millesime adm ON adm."structureDnaCode" = s."dnaCode"
  ),
  places_agregees_indicateurs AS (
    SELECT
      p."dnaCode",
      COALESCE((pct_diff_places_adresse > 10)::int, 0) + COALESCE((pct_diff_places_activite > 10)::int, 0) AS indicateurs_places_agregees
    FROM
      places_agregees p
  )
SELECT
  s."dnaCode" AS "dnaCode",
  o."name" AS "operateur",
  s.latitude AS "latitude",
  s.longitude AS "longitude",
  s.public AS "public",
  s.type AS "type",
  d."region" AS "region",
  pa.places_autorisees_structure AS "places_autorisees_structure",
  sdm."pmr" AS "pmr_structure",
  sdm."lgbt" AS "lgbt_structure",
  sdm."fvvTeh" AS "fvv_teh_structure",
  aa."places_autorisees_adresse" AS "places_autorisees_adresse",
  aa."qpv_adresse" AS "qpv_adresse",
  aa."logement_social_adresse" AS "logement_social_adresse",
  aa."year_adresse" AS "year_adresse",
  aa."nb_adresses" AS "nb_adresses",
  sdm."year" AS "year_structure",
  pa.nb_places_activite AS "nb_places_activite",
  pa.diff_places_adresse AS "diff_places_adresse",
  pa.pct_diff_places_adresse AS "pct_diff_places_adresse",
  pa.diff_places_activite AS "diff_places_activite",
  pa.pct_diff_places_activite AS "pct_diff_places_activite",
  COALESCE(pai."indicateurs_places_agregees", 5) AS "indicateurs_places_agregees",
  ba."taux_encadrement_max" AS "taux_encadrement_max",
  ba."taux_encadrement_min" AS "taux_encadrement_min",
  ba."cout_journalier_max" AS "cout_journalier_max",
  ba."cout_journalier_min" AS "cout_journalier_min",
  COALESCE(ba."indicateurs_budgetaires", 5) AS "indicateurs_budgetaires",
  COALESCE(pai."indicateurs_places_agregees", 5) + COALESCE(ba."indicateurs_budgetaires", 5) AS "indicateurs_structure",
  bdm."dotationAccordee" AS "dotation_accordee_derniere_annee",
  s."createdAt" AS "created_at",
  s."updatedAt" AS "updated_at"
FROM
  public."Structure" s
  LEFT JOIN places_agregees pa ON pa."dnaCode" = s."dnaCode"
  LEFT JOIN structure_typologie_dernier_millesime sdm ON sdm."structureDnaCode" = s."dnaCode"
  LEFT JOIN adresses_agregees aa ON aa."structureDnaCode" = s."dnaCode"
  LEFT JOIN places_agregees_indicateurs pai ON pai."dnaCode" = s."dnaCode"
  LEFT JOIN budgets_agreges ba ON ba."structureDnaCode" = s."dnaCode"
  LEFT JOIN budget_dernier_millesime bdm ON bdm."structureDnaCode" = s."dnaCode"
  LEFT JOIN public."Departement" d ON d."numero" = s."departementAdministratif"
  LEFT JOIN public."Operateur" o ON o."id" = s."operateurId";
