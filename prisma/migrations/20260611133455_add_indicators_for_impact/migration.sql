/*
 Warnings:
 
 - You are about to drop the column `has_issue_authorisation_dates_undefined` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_convention_dates_undefined` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_cout_journalier_max_gt_35` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_excedent_left_in_report_a_nouveau` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_taux_encadrement_max_gt_25` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - You are about to drop the column `has_issue_taux_encadrement_min_eq_0` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
 - Added the required column `has_issue_authorized_reprise_wrong_sign` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_cout_journalier_max_gt_tarif_cible` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_missing_autorisation_document` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_missing_convention_document` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_missing_cpom_document` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_places_indisponibles_gt_3pct` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_presences_indues_gt_7pct` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_subsidized_reprise_etat_nonzero` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_taux_encadrement_max_gt_threshold` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `has_issue_taux_encadrement_min_lt_2` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `indicateursImpactCount` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 - Added the required column `indicateursUtilesCount` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable
ALTER TABLE "reporting"."MonthlyStructuresGlobalQualityCount" DROP COLUMN "has_issue_authorisation_dates_undefined",
    DROP COLUMN "has_issue_convention_dates_undefined",
    DROP COLUMN "has_issue_cout_journalier_max_gt_35",
    DROP COLUMN "has_issue_excedent_left_in_report_a_nouveau",
    DROP COLUMN "has_issue_taux_encadrement_max_gt_25",
    DROP COLUMN "has_issue_taux_encadrement_min_eq_0",
    ADD COLUMN "has_issue_authorized_reprise_wrong_sign" INTEGER NOT NULL,
    ADD COLUMN "has_issue_cout_journalier_max_gt_tarif_cible" INTEGER NOT NULL,
    ADD COLUMN "has_issue_missing_autorisation_document" INTEGER NOT NULL,
    ADD COLUMN "has_issue_missing_convention_document" INTEGER NOT NULL,
    ADD COLUMN "has_issue_missing_cpom_document" INTEGER NOT NULL,
    ADD COLUMN "has_issue_places_indisponibles_gt_3pct" INTEGER NOT NULL,
    ADD COLUMN "has_issue_presences_indues_gt_7pct" INTEGER NOT NULL,
    ADD COLUMN "has_issue_subsidized_reprise_etat_nonzero" INTEGER NOT NULL,
    ADD COLUMN "has_issue_taux_encadrement_max_gt_threshold" INTEGER NOT NULL,
    ADD COLUMN "has_issue_taux_encadrement_min_lt_2" INTEGER NOT NULL,
    ADD COLUMN "indicateursImpactCount" INTEGER NOT NULL,
    ADD COLUMN "indicateursUtilesCount" INTEGER NOT NULL;
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