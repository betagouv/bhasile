/*
 Warnings:
 
 - You are about to drop the column `has_issue_authorisation_dates_undefined` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_convention_dates_undefined` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_cout_journalier_max_gt_35` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_excedent_left_in_report_a_nouveau` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_taux_encadrement_max_gt_25` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_taux_encadrement_min_eq_0` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 
 */
-- AlterTable
ALTER TABLE "reporting"."MonthlyStructuresGlobalQualityCount" DROP COLUMN "has_issue_authorisation_dates_undefined",
    DROP COLUMN "has_issue_convention_dates_undefined",
    DROP COLUMN "has_issue_cout_journalier_max_gt_35",
    DROP COLUMN "has_issue_excedent_left_in_report_a_nouveau",
    DROP COLUMN "has_issue_taux_encadrement_max_gt_25",
    DROP COLUMN "has_issue_taux_encadrement_min_eq_0",
    ADD COLUMN "has_issue_authorized_reprise_wrong_sign" INTEGER,
    ADD COLUMN "has_issue_cout_journalier_max_gt_tarif_cible" INTEGER,
    ADD COLUMN "has_issue_missing_autorisation_document" INTEGER,
    ADD COLUMN "has_issue_missing_convention_document" INTEGER,
    ADD COLUMN "has_issue_missing_cpom_document" INTEGER,
    ADD COLUMN "has_issue_places_indisponibles_gt_3pct" INTEGER,
    ADD COLUMN "has_issue_presences_indues_gt_7pct" INTEGER,
    ADD COLUMN "has_issue_subsidized_reprise_etat_nonzero" INTEGER,
    ADD COLUMN "has_issue_taux_encadrement_max_gt_threshold" INTEGER,
    ADD COLUMN "has_issue_taux_encadrement_min_lt_2" INTEGER,
    ADD COLUMN "indicateursImpactCount" INTEGER,
    ADD COLUMN "indicateursUtilesCount" INTEGER,
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
-- CreateTable
CREATE TABLE "reporting"."TarifJournalierCible" (
    "id" SERIAL NOT NULL,
    "structureType" "StructureType" NOT NULL,
    "belongsToIdf" BOOLEAN NOT NULL,
    "tarifCible" DECIMAL(65, 30) NOT NULL,
    CONSTRAINT "TarifJournalierCible_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "reporting"."GlobalIndicators" (
    "id" SERIAL NOT NULL,
    "budgetAnnuel" DECIMAL(65, 30),
    "notePriseEnMain" DOUBLE PRECISION,
    "noteClarteInfos" DOUBLE PRECISION,
    "noteFaciliteUtilisation" DOUBLE PRECISION,
    "noteRobustesseTech" DOUBLE PRECISION,
    "noteRemplacementExcel" DOUBLE PRECISION,
    "noteGainTemps" DOUBLE PRECISION,
    "noteAmeliorationPilotage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlobalIndicators_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "reporting"."MonthlyReportingVisitsByRegion" (
    "id" SERIAL NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "regionId" INTEGER NOT NULL,
    "regionName" TEXT NOT NULL,
    "visitsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonthlyReportingVisitsByRegion_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "TarifJournalierCible_structureType_belongsToIdf_key" ON "reporting"."TarifJournalierCible"("structureType", "belongsToIdf");
-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReportingVisitsByRegion_month_regionId_key" ON "reporting"."MonthlyReportingVisitsByRegion"("month", "regionId");