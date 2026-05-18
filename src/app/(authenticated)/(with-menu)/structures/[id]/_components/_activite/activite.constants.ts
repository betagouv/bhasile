import { ActiviteApiType } from "@/schemas/api/activite.schema";

export const typesActivite: Partial<
  Record<
    keyof ActiviteApiType,
    { id: string; label: string; seuil: number | null }
  >
> = {
  placesIndisponibles: {
    id: "placesIndisponibles",
    label: "Places indisponibles",
    seuil: 3,
  },
  presencesInduesBPI: {
    id: "presencesInduesBPI",
    label: "Présences indues BPI",
    seuil: 3,
  },
  presencesInduesDeboutees: {
    id: "presencesInduesDeboutees",
    label: "Présences indues déboutées",
    seuil: 4,
  },
  presencesIndues: {
    id: "presencesIndues",
    label: "Présences indues totales",
    seuil: 7,
  },
};
