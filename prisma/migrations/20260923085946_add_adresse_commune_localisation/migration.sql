-- AlterEnum
ALTER TYPE "AnomalieCode" ADD VALUE 'ADRESSE_NON_LOCALISEE';

-- AlterTable
ALTER TABLE "Adresse" ADD COLUMN     "communeLatitude" DOUBLE PRECISION,
ADD COLUMN     "communeLongitude" DOUBLE PRECISION,
ADD COLUMN     "communeNom" TEXT;

-- AlterTable
ALTER TABLE "reporting"."monthly_structures_global_quality_count" ADD COLUMN     "has_issue_adresse_non_localisee" INTEGER;

