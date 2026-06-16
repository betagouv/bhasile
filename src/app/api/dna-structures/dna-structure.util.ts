import {
  StructureDbDetails,
  StructureDbList,
} from "../structures/structure.db.type";

export const getDnaStructuresApiRead = (
  dnaStructures?:
    | StructureDbDetails["dnaStructures"]
    | StructureDbList["dnaStructures"]
) =>
  dnaStructures?.map((dnaStructure) => ({
    id: dnaStructure.id,
    startDate: dnaStructure.startDate ?? undefined,
    endDate: dnaStructure.endDate ?? undefined,
    dna: {
      code: dnaStructure.dna.code,
      description: dnaStructure.dna.description ?? undefined,
    },
  }));
