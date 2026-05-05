import z from "zod";

import { optionalFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";
import { fileApiSchema } from "@/schemas/api/file.schema";

export const documentOperateurSchema = z
  .object({
    id: zId(),
    uuid: z.string().optional(),
    category: z.enum(DocumentOperateurCategory).optional(),
    date: optionalFrenchDateToISO(),
    name: z.string().nullish(),
    fileUploads: z.array(fileApiSchema.partial()).optional(),
  })
  .extend({
    fileUploads: z.array(fileApiSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.category !== "AUTRE" && data.fileUploads?.length) {
        return !!data.date;
      }
      return true;
    },
    {
      message: "La date est obligatoire.",
      path: ["date"],
    }
  );

export type DocumentOperateurFormValues = z.infer<
  typeof documentOperateurSchema
>;
