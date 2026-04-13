import z from "zod";

export const activiteApiSchema = z.object({
  id: z.number(),
  adresseId: z.number(),
  date: z.string().datetime(),
  placesAutorisees: z.number().nullable(),
  desinsectisation: z.number().nullable(),
  remiseEnEtat: z.number().nullable(),
  sousOccupation: z.number().nullable(),
  travaux: z.number().nullable(),
  placesIndisponibles: z.number().nullable(),
  placesVacantes: z.number().nullable(),
  presencesInduesBPI: z.number().nullable(),
  presencesInduesDeboutees: z.number().nullable(),
  presencesIndues: z.number().nullable(),
});

export type ActiviteApiType = z.infer<typeof activiteApiSchema>;
