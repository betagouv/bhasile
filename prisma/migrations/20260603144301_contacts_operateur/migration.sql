-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "operateurId" INTEGER;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
