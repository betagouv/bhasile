import z from "zod";

export const activiteApiSchema = z.object({
  id: z.number(),
  date: z.string().datetime().optional(),
  placesAutorisees: z.number().nullish(),
  desinsectisation: z.number().nullish(),
  remiseEnEtat: z.number().nullish(),
  sousOccupation: z.number().nullish(),
  travaux: z.number().nullish(),
  placesIndisponibles: z.number().nullish(),
  placesVacantes: z.number().nullish(),
  presencesInduesBPI: z.number().nullish(),
  presencesInduesDeboutees: z.number().nullish(),
  presencesIndues: z.number().nullish(),
});

export type ActiviteApiType = z.infer<typeof activiteApiSchema>;
