-- CreateEnum
CREATE TYPE "TransformationSource" AS ENUM ('AGENT', 'DEMARCHES_NUMERIQUES');

-- AlterEnum
ALTER TYPE "StepStatus" ADD VALUE 'PRE_REMPLI';

-- AlterTable
ALTER TABLE "Transformation" ADD COLUMN     "numeroDossier" TEXT,
ADD COLUMN     "source" "TransformationSource" NOT NULL DEFAULT 'AGENT';

-- CreateIndex
CREATE UNIQUE INDEX "Transformation_numeroDossier_key" ON "Transformation"("numeroDossier");

