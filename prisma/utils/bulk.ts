import { PrismaClient } from "@/generated/prisma/client";

// Postgres plafonne à 65535 paramètres liés par requête : 1000 lignes tiennent
// même pour la table la plus large du schéma (Budget, ~26 colonnes).
const CHUNK_SIZE = 1000;

export const createManyChunked = async <T>(
  insert: (data: T[]) => Promise<unknown>,
  rows: T[]
): Promise<number> => {
  for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
    await insert(rows.slice(start, start + CHUNK_SIZE));
  }
  return rows.length;
};

export type IdAllocator<TableName extends string> = (
  table: TableName
) => number;

// Les identifiants sont attribués côté JS pour pouvoir câbler les clés
// étrangères sans relire la base entre deux insertions en masse.
export const createIdAllocator = async <TableName extends string>(
  prisma: PrismaClient,
  tables: readonly TableName[]
): Promise<IdAllocator<TableName>> => {
  const maxIdQuery = tables
    .map(
      (table) =>
        `SELECT '${table}' AS table_name, COALESCE(MAX(id), 0) AS max_id FROM "public"."${table}"`
    )
    .join(" UNION ALL ");

  const maxIds = await prisma.$queryRawUnsafe<
    { table_name: TableName; max_id: number }[]
  >(maxIdQuery);

  const cursors = new Map<TableName, number>(
    maxIds.map(({ table_name, max_id }) => [table_name, Number(max_id)])
  );

  return (table) => {
    const id = (cursors.get(table) ?? 0) + 1;
    cursors.set(table, id);
    return id;
  };
};
