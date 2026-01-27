-- CreateEnum
CREATE TYPE "AllowedUserGranularity" AS ENUM ('DEPARTEMENT', 'REGION', 'NATIONAL');

-- CreateTable
CREATE TABLE "AllowedUser" (
    "id" SERIAL NOT NULL,
    "emailPattern" TEXT NOT NULL,
    "granularity" "AllowedUserGranularity" NOT NULL,

    CONSTRAINT "AllowedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartementAllowedUser" (
    "departementId" INTEGER NOT NULL,
    "allowedUserId" INTEGER NOT NULL,

    CONSTRAINT "DepartementAllowedUser_pkey" PRIMARY KEY ("departementId","allowedUserId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedUser_emailPattern_key" ON "AllowedUser"("emailPattern");

-- AddForeignKey
ALTER TABLE "DepartementAllowedUser" ADD CONSTRAINT "DepartementAllowedUser_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartementAllowedUser" ADD CONSTRAINT "DepartementAllowedUser_allowedUserId_fkey" FOREIGN KEY ("allowedUserId") REFERENCES "AllowedUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
