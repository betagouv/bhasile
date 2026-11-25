import z from "zod";

import { StructureType } from "@/types/structure.type";

const zOptionalId = () =>
  z.coerce.number().int().positive().optional().catch(undefined);

export const dnaCodesFiltersSchema = z.object({
  structureId: zOptionalId(),
  structureVersionId: zOptionalId(),
  transformationId: zOptionalId(),
  operateurId: zOptionalId(),
  departementAdministratif: z.string().min(1).optional().catch(undefined),
  type: z.enum(StructureType).optional().catch(undefined),
});
