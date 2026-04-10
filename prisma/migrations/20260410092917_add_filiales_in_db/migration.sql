-- AlterTable
ALTER TABLE "Operateur" ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Operateur" ADD CONSTRAINT "Operateur_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
