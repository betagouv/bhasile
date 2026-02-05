import z from "zod";

import {
  frenchDateToISO,
  nullishFrenchDateToISO,
  optionalFrenchDateToISO,
  zId,
  zSafeDecimalsNullish,
  zSafeYear,
} from "@/app/utils/zodCustomFields";

import { acteAdministratifCpomSchema } from "./acteAdministratif.schema";
import { operateurSchema } from "./operateur.schema";

const cpomMillesimeSchema = z.object({
  id: zId(),
  year: zSafeYear(),
  dotationDemandee: zSafeDecimalsNullish(),
  dotationAccordee: zSafeDecimalsNullish(),
  cumulResultatNet: zSafeDecimalsNullish(),
  repriseEtat: zSafeDecimalsNullish(),
  affectationReservesFondsDedies: zSafeDecimalsNullish(),
  reserveInvestissement: zSafeDecimalsNullish(),
  chargesNonReconductibles: zSafeDecimalsNullish(),
  reserveCompensationDeficits: zSafeDecimalsNullish(),
  reserveCompensationBFR: zSafeDecimalsNullish(),
  reserveCompensationAmortissements: zSafeDecimalsNullish(),
  fondsDedies: zSafeDecimalsNullish(),
  reportANouveau: zSafeDecimalsNullish(),
  autre: zSafeDecimalsNullish(),
  commentaire: z.string().nullish(),
});

const baseCpomSchema = z.object({
  id: zId(),
  name: z.string().nullish(),
  dateStart: frenchDateToISO(),
  dateEnd: frenchDateToISO(),
  operateur: operateurSchema,
  operateurId: zId(),
  region: z.string(),
  departements: z.array(z.string()),
  granularity: z.enum(["DEPARTEMENTALE", "INTERDEPARTEMENTALE", "REGIONALE"]),
  cpomMillesimes: z.array(cpomMillesimeSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifCpomSchema),
});

export const cpomStructureSchema = z.object({
  dateStart: nullishFrenchDateToISO(),
  dateEnd: nullishFrenchDateToISO(),
  structureId: zId(),
  cpom: baseCpomSchema.optional(),
});

export const cpomSchema = baseCpomSchema
  .extend({
    structures: z.array(cpomStructureSchema),
  })
  .refine(
    (data) => {
      if (data.dateStart && data.dateEnd) {
        return data.dateStart <= data.dateEnd;
      }
      return true;
    },
    {
      message: "La date de début du CPOM doit être antérieure à la date de fin",
      path: ["dateEnd"],
    }
  )
  .refine(
    (data) => {
      if (!data.dateStart || !data.dateEnd || !Array.isArray(data.structures)) {
        return true;
      }
      const cpomStart = data.dateStart;
      const cpomEnd = data.dateEnd;
      for (const structure of data.structures) {
        if (structure.dateStart && structure.dateEnd) {
          if (structure.dateStart < cpomStart || structure.dateEnd > cpomEnd) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "Les dates de début et de fin pour chaque structure doivent être comprises dans la plage du CPOM",
      path: ["structures"],
    }
  );

export type CpomMillesimeFormValues = z.infer<typeof cpomMillesimeSchema>;

export type CpomStructureFormValues = z.infer<typeof cpomStructureSchema>;

export type CpomFormValues = z.infer<typeof cpomSchema>;
