-- AlterTable
ALTER TABLE "Grant" ADD COLUMN     "perimeterId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "isActivated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "perimeterId" INTEGER;

-- CreateTable
CREATE TABLE "Perimeter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perimeter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Perimeter_name_key" ON "Perimeter"("name");

-- CreateIndex
CREATE INDEX "Grant_perimeterId_idx" ON "Grant"("perimeterId");

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_perimeterId_fkey" FOREIGN KEY ("perimeterId") REFERENCES "Perimeter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_perimeterId_fkey" FOREIGN KEY ("perimeterId") REFERENCES "Perimeter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
