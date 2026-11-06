-- AlterTable
ALTER TABLE "EmailPattern" ADD COLUMN     "isAgent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAgent" BOOLEAN;
