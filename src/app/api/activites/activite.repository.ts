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
    INNER JOIN "StructureVersion" sv ON sv."id" = ds."structureVersionId"
    INNER JOIN "Departement" d ON sv."departementAdministratif" = d."numero"
    WHERE a.date BETWEEN ${startDate} AND ${endDate}
      AND d."numero" = ${departementNumero}
    GROUP BY d.id, d.numero
  `) as ActiviteStats[];

  return result[0] || null;
};
