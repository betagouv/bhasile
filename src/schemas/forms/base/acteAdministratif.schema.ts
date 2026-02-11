import z from "zod";

import { optionalFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";
import { fileApiSchema } from "@/schemas/api/file.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export const acteAdministratifAutoSaveSchema = z.object({
  id: zId(),
  uuid: z.string().optional(), // The uuid is used to identify the acte administratif when it is not saved in the database (and so do not have an id)
  category: z.enum(ActeAdministratifCategory).optional(),
  date: optionalFrenchDateToISO(),
  startDate: optionalFrenchDateToISO(),
  endDate: optionalFrenchDateToISO(),
  name: z.string().nullish(),
  parentId: zId(),
  fileUploads: z.array(fileApiSchema).optional(),
});

const acteAdministratifSchema = acteAdministratifAutoSaveSchema
  .refine(
    (data) => {
      if (
        data.category !== "AUTRE" &&
        !data.parentId &&
        data.fileUploads?.length
      ) {
        return !!data.startDate && !!data.endDate;
      }
      return true;
    },
    {
      message: "Les dates de début et de fin sont obligatoires.",
      path: ["endDate", "startDate"],
    }
  )
  .refine(
    (data) => {
      if (data.parentId && data.fileUploads?.length) {
        return !!data.date;
      }
      return true;
    },
    {
      message: "La date est obligatoire pour les avenants.",
      path: ["date"],
    }
  );

const acteAdministratifAutoriseesSchema = acteAdministratifSchema.refine(
  (data) => {
    if (
      (data.category === "ARRETE_AUTORISATION" ||
        data.category === "ARRETE_TARIFICATION") &&
      !data.parentId
    ) {
      return !!data.fileUploads?.length && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    message: "Ces documents sont obligatoires.",
    path: ["fileUploads"],
  }
);

const acteAdministratifSubventionneesSchema = acteAdministratifSchema.refine(
  (data) => {
    if (
      (data.category === "ARRETE_AUTORISATION" ||
        data.category === "ARRETE_TARIFICATION" ||
        data.category === "CONVENTION") &&
      !data.parentId
    ) {
      return !!data.fileUploads?.length && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    message: "Ces documents sont obligatoires.",
    path: ["fileUploads"],
  }
);

export const acteAdministratifCpomSchema = acteAdministratifSchema.refine(
  (data) => {
    if (data.category === "CONVENTION" && !data.parentId) {
      return !!data.fileUploads?.length && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    message: "Ces documents sont obligatoires.",
    path: ["fileUploads"],
  }
);

export const actesAdministratifsAutoriseesSchema = z.object({
  actesAdministratifs: z.array(acteAdministratifAutoriseesSchema).optional(),
});
export const actesAdministratifsSubventionneesSchema = z.object({
  actesAdministratifs: z
    .array(acteAdministratifSubventionneesSchema)
    .optional(),
});

export const actesAdministratifsAutoSaveSchema = z.object({
  actesAdministratifs: z.array(acteAdministratifAutoSaveSchema).optional(),
});

export type ActeAdministratifFormValues = z.infer<
  typeof acteAdministratifSchema
>;

export type ActesAdministratifsFormValues = z.infer<
  | typeof actesAdministratifsAutoriseesSchema
  | typeof actesAdministratifsSubventionneesSchema
>;

export type ActesAdministratifsAutoSaveFormValues = z.infer<
  typeof actesAdministratifsAutoSaveSchema
>;
