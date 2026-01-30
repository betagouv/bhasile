import z from "zod";

import {
  frenchDateToISO,
  nullishFrenchDateToISO,
  zId,
  zSafeDecimalsNullish,
  zSafeYear,
} from "@/app/utils/zodCustomFields";
import { zSafeDecimals } from "@/app/utils/zodSafeDecimals";
import { CpomGranularity } from "@/types/cpom.type";

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

const bareCpomSchema = z.object({
  id: zId(),
  name: z.string().nullish(),
  dateStart: frenchDateToISO(),
  dateEnd: frenchDateToISO(),
  operateur: operateurSchema.optional(),
  operateurId: zId(),
  granularity: z.enum([
    CpomGranularity.DEPARTEMENTALE,
    CpomGranularity.INTERDEPARTEMENTALE,
    CpomGranularity.REGIONALE,
  ]),
  departements: z.array(zSafeDecimals()).optional(),
  cpomMillesimes: z.array(cpomMillesimeSchema).optional(),
});

export const cpomStructureSchema = z.object({
  dateStart: nullishFrenchDateToISO(),
  dateEnd: nullishFrenchDateToISO(),
  structureId: zId(),
  cpom: bareCpomSchema.optional(),
});

export const cpomSchema = bareCpomSchema.extend({
  structures: z.array(cpomStructureSchema),
});

export type CpomMillesimeFormValues = z.infer<typeof cpomMillesimeSchema>;

export type CpomStructureFormValues = z.infer<typeof cpomStructureSchema>;

export type CpomFormValues = z.infer<typeof cpomSchema>;
