import { z } from "zod";

import { zSafeDecimalsNullish, zSafeYear } from "@/app/utils/zodCustomFields";

const cpomMillesimeApiSchema = z.object({
  id: z.number().optional(),
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

export const cpomStructureSchema = z.object({
  cpomStructures: z.array(
    z.object({
      id: z.number().optional(),
      cpomId: z.number(),
      structureId: z.number(),
      cpom: z.object({
        id: z.number(),
        cpomMillesimes: z.array(cpomMillesimeApiSchema).optional(),
      }),
    })
  ),
});
