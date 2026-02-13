import z from "zod";

import { zId, zSafeYear } from "@/app/utils/zodCustomFields";
import {
  DocumentFinancierCategory,
  DocumentFinancierGranularity,
} from "@/types/document-financier.type";

import { fileApiSchema } from "./file.schema";

export const documentFinancierApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  cpomId: zId(),
  year: zSafeYear(),
  granularity: z.enum(DocumentFinancierGranularity),
  category: z.enum(DocumentFinancierCategory),
  name: z.string().nullish(),
  fileUploads: z.array(fileApiSchema).optional(),
});

export type DocumentFinancierApiType = z.infer<
  typeof documentFinancierApiSchema
>;
