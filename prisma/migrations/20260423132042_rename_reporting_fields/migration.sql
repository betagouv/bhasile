/*
  Warnings:

  - You are about to drop the column `has_authorisation_dates_undefined` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
  - You are about to drop the column `has_convention_dates_undefined` on the `MonthlyStructuresGlobalQualityCount` table. All the data in the column will be lost.
  - Added the required column `has_issue_authorisation_dates_undefined` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_issue_convention_dates_undefined` to the `MonthlyStructuresGlobalQualityCount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reporting"."MonthlyStructuresGlobalQualityCount" DROP COLUMN "has_authorisation_dates_undefined",
DROP COLUMN "has_convention_dates_undefined",
ADD COLUMN     "has_issue_authorisation_dates_undefined" INTEGER NOT NULL,
ADD COLUMN     "has_issue_convention_dates_undefined" INTEGER NOT NULL;
