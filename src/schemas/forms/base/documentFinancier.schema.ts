import { z } from "zod";

import {
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import {
  getDocumentsFinanciersYearRange,
  getYearFromDate,
} from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  nullishFrenchDateToISO,
  optionalFrenchDateToISO,
  zId,
  zSafeYear,
} from "@/app/utils/zodCustomFields";
import { fileApiSchema } from "@/schemas/api/file.schema";
import {
  DocumentFinancierCategory,
  DocumentFinancierGranularity,
} from "@/types/document-financier.type";
import { StructureType } from "@/types/structure.type";

const DocumentFinancierSchema = z.object({
  id: zId(),
  year: zSafeYear(),
  category: z.enum(DocumentFinancierCategory).optional(),
  granularity: z.enum(DocumentFinancierGranularity).optional(),
  name: z.string().nullish(),
  fileUploads: z.array(fileApiSchema).optional(),
});

export const DocumentsFinanciersSchema = z.object({
  creationDate: optionalFrenchDateToISO(),
  date303: nullishFrenchDateToISO(),
  documentsFinanciers: z.array(DocumentFinancierSchema).optional(),
  structureMillesimes: z
    .array(
      z.object({
        year: zSafeYear(),
        cpom: z.boolean(),
        operateurComment: z.string().nullish(),
      })
    )
    .optional(),
});

export const DocumentsFinanciersFlexibleSchema =
  DocumentsFinanciersSchema.refine(
    (data) => {
      if (data.creationDate && data.date303) {
        return data.creationDate <= data.date303;
      }
      return true;
    },
    {
      message:
        "La date de création de la structure doit être antérieure à la date de rattachement au programme 303",
      path: ["date303"],
    }
  );

export const DocumentsFinanciersStrictSchema = DocumentsFinanciersSchema.extend(
  {
    type: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.nativeEnum(StructureType)
    ),
  }
)
  .refine(
    (data) => {
      if (data.creationDate && data.date303) {
        return data.creationDate <= data.date303;
      }
      return true;
    },
    {
      message:
        "La date de création de la structure doit être antérieure à la date de rattachement au programme 303",
      path: ["date303"],
    }
  )
  .superRefine((data, ctx) => {
    const isAutorisee = isStructureAutorisee(data.type);
    const documents = isAutorisee
      ? structureAutoriseesDocuments
      : structureSubventionneesDocuments;

    const { years } = getDocumentsFinanciersYearRange({ isAutorisee });

    const referenceYear = Number(
      getYearFromDate(data.date303 ?? data.creationDate)
    );

    years.forEach((year, index) => {
      if (year >= referenceYear) {
        documents.forEach((document) => {
          const documentIsRequired =
            document.required && index >= document.yearIndex;
          if (documentIsRequired) {
            const requiredDocument = data.documentsFinanciers?.find(
              (documentFinancier) =>
                documentFinancier.category === document.value &&
                documentFinancier.year === year
            );
            if (!requiredDocument) {
              ctx.addIssue({
                path: ["documentsFinanciers", year],
                code: z.ZodIssueCode.custom,
                message: "Ce champ est requis",
              });
            }
          }
        });
      }
    });
  });

export type DocumentFinancierFlexibleFormValues = z.infer<
  typeof DocumentFinancierSchema
>;

export type DocumentsFinanciersFlexibleFormValues = z.infer<
  typeof DocumentsFinanciersFlexibleSchema
>;
