import { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";

export const getDnaStructuresApiRead = (
  dnaStructures?: StructureVersionDbDetails["dnaStructures"]
) =>
  dnaStructures?.map((dnaStructure) => ({
    id: dnaStructure.id,
    description: dnaStructure.description ?? undefined,
    startDate: dnaStructure.startDate ?? undefined,
    endDate: dnaStructure.endDate ?? undefined,
    dna: {
      code: dnaStructure.dna.code,
    },
  }));
