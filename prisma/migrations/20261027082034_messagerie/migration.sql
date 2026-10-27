-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('SHARED', 'AGENTS');

-- CreateEnum
CREATE TYPE "AuthorLevel" AS ENUM ('DEPARTEMENT', 'REGION', 'OPERATEUR');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "structureTarificationId" INTEGER NOT NULL,
    "visibility" "Visibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "authorLevel" "AuthorLevel" NOT NULL,
    "text" TEXT NOT NULL,
    "tagKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReceipt" (
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("messageId","userId")
);

-- CreateTable
CREATE TABLE "TarificationCampaign" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarificationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureTarification" (
    "id" SERIAL NOT NULL,
    "structureId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StructureTarification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_structureTarificationId_visibility_key" ON "Conversation"("structureTarificationId", "visibility");

-- CreateIndex
CREATE INDEX "Message_conversationId_id_idx" ON "Message"("conversationId", "id");

-- CreateIndex
CREATE INDEX "MessageReceipt_userId_idx" ON "MessageReceipt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TarificationCampaign_year_key" ON "TarificationCampaign"("year");

-- CreateIndex
CREATE INDEX "StructureTarification_campaignId_idx" ON "StructureTarification"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "StructureTarification_structureId_campaignId_key" ON "StructureTarification"("structureId", "campaignId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_structureTarificationId_fkey" FOREIGN KEY ("structureTarificationId") REFERENCES "StructureTarification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTarification" ADD CONSTRAINT "StructureTarification_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureTarification" ADD CONSTRAINT "StructureTarification_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TarificationCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
