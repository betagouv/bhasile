import { ActiviteApiType } from "@/schemas/api/activite.schema";

export const typesActivite: Partial<
  Record<keyof ActiviteApiType, { label: string; seuil: number | null }>
> = {
  placesIndisponibles: {
    label: "Places indisponibles",
    seuil: 3,
  },
  presencesInduesBPI: {
    label: "Présences indues BPI",
    seuil: 3,
  },
  presencesInduesDeboutees: {
    label: "Présences indues déboutées",
    seuil: 4,
  },
  presencesIndues: {
    label: "Présences indues totales",
    seuil: 7,
  },
};
