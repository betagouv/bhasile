-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "cpomId" INTEGER;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
