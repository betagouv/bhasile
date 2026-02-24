-- CreateEnum
CREATE TYPE "CpomGranularity" AS ENUM ('DEPARTEMENTALE', 'INTERDEPARTEMENTALE', 'REGIONALE');

-- AlterTable
ALTER TABLE "Cpom" ADD COLUMN     "departements" TEXT[],
ADD COLUMN     "granularity" "CpomGranularity" NOT NULL DEFAULT 'REGIONALE',
ADD COLUMN     "region" TEXT;
