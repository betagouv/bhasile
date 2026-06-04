/*
  Warnings:

  - Added the required column `has_issue_cout_journalier_max_gt_25` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_issue_missing_autorisation_document` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_issue_missing_convention_document` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_issue_missing_cpom_document` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_issue_places_indisponibles_gt_3pct` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_issue_presences_indues_gt_7pct` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indicateursImpactCount` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indicateursUtilesCount` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reporting"."MonthlyStructuresGlobalQualityCount" ADD COLUMN     "has_issue_cout_journalier_max_gt_25" INTEGER NOT NULL,
ADD COLUMN     "has_issue_missing_autorisation_document" INTEGER NOT NULL,
ADD COLUMN     "has_issue_missing_convention_document" INTEGER NOT NULL,
ADD COLUMN     "has_issue_missing_cpom_document" INTEGER NOT NULL,
ADD COLUMN     "has_issue_places_indisponibles_gt_3pct" INTEGER NOT NULL,
ADD COLUMN     "has_issue_presences_indues_gt_7pct" INTEGER NOT NULL,
ADD COLUMN     "indicateursImpactCount" INTEGER NOT NULL,
ADD COLUMN     "indicateursUtilesCount" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "reporting"."GlobalIndicators" (
    "id" SERIAL NOT NULL,
    "budgetAnnuel" DECIMAL(65,30),
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
CREATE UNIQUE INDEX "MonthlyReportingVisitsByRegion_month_regionId_key" ON "reporting"."MonthlyReportingVisitsByRegion"("month", "regionId");
