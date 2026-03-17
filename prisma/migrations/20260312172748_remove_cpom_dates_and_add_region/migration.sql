/*
  Warnings:

  - You are about to drop the column `dateEnd` on the `Cpom` table. All the data in the column will be lost.
  - You are about to drop the column `dateStart` on the `Cpom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cpom" DROP COLUMN "dateEnd",
DROP COLUMN "dateStart";

-- AlterTable
ALTER TABLE "Departement" ADD COLUMN     "regionId" INTEGER;

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
