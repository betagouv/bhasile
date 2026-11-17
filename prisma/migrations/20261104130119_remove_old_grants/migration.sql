/*
  Warnings:

  - You are about to drop the column `emailPatternId` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `emailPatternId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAgent` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `EmailPattern` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Grant" DROP CONSTRAINT "Grant_emailPatternId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_emailPatternId_fkey";

-- DropIndex
DROP INDEX "Grant_emailPatternId_idx";

-- AlterTable
ALTER TABLE "Grant" DROP COLUMN "emailPatternId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailPatternId",
DROP COLUMN "isAgent";

-- DropTable
DROP TABLE "EmailPattern";
