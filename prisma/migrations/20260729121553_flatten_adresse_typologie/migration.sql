-- AlterTable
ALTER TABLE "Adresse" DROP COLUMN "logementSocial",
DROP COLUMN "qpv",
ADD COLUMN     "isLogementSocial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isQpv" BOOLEAN NOT NULL DEFAULT false;

