import { StructureApiRead } from "@/schemas/api/structure.schema";

export const createOperateur = (
  structureId: number
): NonNullable<StructureApiRead["operateur"]> => ({
  structureDnaCode: `C000${structureId}`,
  id: 1,
  name: "Adoma",
});
