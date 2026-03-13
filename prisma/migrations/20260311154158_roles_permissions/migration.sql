/*
  Warnings:

  - You are about to drop the `AllowedUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DepartementAllowedUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoleGroup" AS ENUM ('NATIONAL', 'REGION_ARA', 'REGION_BFC', 'REGION_BRE', 'REGION_CVL', 'REGION_GES', 'REGION_HDF', 'REGION_IDF', 'REGION_NOR', 'REGION_NAQ', 'REGION_OCC', 'REGION_PDL', 'REGION_PAC', 'DEPARTEMENT', 'ANONYMOUS');

-- DropForeignKey
ALTER TABLE "DepartementAllowedUser" DROP CONSTRAINT "DepartementAllowedUser_allowedUserId_fkey";

-- DropForeignKey
ALTER TABLE "DepartementAllowedUser" DROP CONSTRAINT "DepartementAllowedUser_departementId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roleId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "AllowedUser";

-- DropTable
DROP TABLE "DepartementAllowedUser";

-- DropEnum
DROP TYPE "AllowedUserGranularity";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "emailPattern" TEXT,
    "group" "RoleGroup" DEFAULT 'ANONYMOUS',

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleDepartement" (
    "departementId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "RoleDepartement_pkey" PRIMARY KEY ("departementId","roleId")
);

-- AddForeignKey
ALTER TABLE "RoleDepartement" ADD CONSTRAINT "RoleDepartement_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleDepartement" ADD CONSTRAINT "RoleDepartement_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
