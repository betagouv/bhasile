import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";
import { DnaStructureFormValues } from "@/schemas/forms/base/dna.schema";

export const transformApiDnaStructuresToFormDnaStructures = (
  dnaStructures?: DnaStructureApiType[]
): DnaStructureFormValues[] | undefined => {
  return dnaStructures?.map((dnaStructure) => ({
    ...dnaStructure,
    startDate: dnaStructure.startDate ?? undefined,
    endDate: dnaStructure.endDate ?? undefined,
  }));
};
