-- Objective: finance quality indicators per structure
-- One row per structure, boolean columns for finance-related data quality issues
--
-- Notes:
-- - Financial indicators rely on `public."Budget"`
-- - "résultat net" is computed as `totalProduits - totalCharges` (it is not stored in DB)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_finance_quality" AS
WITH
  structures AS (
    SELECT
      s."id",
      s."type" AS "structureType",
      s."creationDate" AS "creationDate",
      s."date303" AS "date303",
      s."departementAdministratif" AS "departementAdministratif"
    FROM
      public."Structure" s
  ),
  bound_dates AS (
    SELECT
      s."id" AS "structureId",
      EXTRACT(
        YEAR
        FROM
          COALESCE(s."date303", s."creationDate")
      )::int AS "startYear",
      EXTRACT(
        YEAR
        FROM
          CURRENT_DATE
      )::int AS "endYearExclusive"
    FROM
      structures s
  ),
  structures_with_idf_boolean AS (
    SELECT
      s."id",
      s."structureType",
      COALESCE(r."code" = 'FR-IDF', FALSE) AS "belongsToIdf"
    FROM
      structures s
      LEFT JOIN public."Departement" dep ON dep."numero" = s."departementAdministratif"
      LEFT JOIN public."Region" r ON r."id" = dep."regionId"
  ),
  tarifs AS (
    SELECT
      si."id" AS "structureId",
      t."tarifCible"
    FROM
      structures_with_idf_boolean si
      LEFT JOIN reporting."TarifJournalierCible" t ON t."structureType" = si."structureType"
      AND t."belongsToIdf" = si."belongsToIdf"
  ),
  -- filter budgets from the structure date 303 joining year, or creation year to the current year
  budgets_filtered AS (
    SELECT
      b.*
    FROM
      public."Budget" b
      JOIN bound_dates bd ON bd."structureId" = b."structureId"
    WHERE
      b."structureId" IS NOT NULL
      AND b."year" >= bd."startYear"
      AND b."year" < bd."endYearExclusive"
      AND b."isMissing" IS NOT TRUE
  ),
  -- filter financial indicators on the same year range as budgets and keep one row per structure/year: REALISE first, PREVISIONNEL as a fallback
  indicateurs_financiers_filtered AS (
    SELECT DISTINCT
      ON (i."structureId", i."year") i.*
    FROM
      public."IndicateurFinancier" i
      JOIN bound_dates bd ON bd."structureId" = i."structureId"
    WHERE
      i."structureId" IS NOT NULL
      AND i."year" >= bd."startYear"
      AND i."year" < bd."endYearExclusive"
      AND i."isMissing" IS NOT TRUE
    ORDER BY
      i."structureId",
      i."year",
      CASE
        WHEN i."type" = 'REALISE' THEN 0
        ELSE 1
      END
  ),
  budgets_enriched AS (
    SELECT
      b."structureId" AS "structureId",
      b."year" AS "year",
      b."totalProduits" AS "totalProduits",
      b."totalCharges" AS "totalCharges",
      -- Résultat net: NULL if both are null, otherwise compute the difference
      CASE
        WHEN b."totalProduits" IS NULL
        AND b."totalCharges" IS NULL THEN NULL
        ELSE COALESCE(b."totalProduits", 0) - COALESCE(b."totalCharges", 0)
      END AS "resultat_net",
      b."repriseEtat" AS "repriseEtat",
      b."excedentRecupere" AS "excedentRecupere",
      b."excedentDeduit" AS "excedentDeduit",
      b."fondsDedies" AS "fondsDedies",
      b."affectationReservesFondsDedies" AS "affectationReservesFondsDedies",
      b."reserveInvestissement" AS "reserveInvestissement",
      b."chargesNonReconductibles" AS "chargesNonReconductibles",
      b."reserveCompensationDeficits" AS "reserveCompensationDeficits",
      b."reserveCompensationBFR" AS "reserveCompensationBFR",
      b."reserveCompensationAmortissements" AS "reserveCompensationAmortissements",
      b."reportANouveau" AS "reportANouveau",
      b."autre" AS "autre",
      -- Sum of the tarifée affectation breakdown
      NULLIF(
        COALESCE(b."reserveInvestissement", 0) + COALESCE(b."chargesNonReconductibles", 0) + COALESCE(b."reserveCompensationDeficits", 0) + COALESCE(b."reserveCompensationBFR", 0) + COALESCE(b."reserveCompensationAmortissements", 0) + COALESCE(b."reportANouveau", 0) + COALESCE(b."autre", 0),
        0
      ) AS "sum_breakdown_affectations"
    FROM
      budgets_filtered b
  ),
  budgets_rates AS (
    SELECT
      i."structureId" AS "structureId",
      MAX(i."tauxEncadrement") AS taux_encadrement_max,
      MIN(i."tauxEncadrement") AS taux_encadrement_min,
      MAX(i."coutJournalier") AS cout_journalier_max,
      MIN(i."coutJournalier") AS cout_journalier_min
    FROM
      indicateurs_financiers_filtered i
    GROUP BY
      i."structureId"
  ),
  budget_indicators AS (
    SELECT
      s."id",
      -- Résultat net = 0 is considered an issue (exclut les NULL)
      BOOL_OR(be."resultat_net" = 0) AS "has_issue_resultat_net_eq_0",
      -- Authorized structures: affectationReservesFondsDedies is filled but breakdown detail is missing, when resultat_net is non-zero
      BOOL_OR(
        s."structureType" IN ('CADA', 'CPH')
        AND be."resultat_net" IS NOT NULL
        AND be."resultat_net" <> 0
        AND COALESCE(be."affectationReservesFondsDedies", 0) <> 0
        AND be."sum_breakdown_affectations" IS NULL
      ) AS "has_issue_authorized_affectations_breakdown_missing",
      -- Authorized structures: repriseEtat + affectationReservesFondsDedies must equal resultat_net (within epsilon)
      BOOL_OR(
        s."structureType" IN ('CADA', 'CPH')
        AND be."resultat_net" IS NOT NULL
        AND be."affectationReservesFondsDedies" IS NOT NULL
        AND ABS(
          (
            COALESCE(be."repriseEtat", 0) + COALESCE(be."affectationReservesFondsDedies", 0)
          ) - be."resultat_net"
        ) > 0.01
      ) AS "has_issue_authorized_reprise_plus_affectations_mismatch",
      -- Authorized structures: sign error on repriseEtat - equation holds only with flipped sign
      BOOL_OR(
        s."structureType" IN ('CADA', 'CPH')
        AND be."resultat_net" IS NOT NULL
        AND be."repriseEtat" IS NOT NULL
        AND be."affectationReservesFondsDedies" IS NOT NULL
        AND ABS(
          (
            COALESCE(be."repriseEtat", 0) + COALESCE(be."affectationReservesFondsDedies", 0)
          ) - be."resultat_net"
        ) > 0.01
        AND ABS(
          (
            - COALESCE(be."repriseEtat", 0) + COALESCE(be."affectationReservesFondsDedies", 0)
          ) - be."resultat_net"
        ) <= 0.01
      ) AS "has_issue_authorized_reprise_wrong_sign",
      -- Subsidized structures: resultat_net < 0 => excedentRecupere, excedentDeduit, fondsDedies must all be 0/NULL
      BOOL_OR(
        s."structureType" IN ('HUDA', 'CAES')
        AND be."resultat_net" < 0
        AND (
          COALESCE(be."excedentRecupere", 0) <> 0
          OR COALESCE(be."excedentDeduit", 0) <> 0
          OR COALESCE(be."fondsDedies", 0) <> 0
        )
      ) AS "has_issue_subsidized_deficit_nonzero_boxes",
      -- Subsidized structures: resultat_net > 0 => repriseEtat must be 0/NULL
      BOOL_OR(
        s."structureType" IN ('HUDA', 'CAES')
        AND be."resultat_net" > 0
        AND COALESCE(be."repriseEtat", 0) <> 0
      ) AS "has_issue_subsidized_reprise_etat_nonzero",
      -- Subsidized structures: resultat_net > 0 => excedentRecupere + excedentDeduit + fondsDedies must equal resultat_net
      BOOL_OR(
        s."structureType" IN ('HUDA', 'CAES')
        AND be."resultat_net" > 0
        AND ABS(
          (
            COALESCE(be."excedentRecupere", 0) + COALESCE(be."excedentDeduit", 0) + COALESCE(be."fondsDedies", 0)
          ) - be."resultat_net"
        ) > 0.01
      ) AS "has_issue_subsidized_excedent_rules"
    FROM
      structures s
      LEFT JOIN budgets_enriched be ON be."structureId" = s."id"
    GROUP BY
      s."id"
  )
SELECT
  s."id" AS "id",
  -- Taux encadrement > seuil selon financement :
  -- tarifées (CADA/CPH) : 1 ETP / 15
  -- subventionnées (HUDA/CAES) : 1 ETP / 25
  -- TODO : affiner par la suite, cela dépend aussi des structures anciennement HUDA passées CADA avec une répartition au proprata des places historiques
  CASE
    WHEN s."structureType" IN ('CADA', 'CPH') THEN COALESCE(br."taux_encadrement_max" > 20, FALSE)
    WHEN s."structureType" IN ('HUDA', 'CAES') THEN COALESCE(br."taux_encadrement_max" > 25, FALSE)
    ELSE FALSE
  END AS "has_issue_taux_encadrement_max_gt_threshold",
  -- Budget rates: taux d'encadrement min equals 0 (NULL does not count as issue)
  COALESCE(br."taux_encadrement_min" < 2, FALSE) AS "has_issue_taux_encadrement_min_lt_2",
  -- Budget rates: coût journalier max > tarif cible (par type et zonage IDF / non-IDF)
  COALESCE(br."cout_journalier_max" > tc."tarifCible", FALSE) AS "has_issue_cout_journalier_max_gt_tarif_cible",
  -- Budget rates: coût journalier min < 15 (across filtered years)
  COALESCE(br."cout_journalier_min" < 15, FALSE) AS "has_issue_cout_journalier_min_lt_15",
  -- Budget indicators (aggregated from multiple years)
  COALESCE(bi."has_issue_resultat_net_eq_0", FALSE) AS "has_issue_resultat_net_eq_0",
  COALESCE(bi."has_issue_authorized_affectations_breakdown_missing", FALSE) AS "has_issue_authorized_affectations_breakdown_missing",
  COALESCE(bi."has_issue_authorized_reprise_plus_affectations_mismatch", FALSE) AS "has_issue_authorized_reprise_plus_affectations_mismatch",
  COALESCE(bi."has_issue_authorized_reprise_wrong_sign", FALSE) AS "has_issue_authorized_reprise_wrong_sign",
  COALESCE(bi."has_issue_subsidized_deficit_nonzero_boxes", FALSE) AS "has_issue_subsidized_deficit_nonzero_boxes",
  COALESCE(bi."has_issue_subsidized_reprise_etat_nonzero", FALSE) AS "has_issue_subsidized_reprise_etat_nonzero",
  COALESCE(bi."has_issue_subsidized_excedent_rules", FALSE) AS "has_issue_subsidized_excedent_rules"
FROM
  structures s
  LEFT JOIN budget_indicators bi ON bi."id" = s."id"
  LEFT JOIN budgets_rates br ON br."structureId" = s."id"
  LEFT JOIN tarifs tc ON tc."structureId" = s."id";
