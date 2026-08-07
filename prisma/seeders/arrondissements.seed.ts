import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { parse } from "csv-parse/sync";

import { type PrismaClient } from "@/generated/prisma/client";

const DATA_DIR = join(process.cwd(), "prisma", "data");
const COMMUNE_CHUNK_SIZE = 5000;

const readReferentiel = async <T>(filename: string): Promise<T[]> => {
  const content = await readFile(join(DATA_DIR, filename), "utf-8");
  return parse<T>(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
};

const toNullableInt = (value: string): number | null =>
  value === "" ? null : Number(value);

export const seedArrondissementsAndCommunes = async (
  prisma: PrismaClient
): Promise<void> => {
  const [arrondissements, communes] = await Promise.all([
    readReferentiel<ArrondissementRow>("arrondissements.csv"),
    readReferentiel<CommuneRow>("communes.csv"),
  ]);

  // Upsert plutôt que remplacement : les arrondissements sont référencés par Structure.
  for (const arrondissement of arrondissements) {
    const data = {
      name: arrondissement.name,
      departementNumero: arrondissement.departementNumero,
      population: toNullableInt(arrondissement.population),
    };
    await prisma.arrondissement.upsert({
      where: { code: arrondissement.code },
      create: { code: arrondissement.code, ...data },
      update: data,
    });
  }

  await prisma.commune.deleteMany({});
  for (let index = 0; index < communes.length; index += COMMUNE_CHUNK_SIZE) {
    await prisma.commune.createMany({
      data: communes
        .slice(index, index + COMMUNE_CHUNK_SIZE)
        .map((commune) => ({
          codeInsee: commune.codeInsee,
          name: commune.name,
          nameNormalized: commune.nameNormalized,
          codesPostaux: commune.codesPostaux
            ? commune.codesPostaux.split("|")
            : [],
          population: toNullableInt(commune.population),
          arrondissementCode: commune.arrondissementCode || null,
        })),
    });
  }

  console.log(
    `🗺️ ${arrondissements.length} arrondissements et ${communes.length} communes créés`
  );
};

type ArrondissementRow = {
  code: string;
  name: string;
  departementNumero: string;
  population: string;
};

type CommuneRow = {
  codeInsee: string;
  name: string;
  nameNormalized: string;
  codesPostaux: string;
  population: string;
  arrondissementCode: string;
};
