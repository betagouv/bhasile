import { z } from "zod";

import {
  TarificationDocumentStatus,
  TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";

const TARIFICATION_TEXT_MAX_LENGTH = 10_000;

export const tarificationDocumentApiCreateSchema = z.object({
  fileKey: z.string().min(1),
  types: z
    .array(z.enum(TarificationDocumentType))
    .min(1)
    .refine((types) => new Set(types).size === types.length, {
      error: "Un type n'apparaît qu'une fois",
    }),
  status: z.enum(TarificationDocumentStatus),
});

export type TarificationDocumentApiCreate = z.infer<
  typeof tarificationDocumentApiCreateSchema
>;

export const tarificationEventApiCreateSchema = z.object({
  type: z.enum(TarificationEventType).exclude(["DOCUMENT_DEPOSITED"]),
  documentId: z.number().int().positive().nullish().default(null),
  stepCode: z.enum(TarificationStepCode).nullish().default(null),
  text: z
    .string()
    .trim()
    .max(TARIFICATION_TEXT_MAX_LENGTH)
    .nullish()
    .transform((text) => text || null),
});

export type TarificationEventApiCreate = z.infer<
  typeof tarificationEventApiCreateSchema
>;
export type TarificationEventApiCreateClient = z.input<
  typeof tarificationEventApiCreateSchema
>;
