/*
  Warnings:

  - You are about to drop the column `isMissing` on the `ActeAdministratif` table. All the data in the column will be lost.
  - You are about to drop the column `isMissing` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `isMissing` on the `DocumentFinancier` table. All the data in the column will be lost.
  - You are about to drop the column `isMissing` on the `IndicateurFinancier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ActeAdministratif" DROP COLUMN "isMissing";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "isMissing";

-- AlterTable
ALTER TABLE "DocumentFinancier" DROP COLUMN "isMissing";

-- AlterTable
ALTER TABLE "IndicateurFinancier" DROP COLUMN "isMissing";
