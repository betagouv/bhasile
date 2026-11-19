-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "userId" INTEGER NOT NULL,
    "tarificationEventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("userId","tarificationEventId")
);

-- CreateIndex
CREATE INDEX "NotificationRead_tarificationEventId_idx" ON "NotificationRead"("tarificationEventId");

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_tarificationEventId_fkey" FOREIGN KEY ("tarificationEventId") REFERENCES "TarificationEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

