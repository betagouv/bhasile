-- CreateEnum
CREATE TYPE "TarificationDocumentType" AS ENUM ('CA', 'RAPPORT_ACTIVITE', 'BP', 'RAPPORT_BUDGETAIRE', 'RCA', 'L48', 'REPONSE_CONTRADICTOIRE', 'DAB', 'ARRETE', 'DAM', 'ECHEANCIER', 'DAI', 'PIECE_JUSTIFICATIVE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TarificationDocumentStatus" AS ENUM ('DRAFT', 'FINAL', 'SHARED');

-- CreateEnum
CREATE TYPE "TarificationStepCode" AS ENUM ('RCA', 'L48', 'DAB', 'ARRETE');

-- CreateEnum
CREATE TYPE "TarificationEventType" AS ENUM ('DOCUMENT_DEPOSITED', 'DOCUMENT_SHARED', 'APPROVED', 'CHANGES_REQUESTED', 'DOCUMENT_WITHDRAWN', 'STEP_MARKED_NOT_APPLICABLE', 'L48_ACCEPTED', 'L48_CONTESTED', 'OUT_OF_BHASILE_DECLARED');

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "sourceTarificationDocumentId" INTEGER;

-- AlterTable
ALTER TABLE "DocumentFinancier" ADD COLUMN     "sourceTarificationDocumentId" INTEGER;

-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "sha256" TEXT;

-- AlterTable
ALTER TABLE "TarificationCampaign" ADD COLUMN     "drlPublishedAt" DATE,
ADD COLUMN     "drlUrl" TEXT;

-- CreateTable
CREATE TABLE "TarificationDocument" (
    "id" SERIAL NOT NULL,
    "structureTarificationId" INTEGER NOT NULL,
    "fileUploadId" INTEGER NOT NULL,
    "types" "TarificationDocumentType"[],
    "status" "TarificationDocumentStatus" NOT NULL,

    CONSTRAINT "TarificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarificationEvent" (
    "id" SERIAL NOT NULL,
    "structureTarificationId" INTEGER NOT NULL,
    "type" "TarificationEventType" NOT NULL,
    "authorId" INTEGER,
    "authorLevel" "AuthorLevel",
    "documentId" INTEGER,
    "stepCode" "TarificationStepCode",
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarificationDocumentOpening" (
    "documentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarificationDocumentOpening_pkey" PRIMARY KEY ("documentId","userId")
);

-- CreateTable
CREATE TABLE "TarificationEventNotification" (
    "eventId" INTEGER NOT NULL,
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarificationEventNotification_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "TarificationEventNotificationRecipient" (
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "brevoMessageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarificationEventNotificationRecipient_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TarificationDocument_fileUploadId_key" ON "TarificationDocument"("fileUploadId");

-- CreateIndex
CREATE INDEX "TarificationDocument_structureTarificationId_idx" ON "TarificationDocument"("structureTarificationId");

-- CreateIndex
CREATE INDEX "TarificationEvent_structureTarificationId_id_idx" ON "TarificationEvent"("structureTarificationId", "id");

-- CreateIndex
CREATE INDEX "TarificationEvent_documentId_idx" ON "TarificationEvent"("documentId");

-- CreateIndex
CREATE INDEX "TarificationEvent_createdAt_idx" ON "TarificationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TarificationDocumentOpening_userId_idx" ON "TarificationDocumentOpening"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActeAdministratif_sourceTarificationDocumentId_category_key" ON "ActeAdministratif"("sourceTarificationDocumentId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFinancier_sourceTarificationDocumentId_category_key" ON "DocumentFinancier"("sourceTarificationDocumentId", "category");

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_sourceTarificationDocumentId_fkey" FOREIGN KEY ("sourceTarificationDocumentId") REFERENCES "TarificationDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinancier" ADD CONSTRAINT "DocumentFinancier_sourceTarificationDocumentId_fkey" FOREIGN KEY ("sourceTarificationDocumentId") REFERENCES "TarificationDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationDocument" ADD CONSTRAINT "TarificationDocument_structureTarificationId_fkey" FOREIGN KEY ("structureTarificationId") REFERENCES "StructureTarification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationDocument" ADD CONSTRAINT "TarificationDocument_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationEvent" ADD CONSTRAINT "TarificationEvent_structureTarificationId_fkey" FOREIGN KEY ("structureTarificationId") REFERENCES "StructureTarification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationEvent" ADD CONSTRAINT "TarificationEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationEvent" ADD CONSTRAINT "TarificationEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TarificationDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationDocumentOpening" ADD CONSTRAINT "TarificationDocumentOpening_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TarificationDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationDocumentOpening" ADD CONSTRAINT "TarificationDocumentOpening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationEventNotification" ADD CONSTRAINT "TarificationEventNotification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TarificationEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationEventNotificationRecipient" ADD CONSTRAINT "TarificationEventNotificationRecipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TarificationEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarificationEventNotificationRecipient" ADD CONSTRAINT "TarificationEventNotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

