/*
  Warnings:

  - You are about to drop the column `affectationAutre` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationChargesNonReproductibles` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationFondsDedies` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationReportANouveau` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationReserveCompensationAmortissements` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationReserveCompensationDeficits` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationReserveCouvertureBFR` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationReserveInvestissement` on the `CpomMillesime` table. All the data in the column will be lost.
  - You are about to drop the column `affectationTotal` on the `CpomMillesime` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CpomMillesime" DROP COLUMN "affectationAutre",
DROP COLUMN "affectationChargesNonReproductibles",
DROP COLUMN "affectationFondsDedies",
DROP COLUMN "affectationReportANouveau",
DROP COLUMN "affectationReserveCompensationAmortissements",
DROP COLUMN "affectationReserveCompensationDeficits",
DROP COLUMN "affectationReserveCouvertureBFR",
DROP COLUMN "affectationReserveInvestissement",
DROP COLUMN "affectationTotal",
ADD COLUMN     "affectationReservesFondsDedies" DOUBLE PRECISION,
ADD COLUMN     "autre" DOUBLE PRECISION,
ADD COLUMN     "chargesNonReconductibles" DOUBLE PRECISION,
ADD COLUMN     "dotationAccordee" DOUBLE PRECISION,
ADD COLUMN     "dotationDemandee" DOUBLE PRECISION,
ADD COLUMN     "fondsDedies" DOUBLE PRECISION,
ADD COLUMN     "reportANouveau" DOUBLE PRECISION,
ADD COLUMN     "reserveCompensationAmortissements" DOUBLE PRECISION,
ADD COLUMN     "reserveCompensationBFR" DOUBLE PRECISION,
ADD COLUMN     "reserveCompensationDeficits" DOUBLE PRECISION,
ADD COLUMN     "reserveInvestissement" DOUBLE PRECISION;
