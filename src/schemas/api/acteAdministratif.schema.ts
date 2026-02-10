import z from "zod";

import { optionalFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";
import { ActeAdministratifCategory } from "@/types/file-upload.type";

import { fileApiSchema } from "./file.schema";

export const acteAdministratifApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  cpomId: zId(),
  date: optionalFrenchDateToISO(),
  startDate: optionalFrenchDateToISO(),
  endDate: optionalFrenchDateToISO(),
  category: z.enum(ActeAdministratifCategory),
  name: z.string().optional(),
  parentId: zId(),
  fileUploads: z.array(fileApiSchema).optional(),
});

export type ActeAdministratifApiType = z.infer<
  typeof acteAdministratifApiSchema
>;
