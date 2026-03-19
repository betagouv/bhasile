/*
  Warnings:

  - You are about to drop the `AllowedUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DepartementAllowedUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DepartementAllowedUser" DROP CONSTRAINT "DepartementAllowedUser_allowedUserId_fkey";

-- DropForeignKey
ALTER TABLE "DepartementAllowedUser" DROP CONSTRAINT "DepartementAllowedUser_departementId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailPatternId" INTEGER,
ADD COLUMN     "roleId" INTEGER;

-- DropTable
DROP TABLE "AllowedUser";

-- DropTable
DROP TABLE "DepartementAllowedUser";

-- DropEnum
DROP TYPE "AllowedUserGranularity";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleDepartement" (
    "departementId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "RoleDepartement_pkey" PRIMARY KEY ("departementId","roleId")
);

-- CreateTable
CREATE TABLE "EmailPattern" (
    "id" SERIAL NOT NULL,
    "pattern" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "EmailPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPattern_pattern_key" ON "EmailPattern"("pattern");

-- AddForeignKey
ALTER TABLE "RoleDepartement" ADD CONSTRAINT "RoleDepartement_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleDepartement" ADD CONSTRAINT "RoleDepartement_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailPattern" ADD CONSTRAINT "EmailPattern_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_emailPatternId_fkey" FOREIGN KEY ("emailPatternId") REFERENCES "EmailPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;
