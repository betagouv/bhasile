/*
  Warnings:

  - Added the required column `has_issue_authorisation_dates_differ_from_actes_administratifs` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_issue_convention_dates_differ_from_actes_administratifs` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reporting"."MonthlyStructuresGlobalQualityCount" ADD COLUMN     "has_issue_authorisation_dates_differ_from_actes_administratifs" INTEGER NOT NULL,
ADD COLUMN     "has_issue_convention_dates_differ_from_actes_administratifs" INTEGER NOT NULL;
