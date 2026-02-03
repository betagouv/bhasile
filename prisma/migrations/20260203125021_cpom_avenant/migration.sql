-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "cpomAvenantId" INTEGER,
ADD COLUMN     "cpomId" INTEGER;

-- CreateTable
CREATE TABLE "CpomAvenant" (
    "id" SERIAL NOT NULL,
    "cpomId" INTEGER NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CpomAvenant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_cpomAvenantId_fkey" FOREIGN KEY ("cpomAvenantId") REFERENCES "CpomAvenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CpomAvenant" ADD CONSTRAINT "CpomAvenant_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
