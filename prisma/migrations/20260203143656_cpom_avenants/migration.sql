-- CreateEnum
CREATE TYPE "ConventionType" AS ENUM ('AVENANT', 'CONVENTION');

-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "cpomConventionId" INTEGER;

-- CreateTable
CREATE TABLE "CpomConvention" (
    "id" SERIAL NOT NULL,
    "cpomId" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "type" "ConventionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CpomConvention_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_cpomConventionId_fkey" FOREIGN KEY ("cpomConventionId") REFERENCES "CpomConvention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CpomConvention" ADD CONSTRAINT "CpomConvention_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
