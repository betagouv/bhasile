-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "isActivated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "perimeterId" INTEGER;

-- CreateTable
CREATE TABLE "Perimeter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "GrantScope" NOT NULL,
    "regionId" INTEGER,
    "departementNumero" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perimeter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Perimeter_name_key" ON "Perimeter"("name");

-- AddForeignKey
ALTER TABLE "Perimeter" ADD CONSTRAINT "Perimeter_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perimeter" ADD CONSTRAINT "Perimeter_departementNumero_fkey" FOREIGN KEY ("departementNumero") REFERENCES "Departement"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_perimeterId_fkey" FOREIGN KEY ("perimeterId") REFERENCES "Perimeter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
