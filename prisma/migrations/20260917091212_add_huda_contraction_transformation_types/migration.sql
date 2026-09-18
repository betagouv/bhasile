-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT';
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU';
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_FERMETURE_REMISE_EN_CONCURRENCE';
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT';
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU';
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_CONTRACTION_REMISE_EN_CONCURRENCE';
