/*
  Nota: 
  This migration was hand-edited: it will not fail if reporting does not exist (and it usually doesn't since 
  it's dropped by delete-views).

  Warnings:

  - You are about to drop the `Referential` table. If the table is not empty, all the data it contains will be lost.

*/
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'reporting') THEN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'reporting' AND table_name = 'Referential') THEN
      ALTER TABLE "reporting"."Referential" DROP CONSTRAINT IF EXISTS "Referential_dnaCode_fkey";
      DROP TABLE "reporting"."Referential";
    END IF;
  END IF;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "StructureTypologie_structureDnaCode_date_key";
