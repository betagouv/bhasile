-- Objective: global data quality indicators per structure
-- One row per structure, aggregates all quality indicators from thematic views
CREATE OR REPLACE VIEW:"SCHEMA"."structures_global_quality" AS
SELECT
  sc."id" AS "id",
  sc."codeBhasile" AS "code_bhasile",
  sc."operateur" AS "operateur",
  sc."departementAdministratif" AS "departement_administratif",
  sc."departement" AS "departement",
  sc."region" AS "region",
  sc."dna_codes" AS "dna_codes",
  sc."updatedAt" AS "updated_at",
  -- Calendar indicators
  -- Calendar: authorization period is not 15 years (authorized structures, from actes administratifs)
  COALESCE(cal."has_issue_authorisation_period_not_15y", FALSE) AS "has_issue_authorisation_period_not_15y",
  -- Calendar: convention duration not 5 years (authorized structures, from actes administratifs)
  COALESCE(cal."has_issue_authorized_convention_not_5y", FALSE) AS "has_issue_authorized_convention_not_5y",
  -- Calendar: convention outside authorization period (authorized structures)
  COALESCE(cal."has_issue_authorized_convention_outside_authorisation_period", FALSE) AS "has_issue_authorized_convention_outside_authorisation_period",
  -- Calendar: missing or expired convention
  COALESCE(cal."has_issue_authorized_convention_missing_or_expired", FALSE) AS "has_issue_authorized_convention_missing_or_expired",
  -- Calendar: convention dates differ from Actes Administratifs (when present)
  COALESCE(cal."has_issue_convention_dates_differ_from_actes_administratifs", FALSE) AS "has_issue_convention_dates_differ_from_actes_administratifs",
  -- Calendar: authorisation dates differ from Actes Administratifs (when present)
  COALESCE(cal."has_issue_authorisation_dates_differ_from_actes_administratifs", FALSE) AS "has_issue_authorisation_dates_differ_from_actes_administratifs",
  -- Calendar: evaluation not done in time
  COALESCE(cal."has_issue_evaluation_not_done_in_time", FALSE) AS "has_issue_evaluation_not_done_in_time",
  -- Calendar: convention duration > 3 years (subsidized structures)
  COALESCE(cal."has_issue_subsidized_convention_gt_3y", FALSE) AS "has_issue_subsidized_convention_gt_3y",
  -- Places indicators
  -- Places: specific places (LGBT/FVV TEH/PMR) exceed authorized places
  COALESCE(pl."has_issue_specific_places_gt_places_autorisees", FALSE) AS "has_issue_specific_places_gt_places_autorisees",
  -- Places: structure places differ from sum of address places by > 10%
  COALESCE(pl."has_issue_places_structure_vs_address_diff_gt_10pct", FALSE) AS "has_issue_places_structure_vs_address_diff_gt_10pct",
  -- Characteristics indicators
  -- Characteristics: DNA code departement prefix mismatch with structure departement
  COALESCE(ch."has_issue_dept_code", FALSE) AS "has_issue_dept_code",
  -- Characteristics: structure linked to multiple DNAs
  COALESCE(ch."has_issue_multi_dna", FALSE) AS "has_issue_multi_dna",
  -- Characteristics: structure associated to a mono-structure CPOM
  COALESCE(ch."has_issue_cpom_mono_structure", FALSE) AS "has_issue_cpom_mono_structure",
  -- Finance indicators
  -- Finance: taux d'encadrement > seuil selon type
  COALESCE(fin."has_issue_taux_encadrement_max_gt_threshold", FALSE) AS "has_issue_taux_encadrement_max_gt_threshold",
  -- Finance: taux d'encadrement min equals 0 (NULL does not count)
  COALESCE(fin."has_issue_taux_encadrement_min_lt_2", FALSE) AS "has_issue_taux_encadrement_min_lt_2",
  -- Finance: coût journalier max > tarif cible (par type et zonage IDF / non-IDF)
  COALESCE(fin."has_issue_cout_journalier_max_gt_tarif_cible", FALSE) AS "has_issue_cout_journalier_max_gt_tarif_cible",
  -- Finance: coût journalier min < 15
  COALESCE(fin."has_issue_cout_journalier_min_lt_15", FALSE) AS "has_issue_cout_journalier_min_lt_15",
  -- Finance: résultat net equals 0 (excludes NULL) for at least one filtered year
  COALESCE(fin."has_issue_resultat_net_eq_0", FALSE) AS "has_issue_resultat_net_eq_0",
  -- Finance (authorized): excedent but affectations breakdown missing (all NULL/0)
  COALESCE(fin."has_issue_authorized_affectations_breakdown_missing", FALSE) AS "has_issue_authorized_affectations_breakdown_missing",
  -- Finance (authorized): affectations breakdown sum does not match affectationReservesFondsDedies
  COALESCE(fin."has_issue_authorized_affectations_breakdown_mismatch", FALSE) AS "has_issue_authorized_affectations_breakdown_mismatch",
  -- Finance (authorized): repriseEtat + affectationReservesFondsDedies does not match résultat net
  COALESCE(fin."has_issue_authorized_reprise_plus_affectations_mismatch", FALSE) AS "has_issue_authorized_reprise_plus_affectations_mismatch",
  -- Finance (authorized): sign error on repriseEtat (equation holds only with flipped sign)
  COALESCE(fin."has_issue_authorized_reprise_wrong_sign", FALSE) AS "has_issue_authorized_reprise_wrong_sign",
  -- Finance (subsidized): resultat_net < 0 but excedentRecupere/excedentDeduit/fondsDedies are non-zero
  COALESCE(fin."has_issue_subsidized_deficit_nonzero_boxes", FALSE) AS "has_issue_subsidized_deficit_nonzero_boxes",
  -- Finance (subsidized): resultat_net > 0 but repriseEtat is non-zero
  COALESCE(fin."has_issue_subsidized_excedent_reprise_etat_nonzero", FALSE) AS "has_issue_subsidized_excedent_reprise_etat_nonzero",
  -- Finance (subsidized): excedentRecupere + excedentDeduit + fondsDedies does not match résultat net
  COALESCE(fin."has_issue_subsidized_excedent_rules", FALSE) AS "has_issue_subsidized_excedent_rules",
  -- Documents
  COALESCE(doc."has_issue_missing_convention_document", FALSE) AS "has_issue_missing_convention_document",
  COALESCE(doc."has_issue_missing_autorisation_document", FALSE) AS "has_issue_missing_autorisation_document",
  COALESCE(doc."has_issue_missing_cpom_document", FALSE) AS "has_issue_missing_cpom_document",
  -- Activite
  COALESCE(act."has_issue_places_indisponibles_gt_3pct", FALSE) AS "has_issue_places_indisponibles_gt_3pct",
  COALESCE(act."has_issue_presences_indues_gt_7pct", FALSE) AS "has_issue_presences_indues_gt_7pct",
  -- Count total number of issues (true values)
  (
    (COALESCE(cal."has_issue_authorisation_period_not_15y", FALSE)::int) + (COALESCE(cal."has_issue_authorized_convention_not_5y", FALSE)::int) + (
      COALESCE(cal."has_issue_authorized_convention_outside_authorisation_period", FALSE)::int
    ) + (COALESCE(cal."has_issue_authorized_convention_missing_or_expired", FALSE)::int) + (
      COALESCE(cal."has_issue_convention_dates_differ_from_actes_administratifs", FALSE)::int
    ) + (
      COALESCE(cal."has_issue_authorisation_dates_differ_from_actes_administratifs", FALSE)::int
    ) + (COALESCE(cal."has_issue_evaluation_not_done_in_time", FALSE)::int) + (COALESCE(cal."has_issue_subsidized_convention_gt_3y", FALSE)::int) + (COALESCE(pl."has_issue_specific_places_gt_places_autorisees", FALSE)::int) + (COALESCE(pl."has_issue_places_structure_vs_address_diff_gt_10pct", FALSE)::int) + (COALESCE(ch."has_issue_dept_code", FALSE)::int) + (COALESCE(ch."has_issue_multi_dna", FALSE)::int) + (COALESCE(ch."has_issue_cpom_mono_structure", FALSE)::int) + (COALESCE(fin."has_issue_taux_encadrement_max_gt_threshold", FALSE)::int) + (COALESCE(fin."has_issue_taux_encadrement_min_lt_2", FALSE)::int) + (COALESCE(fin."has_issue_cout_journalier_max_gt_tarif_cible", FALSE)::int) + (COALESCE(fin."has_issue_cout_journalier_min_lt_15", FALSE)::int) + (COALESCE(fin."has_issue_resultat_net_eq_0", FALSE)::int) + (COALESCE(fin."has_issue_authorized_affectations_breakdown_missing", FALSE)::int) + (
      COALESCE(fin."has_issue_authorized_affectations_breakdown_mismatch", FALSE)::int
    ) + (
      COALESCE(fin."has_issue_authorized_reprise_plus_affectations_mismatch", FALSE)::int
    ) + (COALESCE(fin."has_issue_authorized_reprise_wrong_sign", FALSE)::int) + (COALESCE(fin."has_issue_subsidized_deficit_nonzero_boxes", FALSE)::int) + (COALESCE(fin."has_issue_subsidized_excedent_reprise_etat_nonzero", FALSE)::int) + (COALESCE(fin."has_issue_subsidized_excedent_rules", FALSE)::int) + (COALESCE(doc."has_issue_missing_convention_document", FALSE)::int) + (COALESCE(doc."has_issue_missing_autorisation_document", FALSE)::int) + (COALESCE(doc."has_issue_missing_cpom_document", FALSE)::int) + (COALESCE(act."has_issue_places_indisponibles_gt_3pct", FALSE)::int) + (COALESCE(act."has_issue_presences_indues_gt_7pct", FALSE)::int)
  ) AS "issues_count"
FROM
:"SCHEMA"."structures_core" sc
  LEFT JOIN:"SCHEMA"."structures_calendar_quality" cal ON cal."id" = sc."id"
  LEFT JOIN:"SCHEMA"."structures_places_quality" pl ON pl."id" = sc."id"
  LEFT JOIN:"SCHEMA"."structures_characteristics_quality" ch ON ch."id" = sc."id"
  LEFT JOIN:"SCHEMA"."structures_finance_quality" fin ON fin."id" = sc."id"
  LEFT JOIN:"SCHEMA"."structures_documents_quality" doc ON doc."id" = sc."id"
  LEFT JOIN:"SCHEMA"."structures_activite_quality" act ON act."id" = sc."id"
  LEFT JOIN public."Form" f ON f."structureId" = sc."id"
  LEFT JOIN public."FormDefinition" fd ON fd."id" = f."formDefinitionId"
WHERE
  fd."slug" = 'finalisation-v1'
  AND f."status" = TRUE;
