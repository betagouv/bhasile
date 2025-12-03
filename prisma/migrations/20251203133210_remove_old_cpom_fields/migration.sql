/*
  Warnings:

  - You are about to drop the column `cumulResultatsNetsCPOM` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `cpom` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `debutCpom` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the column `finCpom` on the `Structure` table. All the data in the column will be lost.
  - You are about to drop the `StructureOfii` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StructureOfii" DROP CONSTRAINT "StructureOfii_departementNumero_fkey";

-- DropForeignKey
ALTER TABLE "StructureOfii" DROP CONSTRAINT "StructureOfii_operateurId_fkey";

-- AlterTable
ALTER TABLE "public"."Budget" DROP COLUMN "cumulResultatsNetsCPOM";

-- AlterTable
ALTER TABLE "public"."Structure" DROP COLUMN "cpom",
DROP COLUMN "debutCpom",
DROP COLUMN "finCpom";

-- DropTable
DROP TABLE "StructureOfii";
