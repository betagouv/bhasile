import z from "zod";

import { optionalFrenchDateToISO } from "@/app/utils/zodCustomFields";

export const fileApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  key: z.string().min(1, "La clé d'upload du fichier est requise"),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  originalName: z.string().optional(),
  startDate: optionalFrenchDateToISO(),
  endDate: optionalFrenchDateToISO(),
  categoryName: z.string().nullish(),
  parentFileUploadId: z.number().nullish(),
  controleId: z.number().nullish(),
  evaluationId: z.number().nullish(),
  granularity: z.string().optional(),
});
