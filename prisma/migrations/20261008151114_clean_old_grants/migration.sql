/*
  Warnings:

  - You are about to drop the column `roleId` on the `EmailPattern` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleDepartement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailPattern" DROP CONSTRAINT "EmailPattern_roleId_fkey";

-- DropForeignKey
ALTER TABLE "RoleDepartement" DROP CONSTRAINT "RoleDepartement_departementNumero_fkey";

-- DropForeignKey
ALTER TABLE "RoleDepartement" DROP CONSTRAINT "RoleDepartement_roleId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- AlterTable
ALTER TABLE "EmailPattern" DROP COLUMN "roleId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roleId";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "RoleDepartement";
