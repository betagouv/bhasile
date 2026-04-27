/*
  Warnings:

  - You are about to drop the column `ETP` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `coutJournalier` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `tauxEncadrement` on the `Budget` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "ETP",
DROP COLUMN "coutJournalier",
DROP COLUMN "tauxEncadrement";
