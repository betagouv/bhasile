import z from "zod";

import { zId, zSafeYear } from "@/app/utils/zodCustomFields";

import { operateurSchema } from "../base/operateur.schema";

const cpomStructureSchema = z.object({
  id: zId(),
  yearStart: zSafeYear(),
  yearEnd: zSafeYear(),
  structureId: zId(),
});

export const cpomAjoutIdentificationSchema = z.object({
  operateur: operateurSchema,
  granularity: z.enum(["DEPARTEMENT", "INTERDEPARTEMENT", "REGION"]),
  departement: z.array(z.number()),
  yearStart: zSafeYear(),
  yearEnd: zSafeYear(),
  structures: z.array(cpomStructureSchema),
});