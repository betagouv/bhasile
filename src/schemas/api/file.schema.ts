import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const fileApiSchema = z.object({
  key: z.string().min(1, "La clé d'upload du fichier est requise"),
  id: zId(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  originalName: z.string().optional(),
  acteAdministratifId: zId(),
  documentFinancierId: zId(),
  controleId: zId(),
  evaluationId: zId(),
});
