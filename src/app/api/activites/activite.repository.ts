import prisma from "@/lib/prisma";

import { ActiviteStats } from "./activite.type";

export const getDepartmentActivitesAverage = async (
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
      ROUND(AVG(a."placesOccupees"), 2) as "averagePlacesOccupees",
      ROUND(AVG(a."placesVacantes"), 2) as "averagePlacesVacantes",
      ROUND(AVG(a."presencesInduesBPI"), 2) as "averagePresencesInduesBPI",
      ROUND(AVG(a."presencesInduesDeboutees"), 2) as "averagePresencesInduesDeboutees"
    FROM "Activite" a
    INNER JOIN "Structure" s ON a."structureDnaCode" = s."dnaCode"
    INNER JOIN "Departement" d ON s."departementAdministratif" = d."numero"
    WHERE a.date BETWEEN ${startDate} AND ${endDate}
      AND d."numero" = ${departementNumero}
    GROUP BY d.id, d.numero
  `) as ActiviteStats[];

  return result[0] || null;
};
