-- DropIndex
DROP INDEX "reporting"."tarif_journalier_cible_structure_type_belongs_to_idf_key";

-- AlterTable : les tarifs déjà saisis sont rattachés à 2026
ALTER TABLE "reporting"."tarif_journalier_cible" ADD COLUMN     "year" INTEGER NOT NULL DEFAULT 2026;
ALTER TABLE "reporting"."tarif_journalier_cible" ALTER COLUMN "year" DROP DEFAULT;

-- CreateTable
CREATE TABLE "reporting"."taux_encadrement_cible" (
    "id" SERIAL NOT NULL,
    "structure_type" "StructureType" NOT NULL,
    "year" INTEGER NOT NULL,
    "belongs_to_idf" BOOLEAN NOT NULL,
    "comes_from_huda" BOOLEAN NOT NULL DEFAULT false,
    "taux_cible" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "taux_encadrement_cible_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarif_journalier_cible_structure_type_year_belongs_to_idf_key" ON "reporting"."tarif_journalier_cible"("structure_type", "year", "belongs_to_idf");

-- CreateIndex
CREATE UNIQUE INDEX "taux_encadrement_cible_key" ON "reporting"."taux_encadrement_cible"("structure_type", "year", "belongs_to_idf", "comes_from_huda");
