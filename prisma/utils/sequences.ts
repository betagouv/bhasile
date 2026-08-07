import { PrismaClient } from "@/generated/prisma/client";

// Le seed insère des identifiants explicites : les séquences Postgres restent
// donc à leur valeur d'origine et la première écriture applicative violerait la
// clé primaire. On les recale sur le MAX(id) de leur table.
export const syncSequences = async (prisma: PrismaClient): Promise<void> => {
  await prisma.$executeRawUnsafe(`
    DO $sync$
    DECLARE
      sequence RECORD;
    BEGIN
      FOR sequence IN
        SELECT
          sequence_namespace.nspname AS sequence_schema,
          sequence_class.relname AS sequence_name,
          table_namespace.nspname AS table_schema,
          table_class.relname AS table_name,
          table_column.attname AS column_name
        FROM pg_class AS sequence_class
        JOIN pg_namespace AS sequence_namespace
          ON sequence_namespace.oid = sequence_class.relnamespace
        JOIN pg_depend AS dependency
          ON dependency.objid = sequence_class.oid
          AND dependency.classid = 'pg_class'::regclass
          AND dependency.refclassid = 'pg_class'::regclass
        JOIN pg_class AS table_class
          ON table_class.oid = dependency.refobjid
        JOIN pg_namespace AS table_namespace
          ON table_namespace.oid = table_class.relnamespace
        JOIN pg_attribute AS table_column
          ON table_column.attrelid = table_class.oid
          AND table_column.attnum = dependency.refobjsubid
        WHERE sequence_class.relkind = 'S'
          AND table_namespace.nspname = 'public'
      LOOP
        EXECUTE format(
          'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I), 0) + 1, false)',
          format('%I.%I', sequence.sequence_schema, sequence.sequence_name),
          sequence.column_name,
          sequence.table_schema,
          sequence.table_name
        );
      END LOOP;
    END
    $sync$;
  `);
};
