/*
  Warnings:

  - You are about to drop the column `adresse` on the `Antenne` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Antenne" DROP COLUMN "adresse",
ADD COLUMN     "codePostal" TEXT,
ADD COLUMN     "commune" TEXT,
ADD COLUMN     "departement" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "perimetre" TEXT;
