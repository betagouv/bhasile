import z from "zod";

import {
  nullishFrenchDateToISO,
  optionalFrenchDateToISO,
  zId,
} from "@/app/utils/zodCustomFields";
import { fileApiSchema } from "@/schemas/api/file.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StructureType } from "@/types/structure.type";

const acteAdministratifAutoSaveSchema = z.object({
  id: zId(),
  uuid: z.string().optional(), // The uuid is used to identify the acte administratif when it is not saved in the database (and so does not have an id)
  category: z.enum(ActeAdministratifCategory).optional(),
  structureType: z.enum(StructureType).nullish(),
  date: optionalFrenchDateToISO(),
  startDate: optionalFrenchDateToISO(),
  endDate: nullishFrenchDateToISO(),
  name: z.string().nullish(),
  parentId: zId(),
  parentUuid: z.string().optional(), // Used when parent is not saved yet (no id) - references parent.uuid
  fileUploads: z.array(fileApiSchema.partial()).optional(),
});

const SINGLE_DATE_CATEGORIES: ActeAdministratifCategory[] = [
  "RAPPORT_ACTIVITE_OPERATEUR",
  "STATUTS",
  "ARRETE_EXTENSION",
  "ARRETE_CONTRACTION",
];
const NO_DATE_CATEGORIES: ActeAdministratifCategory[] = [
  "FRAIS_DE_SIEGE",
  "AUTRE",
];

const requiresStartEndDate = (
  category: ActeAdministratifCategory | undefined
): boolean =>
  category !== undefined &&
  !NO_DATE_CATEGORIES.includes(category) &&
  !SINGLE_DATE_CATEGORIES.includes(category);

const acteAdministratifSchema = acteAdministratifAutoSaveSchema
  .extend({
    fileUploads: z.array(fileApiSchema).optional(),
  })
  .refine(
    (data) => {
      const isNotAvenant = !data.parentId && !data.parentUuid;
      if (
        requiresStartEndDate(data.category) &&
        isNotAvenant &&
        data.fileUploads?.length
      ) {
        return !!data.startDate;
      }
      return true;
    },
    {
      error: "Les dates de début et de fin sont obligatoires.",
      path: ["startDate"],
    }
  )
  .refine(
    (data) => {
      const isNotAvenant = !data.parentId && !data.parentUuid;
      if (
        requiresStartEndDate(data.category) &&
        isNotAvenant &&
        data.fileUploads?.length
      ) {
        return !!data.endDate;
      }
      return true;
    },
    {
      error: "Les dates de début et de fin sont obligatoires.",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      const isAvenant = data.parentId || data.parentUuid;
      if (isAvenant && data.fileUploads?.length) {
        return !!data.date;
      }
      return true;
    },
    {
      error: "La date est obligatoire pour les avenants.",
      path: ["date"],
    }
  )
  .refine(
    (data) => {
      if (
        SINGLE_DATE_CATEGORIES.includes(data.category!) &&
        data.fileUploads?.length
      ) {
        return !!data.date;
      }
      return true;
    },
    {
      error: "La date est obligatoire.",
      path: ["date"],
    }
  );

const acteAdministratifAutoriseesSchema = acteAdministratifSchema.refine(
  (data) => {
    const isNotAvenant = !data.parentId && !data.parentUuid;
    if (
      (data.category === "ARRETE_AUTORISATION" ||
        data.category === "ARRETE_TARIFICATION") &&
      isNotAvenant
    ) {
      return !!data.fileUploads?.length && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    error: "Ces documents sont obligatoires.",
    path: ["fileUploads"],
  }
);

const acteAdministratifSubventionneesSchema = acteAdministratifSchema.refine(
  (data) => {
    const isNotAvenant = !data.parentId && !data.parentUuid;
    if (data.category === "CONVENTION" && isNotAvenant) {
      return !!data.fileUploads?.length && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    error: "Ces documents sont obligatoires.",
    path: ["fileUploads"],
  }
);

export const acteAdministratifCpomSchema = acteAdministratifSchema.refine(
  (data) => {
    const isNotAvenant = !data.parentId && !data.parentUuid;
    if (data.category === "CONVENTION_CPOM" && isNotAvenant) {
      return !!data.fileUploads?.length && !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    error: "Ces documents sont obligatoires.",
    path: ["fileUploads"],
  }
);

export const filterActesWithKey =
  (allowedCategories: ActeAdministratifCategory[] = []) =>
  (val: unknown) =>
    Array.isArray(val)
      ? val.filter(
          (acte: {
            category?: string;
            fileUploads?: Array<{ key?: string }>;
          }) => {
            if (
              allowedCategories.includes(
                acte?.category as ActeAdministratifCategory
              )
            ) {
              return true;
            }
            return !!acte?.fileUploads?.[0]?.key;
          }
        )
      : val;

export const actesAdministratifsAutoriseesSchema = z.object({
  actesAdministratifs: z.preprocess(
    filterActesWithKey(["ARRETE_AUTORISATION", "ARRETE_TARIFICATION"]),
    z.array(acteAdministratifAutoriseesSchema).optional()
  ),
});
export const actesAdministratifsSubventionneesSchema = z.object({
  actesAdministratifs: z.preprocess(
    filterActesWithKey(["CONVENTION"]),
    z.array(acteAdministratifSubventionneesSchema).optional()
  ),
});

export const actesAdministratifsTransformationSchema = z.object({
  actesAdministratifs: z.preprocess(
    filterActesWithKey(),
    z.array(acteAdministratifSchema).optional()
  ),
});

export const actesAdministratifsFermetureSchema = z.object({
  actesAdministratifs: z.preprocess(
    filterActesWithKey(),
    z.array(acteAdministratifSchema).optional()
  ),
});

export const actesAdministratifsAutoSaveSchema = z.object({
  actesAdministratifs: z.preprocess(
    filterActesWithKey(),
    z.array(acteAdministratifAutoSaveSchema).optional()
  ),
});

export const actesAdministratifsOperateurSchema = z.object({
  actesAdministratifs: z.preprocess(
    filterActesWithKey(),
    z.array(acteAdministratifSchema).optional()
  ),
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

export type ActesAdministratifsTransformationFormValues = z.infer<
  typeof actesAdministratifsTransformationSchema
>;
