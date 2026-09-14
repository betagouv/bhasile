/*
  Warnings:

  - You are about to drop the column `description` on the `UserAction` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserActionType" AS ENUM ('STATISTIQUES_TABLE', 'STATISTIQUES_CARTOGRAPHIE', 'STRUCTURES_CARTOGRAPHIE', 'TYPE_PLACES_SPREADSHEET_EXPORT', 'FINANCES_SPREADSHEET_EXPORT', 'CONTROLE_QUALITE_SPREADSHEET_EXPORT', 'STRUCTURE_SPREADSHEET_EXPORT', 'STRUCTURE_PDF_EXPORT', 'STATISTIQUES_SPREADSHEET_EXPORT', 'STATISTIQUES_PDF_EXPORT');

-- AlterTable
ALTER TABLE "UserAction" DROP COLUMN "description",
ADD COLUMN     "details" TEXT,
ADD COLUMN     "type" "UserActionType";

-- DropEnum
DROP TYPE "UserActionDescription";
