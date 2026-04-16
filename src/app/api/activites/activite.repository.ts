import prisma from "@/lib/prisma";

import { ActiviteStats } from "./activite.type";

export type StructureActiviteRow = {
  id: number;
  date: Date;
  placesAutorisees: number;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  placesIndisponibles: number | null;
  tauxOccupation: number | null;
  placesOccupees: number | null;
  placesDisponibles: number | null;
  travaux: number | null;
  placesVacantes: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
  presencesIndues: number | null;
};

export type StructureActivitePrismaRow = {
  id: number;
  date: Date;
  placesAutorisees: number | null;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  placesIndisponibles: number | null;
  tauxOccupation: unknown | null;
  travaux: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
};

export const getActivitesForStructureRaw = async (
  structureId: number
): Promise<StructureActivitePrismaRow[]> => {
  return prisma.activite.findMany({
    where: {
      dna: {
        dnaStructures: {
          some: {
            structureId,
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    select: {
      id: true,
      date: true,
      placesAutorisees: true,
      desinsectisation: true,
      remiseEnEtat: true,
      sousOccupation: true,
      travaux: true,
      placesIndisponibles: true,
      tauxOccupation: true,
      presencesInduesBPI: true,
      presencesInduesDeboutees: true,
    },
  });
};

export const getDepartementActivitesAverage = async (
  departementNumero: string | null,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): Promise<ActiviteStats | null> => {
  if (startDate === "undefined" || endDate === "undefined") {
    return null;
  }

  const result = (await prisma.$queryRaw`
    SELECT 
      d.numero,
      ROUND(AVG(a."placesAutorisees"), 2) as "averagePlacesAutorisees",
      ROUND(AVG(a."placesIndisponibles"), 2) as "averagePlacesIndisponibles",
      ROUND(AVG(
        CASE
          WHEN a."placesAutorisees" IS NULL OR a."placesIndisponibles" IS NULL OR a."tauxOccupation" IS NULL
            THEN NULL
          ELSE (a."placesAutorisees" - a."placesIndisponibles") * a."tauxOccupation"
        END
      ), 2) as "averagePlacesOccupees",
      ROUND(AVG(
        CASE
          WHEN a."placesAutorisees" IS NULL OR a."placesIndisponibles" IS NULL OR a."tauxOccupation" IS NULL
            THEN NULL
          ELSE (a."placesAutorisees" - a."placesIndisponibles") - ((a."placesAutorisees" - a."placesIndisponibles") * a."tauxOccupation")
        END
      ), 2) as "averagePlacesVacantes",
      ROUND(AVG(a."presencesInduesBPI"), 2) as "averagePresencesInduesBPI",
      ROUND(AVG(a."presencesInduesDeboutees"), 2) as "averagePresencesInduesDeboutees",
      ROUND(AVG(a."presencesInduesBPI" + a."presencesInduesDeboutees"), 2) as "averagePresencesIndues"
    FROM "Activite" a
    INNER JOIN "Dna" dna ON dna."code" = a."dnaCode"
    INNER JOIN "DnaStructure" ds ON ds."dnaId" = dna."id"
    INNER JOIN "Structure" s ON s."id" = ds."structureId"
    INNER JOIN "Departement" d ON s."departementAdministratif" = d."numero"
    WHERE a.date BETWEEN ${startDate} AND ${endDate}
      AND d."numero" = ${departementNumero}
    GROUP BY d.id, d.numero
  `) as ActiviteStats[];

  return result[0] || null;
};
