export const typesActivite: Partial<
  Record<TypeActiviteKey, { label: string; seuil: number | null }>
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
  presencesInduesTotal: {
    label: "Présences indues totales",
    seuil: 7,
  },
};

export type TypeActiviteKey =
  | "placesIndisponibles"
  | "presencesInduesBPI"
  | "presencesInduesDeboutees"
  | "presencesInduesTotal";
