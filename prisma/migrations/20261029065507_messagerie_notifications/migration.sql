-- CreateTable
CREATE TABLE "EmailNotification" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "processedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailNotificationRecipient" (
    "notificationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "brevoMessageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailNotificationRecipient_pkey" PRIMARY KEY ("notificationId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailNotification_messageId_key" ON "EmailNotification"("messageId");

-- CreateIndex
CREATE INDEX "EmailNotification_processedAt_idx" ON "EmailNotification"("processedAt");

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailNotificationRecipient" ADD CONSTRAINT "EmailNotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "EmailNotification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailNotificationRecipient" ADD CONSTRAINT "EmailNotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
