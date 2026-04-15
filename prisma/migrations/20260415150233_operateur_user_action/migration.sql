-- AlterTable
ALTER TABLE "UserAction" ADD COLUMN     "operateurId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
