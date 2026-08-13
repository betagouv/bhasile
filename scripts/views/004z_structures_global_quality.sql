-- Objective: global data quality indicators per structure
-- One row per structure, one boolean column per indicator
--
CREATE OR REPLACE VIEW:"SCHEMA"."structures_global_quality" AS
WITH
  codes_by_structure AS (
    SELECT
      a."structureId" AS "id",
      ARRAY_AGG(DISTINCT a."code"::text) AS "codes"
    FROM
      public."Anomalie" a
    WHERE
      a."isJustified" IS DISTINCT FROM TRUE
    GROUP BY
      a."structureId"
  ),
  places_by_structure AS (
    SELECT
      st."structureId" AS "id",
      MAX(st."lgbt") AS "lgbt_places",
      MAX(st."fvvTeh") AS "fvvteh_places"
    FROM
      public."StructureTypologie" st
    WHERE
      st."year" <= EXTRACT(
        YEAR
        FROM
          CURRENT_DATE
      )
    GROUP BY
      st."structureId"
  ),
  indicators AS (
    SELECT
      sc."id" AS "id",
      sc."code_bhasile" AS "code_bhasile",
      sc."operateur" AS "operateur",
      sc."departement_administratif" AS "departement_administratif",
      sc."departement" AS "departement",
      sc."region" AS "region",
      sc."dna_codes" AS "dna_codes",
      sc."updated_at" AS "updated_at",
      pl."lgbt_places" AS "lgbt_places",
      pl."fvvteh_places" AS "fvvteh_places",
      COALESCE(cps."codes", ARRAY[]::TEXT[]) AS "codes"
    FROM
:"SCHEMA"."structures_core" sc
      INNER JOIN public."Form" f ON f."structureId" = sc."id"
      INNER JOIN public."FormDefinition" fd ON fd."id" = f."formDefinitionId"
      LEFT JOIN codes_by_structure cps ON cps."id" = sc."id"
      LEFT JOIN places_by_structure pl ON pl."id" = sc."id"
    WHERE
      fd."slug" = 'finalisation-v1'
      AND f."status" = TRUE
  ),
  columns AS (
    SELECT
      i."id",
      i."code_bhasile",
      i."operateur",
      i."departement_administratif",
      i."departement",
      i."region",
      i."dna_codes",
      i."updated_at",
      i."lgbt_places",
      i."fvvteh_places",
      ('AUTORISATION_DUREE_NOT_15Y' = ANY (i."codes")) AS "has_issue_authorisation_period_not_15y",
      ('CONVENTION_AUTORISEE_DUREE_NOT_5Y' = ANY (i."codes")) AS "has_issue_authorized_convention_not_5y",
      ('CONVENTION_HORS_PERIODE_AUTORISATION' = ANY (i."codes")) AS "has_issue_authorized_convention_outside_authorisation_period",
      ('CONVENTION_MANQUANTE_OU_EXPIREE' = ANY (i."codes")) AS "has_issue_authorized_convention_missing_or_expired",
      ('CONVENTION_DATES_DIFFERENTES_ACTES' = ANY (i."codes")) AS "has_issue_convention_dates_differ_from_actes_administratifs",
      ('AUTORISATION_DATES_DIFFERENTES_ACTES' = ANY (i."codes")) AS "has_issue_authorisation_dates_differ_from_actes_administratifs",
      ('EVALUATION_HORS_DELAI' = ANY (i."codes")) AS "has_issue_evaluation_not_done_in_time",
      ('CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y' = ANY (i."codes")) AS "has_issue_subsidized_convention_gt_3y",
      (
        'PLACES_LABELLISEES_GT_AUTORISEES' = ANY (i."codes")
        OR 'PLACES_SPECIALISEES_GT_AUTORISEES' = ANY (i."codes")
        OR 'PLACES_PMR_GT_AUTORISEES' = ANY (i."codes")
      ) AS "has_issue_specific_places_gt_places_autorisees",
      ('INCOHERENCE_LGBT_PLACES' = ANY (i."codes")) AS "has_issue_incoherence_lgbt_places",
      ('INCOHERENCE_FVVTEH_PLACES' = ANY (i."codes")) AS "has_issue_incoherence_fvvteh_places",
      ('PLACES_ADRESSES_ECART_STRUCTURE' = ANY (i."codes")) AS "has_issue_places_structure_vs_address_diff_gt_10pct",
      ('DEPARTEMENT_INCOHERENT_CODE_DNA' = ANY (i."codes")) AS "has_issue_dept_code",
      ('MULTI_DNA' = ANY (i."codes")) AS "has_issue_multi_dna",
      ('CPOM_MONO_STRUCTURE' = ANY (i."codes")) AS "has_issue_cpom_mono_structure",
      ('TAUX_ENCADREMENT_GT_SEUIL' = ANY (i."codes")) AS "has_issue_taux_encadrement_max_gt_threshold",
      ('TAUX_ENCADREMENT_LT_2' = ANY (i."codes")) AS "has_issue_taux_encadrement_min_lt_2",
      ('COUT_JOURNALIER_GT_TARIF_CIBLE' = ANY (i."codes")) AS "has_issue_cout_journalier_max_gt_tarif_cible",
      ('COUT_JOURNALIER_LT_15' = ANY (i."codes")) AS "has_issue_cout_journalier_min_lt_15",
      ('RESULTAT_NET_EQ_0' = ANY (i."codes")) AS "has_issue_resultat_net_eq_0",
      ('AFFECTATION_DETAIL_MANQUANT' = ANY (i."codes")) AS "has_issue_authorized_affectations_breakdown_missing",
      ('AFFECTATION_DETAIL_ECART' = ANY (i."codes")) AS "has_issue_authorized_affectations_breakdown_mismatch",
      ('REPRISE_PLUS_AFFECTATION_ECART' = ANY (i."codes")) AS "has_issue_authorized_reprise_plus_affectations_mismatch",
      ('REPRISE_ETAT_SIGNE_INVERSE' = ANY (i."codes")) AS "has_issue_authorized_reprise_wrong_sign",
      ('SUBVENTIONNEE_DEFICIT_AVEC_EXCEDENT' = ANY (i."codes")) AS "has_issue_subsidized_deficit_nonzero_boxes",
      ('SUBVENTIONNEE_EXCEDENT_AVEC_REPRISE_ETAT' = ANY (i."codes")) AS "has_issue_subsidized_excedent_reprise_etat_nonzero",
      ('SUBVENTIONNEE_EXCEDENT_ECART' = ANY (i."codes")) AS "has_issue_subsidized_excedent_rules",
      ('DOCUMENT_CONVENTION_MANQUANT' = ANY (i."codes")) AS "has_issue_missing_convention_document",
      ('DOCUMENT_AUTORISATION_MANQUANT' = ANY (i."codes")) AS "has_issue_missing_autorisation_document",
      ('DOCUMENT_CPOM_MANQUANT' = ANY (i."codes")) AS "has_issue_missing_cpom_document",
      ('ACTIVITE_PLACES_INDISPONIBLES_GT_3PCT' = ANY (i."codes")) AS "has_issue_places_indisponibles_gt_3pct",
      ('ACTIVITE_PRESENCES_INDUES_GT_7PCT' = ANY (i."codes")) AS "has_issue_presences_indues_gt_7pct"
    FROM
      indicators i
  )
SELECT
  c.*,
  (
    c."has_issue_authorisation_period_not_15y"::int + c."has_issue_authorized_convention_not_5y"::int + c."has_issue_authorized_convention_outside_authorisation_period"::int + c."has_issue_authorized_convention_missing_or_expired"::int + c."has_issue_convention_dates_differ_from_actes_administratifs"::int + c."has_issue_authorisation_dates_differ_from_actes_administratifs"::int + c."has_issue_evaluation_not_done_in_time"::int + c."has_issue_subsidized_convention_gt_3y"::int + c."has_issue_specific_places_gt_places_autorisees"::int + c."has_issue_incoherence_lgbt_places"::int + c."has_issue_incoherence_fvvteh_places"::int + c."has_issue_places_structure_vs_address_diff_gt_10pct"::int + c."has_issue_dept_code"::int + c."has_issue_multi_dna"::int + c."has_issue_cpom_mono_structure"::int + c."has_issue_taux_encadrement_max_gt_threshold"::int + c."has_issue_taux_encadrement_min_lt_2"::int + c."has_issue_cout_journalier_max_gt_tarif_cible"::int + c."has_issue_cout_journalier_min_lt_15"::int + c."has_issue_resultat_net_eq_0"::int + c."has_issue_authorized_affectations_breakdown_missing"::int + c."has_issue_authorized_affectations_breakdown_mismatch"::int + c."has_issue_authorized_reprise_plus_affectations_mismatch"::int + c."has_issue_authorized_reprise_wrong_sign"::int + c."has_issue_subsidized_deficit_nonzero_boxes"::int + c."has_issue_subsidized_excedent_reprise_etat_nonzero"::int + c."has_issue_subsidized_excedent_rules"::int + c."has_issue_missing_convention_document"::int + c."has_issue_missing_autorisation_document"::int + c."has_issue_missing_cpom_document"::int + c."has_issue_places_indisponibles_gt_3pct"::int + c."has_issue_presences_indues_gt_7pct"::int
  ) AS "issues_count"
FROM
  columns c;
