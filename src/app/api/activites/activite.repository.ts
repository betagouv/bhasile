import prisma from "@/lib/prisma";

import { Prisma } from "@/generated/prisma/client";
import { ActiviteStats } from "./activite.type";

export type StructureActiviteRow = {
  id: number;
  date: Date;
  placesAutorisees: number | null;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  placesIndisponibles: number | null;
  tauxOccupation: number | null;
  placesOccupees: number | null;
  travaux: number | null;
  placesVacantes: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
  presencesIndues: number | null;
};

const col = (alias: string, column: string) =>
  Prisma.raw(`${alias}."${column}"`);

const computedPlacesOccupeesSql = (alias: string) =>
  Prisma.sql`CASE
    WHEN ${col(alias, "placesAutorisees")} IS NULL
      OR ${col(alias, "placesIndisponibles")} IS NULL
      OR ${col(alias, "tauxOccupation")} IS NULL
      THEN NULL
    ELSE ((${col(alias, "placesAutorisees")} - ${col(alias, "placesIndisponibles")})::float8 * ${col(alias, "tauxOccupation")}::float8)
  END`;

const computedPlacesVacantesSql = (alias: string) =>
  Prisma.sql`CASE
    WHEN ${col(alias, "placesAutorisees")} IS NULL
      OR ${col(alias, "placesIndisponibles")} IS NULL
      OR ${col(alias, "tauxOccupation")} IS NULL
      THEN NULL
    ELSE (
      ((${col(alias, "placesAutorisees")} - ${col(alias, "placesIndisponibles")})::float8) -
      ((${col(alias, "placesAutorisees")} - ${col(alias, "placesIndisponibles")})::float8 * ${col(alias, "tauxOccupation")}::float8)
    )
  END`;

export const getActivitesForStructure = async (
  structureId: number
): Promise<StructureActiviteRow[]> => {
  // Agrégation par mois (date) sur l'ensemble des DNA liés à la structure.
  // `SUM(...)` ignore les NULL, ce qui colle avec l'ancienne agrégation JS (on n'ajoute que les valeurs présentes).
  return prisma.$queryRaw<StructureActiviteRow[]>(Prisma.sql`
    SELECT
      MIN(a.id)::int as "id",
      a.date as "date",
      SUM(a."placesAutorisees")::int as "placesAutorisees",
      SUM(a."desinsectisation")::int as "desinsectisation",
      SUM(a."remiseEnEtat")::int as "remiseEnEtat",
      SUM(a."sousOccupation")::int as "sousOccupation",
      SUM(a."placesIndisponibles")::int as "placesIndisponibles",
      AVG(a."tauxOccupation"::float8) as "tauxOccupation",
      SUM((${computedPlacesOccupeesSql("a")})) as "placesOccupees",
      SUM(a."travaux")::int as "travaux",
      SUM((${computedPlacesVacantesSql("a")})) as "placesVacantes",
      SUM(a."presencesInduesBPI")::int as "presencesInduesBPI",
      SUM(a."presencesInduesDeboutees")::int as "presencesInduesDeboutees",
      SUM(a."presencesInduesBPI" + a."presencesInduesDeboutees")::int as "presencesIndues"
    FROM "Activite" a
    INNER JOIN "Dna" dna ON dna."code" = a."dnaCode"
    INNER JOIN "DnaStructure" ds ON ds."dnaId" = dna."id"
    WHERE ds."structureId" = ${structureId}
    GROUP BY a.date
    ORDER BY a.date DESC
  `);
};

export const getDepartementActivitesAverage = async (
  departementNumero: string | null,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): Promise<ActiviteStats | null> => {
  if (startDate === "undefined" || endDate === "undefined") {
    return null;
  }

  const result = await prisma.$queryRaw<ActiviteStats[]>(Prisma.sql`
    SELECT
      d.numero,
      ROUND(AVG(a."placesAutorisees"::float8), 2) as "averagePlacesAutorisees",
      ROUND(AVG(a."placesIndisponibles"::float8), 2) as "averagePlacesIndisponibles",
      ROUND(AVG((${computedPlacesOccupeesSql("a")})), 2) as "averagePlacesOccupees",
      ROUND(AVG((${computedPlacesVacantesSql("a")})), 2) as "averagePlacesVacantes",
      ROUND(AVG(a."presencesInduesBPI"::float8), 2) as "averagePresencesInduesBPI",
      ROUND(AVG(a."presencesInduesDeboutees"::float8), 2) as "averagePresencesInduesDeboutees",
      ROUND(AVG((a."presencesInduesBPI" + a."presencesInduesDeboutees")::float8), 2) as "averagePresencesIndues"
    FROM "Activite" a
    INNER JOIN "Dna" dna ON dna."code" = a."dnaCode"
    INNER JOIN "DnaStructure" ds ON ds."dnaId" = dna."id"
    INNER JOIN "Structure" s ON s."id" = ds."structureId"
    INNER JOIN "Departement" d ON s."departementAdministratif" = d."numero"
    WHERE a.date BETWEEN ${startDate} AND ${endDate}
      AND d."numero" = ${departementNumero}
    GROUP BY d.id, d.numero
  `);

  return result[0] || null;
};
