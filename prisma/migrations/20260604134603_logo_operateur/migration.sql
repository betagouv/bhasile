/*
  Warnings:

  - A unique constraint covering the columns `[operateurId]` on the table `FileUpload` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "operateurId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "FileUpload_operateurId_key" ON "FileUpload"("operateurId");

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
