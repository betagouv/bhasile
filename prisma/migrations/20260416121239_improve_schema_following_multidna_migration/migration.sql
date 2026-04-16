/*
  Warnings:

  - You are about to drop the column `placesIndisponibles` on the `Activite` table. All the data in the column will be lost.
  - You are about to drop the column `placesVacantes` on the `Activite` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Activite" DROP COLUMN "placesIndisponibles",
DROP COLUMN "placesVacantes",
ADD COLUMN     "tauxBPI" DECIMAL(65,30),
ADD COLUMN     "tauxDeboutes" DECIMAL(65,30),
ADD COLUMN     "tauxIndisponibilite" DECIMAL(65,30),
ADD COLUMN     "tauxOccupation" DECIMAL(65,30),
ADD COLUMN     "totalPlacesIndisponibles" INTEGER;

-- AlterTable
ALTER TABLE "Dna" ADD COLUMN     "departementAdministratif" TEXT,
ADD COLUMN     "directionTerritoriale" TEXT,
ADD COLUMN     "nom" TEXT,
ADD COLUMN     "nomOfii" TEXT,
ADD COLUMN     "operateurId" INTEGER,
ADD COLUMN     "type" "StructureType";

-- AddForeignKey
ALTER TABLE "Dna" ADD CONSTRAINT "Dna_departementAdministratif_fkey" FOREIGN KEY ("departementAdministratif") REFERENCES "Departement"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dna" ADD CONSTRAINT "Dna_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
