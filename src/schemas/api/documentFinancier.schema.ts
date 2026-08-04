import z from "zod";

import { zId, zSafeYear } from "@/app/utils/zodCustomFields";
import { DocumentFinancierCategory } from "@/types/document-financier.type";
import { StructureType } from "@/types/structure.type";

import { fileApiSchema } from "./file.schema";

export const documentFinancierApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  structureId: z.number().optional(),
  cpomId: zId(),
  structureType: z.enum(StructureType).nullish(),
  year: zSafeYear(),
  category: z.enum(DocumentFinancierCategory),
  name: z.string().nullish(),
  fileUploads: z.array(fileApiSchema),
});

export type DocumentFinancierApiType = z.infer<
  typeof documentFinancierApiSchema
>;
