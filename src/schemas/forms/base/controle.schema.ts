import z from "zod";

import { optionalFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";
import { ControleType } from "@/types/controle.type";

const fileUploadSchema = z.object({
  key: z.string().optional(),
  id: zId(),
});

export const controleAutoSaveSchema = z.object({
  id: zId(),
  date: optionalFrenchDateToISO(),
  type: z.nativeEnum(ControleType).optional(),
  fileUploads: z.array(fileUploadSchema.optional()).optional(),
  uuid: z.string().optional(), // Used to identify the controle when it is not saved in the database (and so do not have an id)
});

export const controleSchema = controleAutoSaveSchema.refine(
  (data) => {
    if (data.fileUploads) {
      if (
        data.fileUploads[0]?.key === undefined &&
        data.fileUploads[0]?.id === undefined
      ) {
        return true;
      }
      if (
        data.fileUploads[0]?.key === undefined ||
        data.fileUploads[0]?.id === undefined
      ) {
        return false;
      }
      return true;
    }
    return true;
  },
  {
    message: "Le fichier de l'inspection-contrôle doit être renseigné",
    path: ["fileUploads"],
  }
);

export const controlesSchema = z.object({
  controles: z.array(controleSchema).optional(),
});

export const controlesAutoSaveSchema = z.object({
  controles: z.array(controleAutoSaveSchema).optional(),
});

export type ControleFormValues = z.infer<typeof controleSchema>;
export type ControlesFormValues = z.infer<typeof controlesSchema>;
