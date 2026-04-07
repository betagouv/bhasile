-- Objective: global data quality indicators per structure
-- One row per structure, aggregates all quality indicators from thematic views
--
-- This view aggregates:
-- - structures_calendar_quality: calendar-related indicators (authorization, conventions)
-- - structures_places_quality: places-related indicators (specific places vs authorized)
-- - structures_finance_quality: finance-related indicators (budgets, affectations)
-- - structures_characteristics_quality: characteristics (e.g. DNA vs departement)
CREATE OR REPLACE VIEW :"SCHEMA"."structures_global_quality" AS
SELECT sc."id" AS "id",
  sc."codeBhasile" AS "codeBhasile",
  sc."operateur" AS "operateur",
  sc."departementAdministratif" AS "departementAdministratif",
  sc."departement" AS "departement",
  sc."region" AS "region",
  sc."dna_codes" AS "dna_codes",
  sc."updatedAt" AS "updatedAt",
  -- Calendar indicators
  -- Calendar: missing authorization dates for authorized structures
  COALESCE(cal."has_authorisation_dates_undefined", FALSE) AS "has_authorisation_dates_undefined",
  -- Calendar: authorization period is not 15 years (authorized structures)
  COALESCE(
    cal."has_issue_authorisation_period_not_15y",
    FALSE
  ) AS "has_issue_authorisation_period_not_15y",
  -- Calendar: missing convention dates
  COALESCE(cal."has_convention_dates_undefined", FALSE) AS "has_convention_dates_undefined",
  -- Calendar: convention duration not 5 years (authorized structures)
  COALESCE(
    cal."has_issue_authorized_convention_not_5y",
    FALSE
  ) AS "has_issue_authorized_convention_not_5y",
  -- Calendar: convention outside authorization period (authorized structures)
  COALESCE(
    cal."has_issue_authorized_convention_outside_authorisation_period",
    FALSE
  ) AS "has_issue_authorized_convention_outside_authorisation_period",
  -- Calendar: convention duration > 3 years (subsidized structures)
  COALESCE(
    cal."has_issue_subsidized_convention_gt_3y",
    FALSE
  ) AS "has_issue_subsidized_convention_gt_3y",
  -- Places indicators
  -- Places: specific places (LGBT/FVV TEH/PMR) exceed authorized places
  COALESCE(
    pl."has_issue_specific_places_gt_places_autorisees",
    FALSE
  ) AS "has_issue_specific_places_gt_places_autorisees",
  -- Places: structure places differ from sum of address places by > 10%
  COALESCE(
    pl."has_issue_places_structure_vs_address_diff_gt_10pct",
    FALSE
  ) AS "has_issue_places_structure_vs_address_diff_gt_10pct",
  -- Characteristics indicators
  -- Characteristics: DNA code departement prefix mismatch with structure departement
  COALESCE(ch."has_issue_dept_code", FALSE) AS "has_issue_dept_code",
  -- Finance indicators
  -- Finance: taux d'encadrement max > 25
  COALESCE(
    fin."has_issue_taux_encadrement_max_gt_25",
    FALSE
  ) AS "has_issue_taux_encadrement_max_gt_25",
  -- Finance: taux d'encadrement min equals 0 (NULL does not count)
  COALESCE(fin."has_issue_taux_encadrement_min_eq_0", FALSE) AS "has_issue_taux_encadrement_min_eq_0",
  -- Finance: coût journalier max > 25
  COALESCE(fin."has_issue_cout_journalier_max_gt_35", FALSE) AS "has_issue_cout_journalier_max_gt_35",
  -- Finance: coût journalier min < 15
  COALESCE(fin."has_issue_cout_journalier_min_lt_15", FALSE) AS "has_issue_cout_journalier_min_lt_15",
  -- Finance: résultat net equals 0 (excludes NULL) for at least one filtered year
  COALESCE(fin."has_issue_resultat_net_eq_0", FALSE) AS "has_issue_resultat_net_eq_0",
  -- Finance (authorized): excedent but affectations breakdown missing (all NULL/0)
  COALESCE(
    fin."has_issue_authorized_affectations_breakdown_missing",
    FALSE
  ) AS "has_issue_authorized_affectations_breakdown_missing",
  -- Finance (authorized): repriseEtat + affectations does not match résultat net
  COALESCE(
    fin."has_issue_authorized_reprise_plus_affectations_mismatch",
    FALSE
  ) AS "has_issue_authorized_reprise_plus_affectations_mismatch",
  -- Finance (subsidized): deficit but nonzero values in forbidden buckets
  COALESCE(
    fin."has_issue_subsidized_deficit_nonzero_boxes",
    FALSE
  ) AS "has_issue_subsidized_deficit_nonzero_boxes",
  -- Finance (subsidized): excedent rules not respected
  COALESCE(fin."has_issue_subsidized_excedent_rules", FALSE) AS "has_issue_subsidized_excedent_rules",
  -- Count total number of issues (true values)
  (
    (
      COALESCE(cal."has_authorisation_dates_undefined", FALSE)::int
    ) + (
      COALESCE(
        cal."has_issue_authorisation_period_not_15y",
        FALSE
      )::int
    ) + (
      COALESCE(cal."has_convention_dates_undefined", FALSE)::int
    ) + (
      COALESCE(
        cal."has_issue_authorized_convention_not_5y",
        FALSE
      )::int
    ) + (
      COALESCE(
        cal."has_issue_authorized_convention_outside_authorisation_period",
        FALSE
      )::int
    ) + (
      COALESCE(
        cal."has_issue_subsidized_convention_gt_3y",
        FALSE
      )::int
    ) + (
      COALESCE(
        pl."has_issue_specific_places_gt_places_autorisees",
        FALSE
      )::int
    ) + (
      COALESCE(
        pl."has_issue_places_structure_vs_address_diff_gt_10pct",
        FALSE
      )::int
    ) + (COALESCE(ch."has_issue_dept_code", FALSE)::int) + (
      COALESCE(
        fin."has_issue_taux_encadrement_max_gt_25",
        FALSE
      )::int
    ) + (
      COALESCE(fin."has_issue_taux_encadrement_min_eq_0", FALSE)::int
    ) + (
      COALESCE(fin."has_issue_cout_journalier_max_gt_25", FALSE)::int
    ) + (
      COALESCE(fin."has_issue_cout_journalier_min_lt_15", FALSE)::int
    ) + (
      COALESCE(fin."has_issue_resultat_net_eq_0", FALSE)::int
    ) + (
      COALESCE(
        fin."has_issue_authorized_affectations_breakdown_missing",
        FALSE
      )::int
    ) + (
      COALESCE(
        fin."has_issue_authorized_reprise_plus_affectations_mismatch",
        FALSE
      )::int
    ) + (
      COALESCE(
        fin."has_issue_subsidized_deficit_nonzero_boxes",
        FALSE
      )::int
    ) + (
      COALESCE(fin."has_issue_subsidized_excedent_rules", FALSE)::int
    )
  ) AS "issues_count"
FROM :"SCHEMA"."structures_core" sc
  LEFT JOIN :"SCHEMA"."structures_calendar_quality" cal ON cal."id" = sc."id"
  LEFT JOIN :"SCHEMA"."structures_places_quality" pl ON pl."id" = sc."id"
  LEFT JOIN :"SCHEMA"."structures_characteristics_quality" ch ON ch."id" = sc."id"
  LEFT JOIN :"SCHEMA"."structures_finance_quality" fin ON fin."id" = sc."id"
  LEFT JOIN public."Form" f ON f."structureId" = sc."id"
  LEFT JOIN public."FormDefinition" fd ON fd."id" = f."formDefinitionId"
WHERE fd."slug" = 'finalisation-v1'
  AND f."status" = TRUE;