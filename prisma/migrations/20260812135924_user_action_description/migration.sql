-- CreateEnum
CREATE TYPE "UserActionDescription" AS ENUM ('STATISTIQUES_TABLE', 'STATISTIQUES_CARTOGRAPHIE');

-- AlterTable
ALTER TABLE "UserAction" ADD COLUMN     "description" "UserActionDescription";
