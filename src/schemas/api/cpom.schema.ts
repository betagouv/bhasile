import z from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";

import { fileApiSchema } from "./file.schema";

export const cpomMillesimeApiSchema = z.object({
  id: z.number().optional(),
  year: zSafeYear(),
  cumulResultatNet: z.number().nullish(),
  repriseEtat: z.number().nullish(),
  affectationTotal: z.number().nullish(),
  affectationReserveInvestissement: z.number().nullish(),
  affectationChargesNonReproductibles: z.number().nullish(),
  affectationReserveCompensationDeficits: z.number().nullish(),
  affectationReserveCouvertureBFR: z.number().nullish(),
  affectationReserveCompensationAmortissements: z.number().nullish(),
  affectationFondsDedies: z.number().nullish(),
  affectationReportANouveau: z.number().nullish(),
  affectationAutre: z.number().nullish(),
  commentaire: z.string().nullish(),
});

export type CpomMillesimeApiType = z.infer<typeof cpomMillesimeApiSchema>;

export const cpomApiSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullish(),
  debutCpom: z.string().datetime(),
  finCpom: z.string().datetime(),
  structureIds: z.array(z.number()).optional(),
  millesimes: z.array(cpomMillesimeApiSchema).optional(),
  fileUploads: z.array(fileApiSchema).optional(),
  cpomMillesimes: z.array(cpomMillesimeApiSchema).optional(),
});

export type CpomApiType = z.infer<typeof cpomApiSchema>;

export const cpomStructureApiSchema = z.object({
  id: z.number().optional(),
  cpomId: z.number(),
  structureId: z.number(),
  dateDebut: z.string().datetime().nullish(),
  dateFin: z.string().datetime().nullish(),
  cpom: cpomApiSchema,
});

export type CpomStructureApiType = z.infer<typeof cpomStructureApiSchema>;
