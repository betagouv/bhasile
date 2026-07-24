import z from "zod";

import {
  nullishFrenchDateToISO,
  optionalFrenchDateToISO,
  zId,
} from "@/app/utils/zodCustomFields";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StructureType } from "@/types/structure.type";

import { fileApiSchema } from "./file.schema";

export const acteAdministratifApiSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().optional(),
  structureDnaCode: z.string().optional(),
  cpomId: zId(),
  operateurId: zId(),
  structureType: z.enum(StructureType).nullish(),
  date: optionalFrenchDateToISO(),
  startDate: optionalFrenchDateToISO(),
  endDate: nullishFrenchDateToISO(),
  category: z.enum(ActeAdministratifCategory),
  name: z.string().nullish(),
  parentId: zId(),
  parentUuid: z.string().optional(),
  fileUploads: z.array(fileApiSchema).optional(),
});

export type ActeAdministratifApiType = z.infer<
  typeof acteAdministratifApiSchema
>;
