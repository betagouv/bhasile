-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "messageId" INTEGER;

-- CreateIndex
CREATE INDEX "FileUpload_messageId_idx" ON "FileUpload"("messageId");

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
