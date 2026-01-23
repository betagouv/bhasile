import z from "zod";

import { structureMinimalApiSchema } from "@/schemas/api/structure.schema";
import { StructureType } from "@/types/structure.type";

const departementSchema = z.object({
  numero: z.string(),
  name: z.string(),
});

const operateurSchema = z.object({
  id: zId(),
  name: z.string(),
});

export const ajoutStructureSchema = z.object({
  departement: departementSchema,
  operateur: operateurSchema,
  type: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.nativeEnum(StructureType)
  ),
  structure: structureMinimalApiSchema,
});
