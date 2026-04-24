import z from "zod";

import { optionalFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";
import { DocumentOperateurCategory } from "@/types/document-operateur.type";

import { fileApiSchema } from "./file.schema";

export const documentOperateurApiSchema = z.object({
  id: zId(),
  category: z.enum(DocumentOperateurCategory),
  date: optionalFrenchDateToISO(),
  name: z.string().nullish(),
  fileUploads: z.array(fileApiSchema).optional(),
});

export type DocumentOperateurApiRead = z.infer<
  typeof documentOperateurApiSchema
>;
