import { StructureDbDetails } from "../structures/structure.db.type";

export const getStructureFinessesApiRead = (
  structureFinesses?: StructureDbDetails["structureFinesses"]
) =>
  structureFinesses?.map((structureFiness) => ({
    id: structureFiness.id,
    description: structureFiness.description ?? undefined,
    finess: {
      code: structureFiness.finess.code,
    },
  }));
