/*
 Modifié manuellement par rapport à la migration Prisma : RENAME tables/colonnes existantes en snake_case
 */
-- Rename existing tables (preserve data)
ALTER TABLE "reporting"."MonthlyReportingMetric"
    RENAME TO "monthly_reporting_metric";
ALTER TABLE "reporting"."MonthlySupportContact"
    RENAME TO "monthly_support_contact";
ALTER TABLE "reporting"."MonthlyStructuresGlobalQualityCount"
    RENAME TO "monthly_structures_global_quality_count";
-- monthly_reporting_metric: rename columns + constraints
ALTER TABLE "reporting"."monthly_reporting_metric"
    RENAME COLUMN "visitsCount" TO "visits_count";
ALTER TABLE "reporting"."monthly_reporting_metric"
    RENAME COLUMN "readsCount" TO "reads_count";
ALTER TABLE "reporting"."monthly_reporting_metric"
    RENAME COLUMN "updatesCount" TO "updates_count";
ALTER TABLE "reporting"."monthly_reporting_metric"
    RENAME COLUMN "structuresUpdatedCount" TO "structures_updated_count";
ALTER TABLE "reporting"."monthly_reporting_metric"
    RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "reporting"."monthly_reporting_metric"
    RENAME CONSTRAINT "MonthlyReportingMetric_pkey" TO "monthly_reporting_metric_pkey";
ALTER INDEX "reporting"."MonthlyReportingMetric_month_key"
RENAME TO "monthly_reporting_metric_month_key";
-- monthly_support_contact: rename columns + constraints
ALTER TABLE "reporting"."monthly_support_contact"
    RENAME COLUMN "phoneCallsCount" TO "phone_calls_count";
ALTER TABLE "reporting"."monthly_support_contact"
    RENAME COLUMN "emailsCount" TO "emails_count";
ALTER TABLE "reporting"."monthly_support_contact"
    RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "reporting"."monthly_support_contact"
    RENAME CONSTRAINT "MonthlySupportContact_pkey" TO "monthly_support_contact_pkey";
ALTER INDEX "reporting"."MonthlySupportContact_month_key"
RENAME TO "monthly_support_contact_month_key";
-- monthly_structures_global_quality_count: rename metadata columns
ALTER TABLE "reporting"."monthly_structures_global_quality_count"
    RENAME COLUMN "structuresCount" TO "structures_count";
ALTER TABLE "reporting"."monthly_structures_global_quality_count"
    RENAME COLUMN "indicatorsCount" TO "indicators_count";
ALTER TABLE "reporting"."monthly_structures_global_quality_count"
    RENAME COLUMN "issuesCountSum" TO "issues_count_sum";
ALTER TABLE "reporting"."monthly_structures_global_quality_count"
    RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "reporting"."monthly_structures_global_quality_count"
    RENAME CONSTRAINT "MonthlyStructuresGlobalQualityCount_pkey" TO "monthly_structures_global_quality_count_pkey";
ALTER INDEX "reporting"."MonthlyStructuresGlobalQualityCount_month_key"
RENAME TO "monthly_structures_global_quality_count_month_key";
-- Drop deprecated indicator columns (semantics changed or removed)
ALTER TABLE "reporting"."monthly_structures_global_quality_count" DROP COLUMN "has_issue_authorisation_dates_undefined",
    DROP COLUMN "has_issue_convention_dates_undefined",
    DROP COLUMN "has_issue_cout_journalier_max_gt_35",
    DROP COLUMN "has_issue_excedent_left_in_report_a_nouveau",
    DROP COLUMN "has_issue_taux_encadrement_max_gt_25",
    DROP COLUMN "has_issue_taux_encadrement_min_eq_0";
-- Add new indicator columns
ALTER TABLE "reporting"."monthly_structures_global_quality_count"
ADD COLUMN "indicateurs_utiles_count" INTEGER,
    ADD COLUMN "indicateurs_impact_count" INTEGER,
    ADD COLUMN "has_issue_authorized_reprise_wrong_sign" INTEGER,
    ADD COLUMN "has_issue_cout_journalier_max_gt_tarif_cible" INTEGER,
    ADD COLUMN "has_issue_missing_autorisation_document" INTEGER,
    ADD COLUMN "has_issue_missing_convention_document" INTEGER,
    ADD COLUMN "has_issue_missing_cpom_document" INTEGER,
    ADD COLUMN "has_issue_places_indisponibles_gt_3pct" INTEGER,
    ADD COLUMN "has_issue_presences_indues_gt_7pct" INTEGER,
    ADD COLUMN "has_issue_subsidized_reprise_etat_nonzero" INTEGER,
    ADD COLUMN "has_issue_taux_encadrement_max_gt_threshold" INTEGER,
    ADD COLUMN "has_issue_taux_encadrement_min_lt_2" INTEGER;
-- Relax NOT NULL on remaining indicator columns (cron may omit future indicators)
ALTER TABLE "reporting"."monthly_structures_global_quality_count"
ALTER COLUMN "has_issue_authorisation_period_not_15y" DROP NOT NULL,
    ALTER COLUMN "has_issue_authorized_convention_not_5y" DROP NOT NULL,
    ALTER COLUMN "has_issue_authorized_convention_outside_authorisation_period" DROP NOT NULL,
    ALTER COLUMN "has_issue_authorized_convention_missing_or_expired" DROP NOT NULL,
    ALTER COLUMN "has_issue_evaluation_not_done_in_time" DROP NOT NULL,
    ALTER COLUMN "has_issue_subsidized_convention_gt_3y" DROP NOT NULL,
    ALTER COLUMN "has_issue_specific_places_gt_places_autorisees" DROP NOT NULL,
    ALTER COLUMN "has_issue_places_structure_vs_address_diff_gt_10pct" DROP NOT NULL,
    ALTER COLUMN "has_issue_dept_code" DROP NOT NULL,
    ALTER COLUMN "has_issue_multi_dna" DROP NOT NULL,
    ALTER COLUMN "has_issue_cpom_mono_structure" DROP NOT NULL,
    ALTER COLUMN "has_issue_cout_journalier_min_lt_15" DROP NOT NULL,
    ALTER COLUMN "has_issue_resultat_net_eq_0" DROP NOT NULL,
    ALTER COLUMN "has_issue_authorized_affectations_breakdown_missing" DROP NOT NULL,
    ALTER COLUMN "has_issue_authorized_reprise_plus_affectations_mismatch" DROP NOT NULL,
    ALTER COLUMN "has_issue_subsidized_deficit_nonzero_boxes" DROP NOT NULL,
    ALTER COLUMN "has_issue_subsidized_excedent_rules" DROP NOT NULL,
    ALTER COLUMN "has_issue_authorisation_dates_differ_from_actes_administratifs" DROP NOT NULL,
    ALTER COLUMN "has_issue_convention_dates_differ_from_actes_administratifs" DROP NOT NULL;
-- New tables
CREATE TABLE "reporting"."tarif_journalier_cible" (
    "id" SERIAL NOT NULL,
    "structure_type" "StructureType" NOT NULL,
    "belongs_to_idf" BOOLEAN NOT NULL,
    "tarif_cible" DECIMAL(65, 30) NOT NULL,
    CONSTRAINT "tarif_journalier_cible_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "reporting"."global_indicators" (
    "id" SERIAL NOT NULL,
    "budget_annuel" DECIMAL(65, 30),
    "note_prise_en_main" DOUBLE PRECISION,
    "note_clarte_infos" DOUBLE PRECISION,
    "note_facilite_utilisation" DOUBLE PRECISION,
    "note_robustesse_tech" DOUBLE PRECISION,
    "note_remplacement_excel" DOUBLE PRECISION,
    "note_gain_temps" DOUBLE PRECISION,
    "note_amelioration_pilotage" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "global_indicators_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "reporting"."monthly_reporting_visits_by_region" (
    "id" SERIAL NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "region_id" INTEGER NOT NULL,
    "region_name" TEXT NOT NULL,
    "visits_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monthly_reporting_visits_by_region_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tarif_journalier_cible_structure_type_belongs_to_idf_key" ON "reporting"."tarif_journalier_cible" ("structure_type", "belongs_to_idf");
CREATE UNIQUE INDEX "monthly_reporting_visits_by_region_month_region_id_key" ON "reporting"."monthly_reporting_visits_by_region" ("month", "region_id");