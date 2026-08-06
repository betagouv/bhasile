import { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";

export const getStructureFinessesApiRead = (
  structureFinesses?: StructureVersionDbDetails["structureFinesses"]
) =>
  structureFinesses?.map((structureFiness) => ({
    id: structureFiness.id,
    description: structureFiness.description ?? undefined,
    finess: {
      code: structureFiness.finess.code,
    },
  }));
