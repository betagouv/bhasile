import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";
import { StructureType } from "@/types/structure.type";

export const structureBaseSchema = z.object({
  id: zId(),
  codeBhasile: z.string().optional(),
  type: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.nativeEnum(StructureType)
  ),
});

export type StructureBaseFormValues = z.infer<typeof structureBaseSchema>;
