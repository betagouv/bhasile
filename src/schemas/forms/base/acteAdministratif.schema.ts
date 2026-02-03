import z from "zod";

import { optionalFrenchDateToISO } from "@/app/utils/zodCustomFields";
import { ActeAdministratifCategory } from "@/types/file-upload.type";

export const acteAdministratifAutoSaveSchema = z.object({
  key: z.string().optional(),
  date: optionalFrenchDateToISO(),
  category: z.enum(ActeAdministratifCategory),
  startDate: optionalFrenchDateToISO(),
  endDate: optionalFrenchDateToISO(),
  categoryName: z.string().nullish(),
  parentFileUploadId: z.any().optional(),
  uuid: z.string().optional(),
});

const acteAdministratifSchema = acteAdministratifAutoSaveSchema
  .refine(
    (data) => {
      if (data.category !== "AUTRE" && !data.parentFileUploadId && data.key) {
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
      if (data.parentFileUploadId && data.key) {
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
      !data.parentFileUploadId
    ) {
      return !!data.key && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    message: "Ces documents sont obligatoires.",
    path: ["key"],
  }
);

const acteAdministratifSubventionneesSchema = acteAdministratifSchema.refine(
  (data) => {
    if (
      (data.category === "ARRETE_AUTORISATION" ||
        data.category === "ARRETE_TARIFICATION" ||
        data.category === "CONVENTION") &&
      !data.parentFileUploadId
    ) {
      return !!data.key && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    message: "Ces documents sont obligatoires.",
    path: ["key"],
  }
);

export const acteAdministratifCpomSchema = acteAdministratifSchema.refine(
  (data) => {
    if (data.category === "CPOM" && !data.parentFileUploadId) {
      return !!data.key && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    message: "Ces documents sont obligatoires.",
    path: ["key"],
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
