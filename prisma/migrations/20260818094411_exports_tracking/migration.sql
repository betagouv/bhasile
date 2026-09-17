-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserActionDescription" ADD VALUE 'TYPE_PLACES_SPREADSHEET_EXPORT';
ALTER TYPE "UserActionDescription" ADD VALUE 'FINANCES_SPREADSHEET_EXPORT';
ALTER TYPE "UserActionDescription" ADD VALUE 'CONTROLE_QUALITE_SPREADSHEET_EXPORT';
ALTER TYPE "UserActionDescription" ADD VALUE 'STRUCTURE_SPREADSHEET_EXPORT';
