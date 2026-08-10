import { Prisma } from "@/generated/prisma/client";

// Postgres plafonne à 65535 paramètres liés par requête : 500 lignes tiennent
// même pour la table la plus large du schéma (Budget, ~26 colonnes).
const CHUNK_SIZE = 500;

const chunk = <TRow>(rows: TRow[]): TRow[][] => {
  const chunks: TRow[][] = [];
  for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
    chunks.push(rows.slice(start, start + CHUNK_SIZE));
  }
  return chunks;
};

export const insertMany = async <TRow>(
  insert: (data: TRow[]) => Prisma.PrismaPromise<unknown>,
  rows: TRow[]
): Promise<number> => {
  for (const rowsChunk of chunk(rows)) {
    await insert(rowsChunk);
  }
  return rows.length;
};

// Postgres renvoie les lignes d'un INSERT ... RETURNING dans l'ordre des VALUES :
// les identifiants retournés sont donc alignés sur `rows`, ce qui permet de
// câbler les enfants sans relire la base.
export const insertManyReturningIds = async <TRow>(
  insert: (data: TRow[]) => Prisma.PrismaPromise<{ id: number }[]>,
  rows: TRow[]
): Promise<number[]> => {
  const ids: number[] = [];
  for (const rowsChunk of chunk(rows)) {
    const created = await insert(rowsChunk);
    ids.push(...created.map((row) => row.id));
  }
  return ids;
};
